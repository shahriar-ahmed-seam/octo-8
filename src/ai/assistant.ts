/**
 * assistant.ts — On-device AI companion for OCTO-8.
 *
 * The assistant talks to an Ollama server running a small local model
 * (default: `gemma3:4b`). It works in two modes:
 *
 *   • direct  — the browser talks straight to Ollama (great for local dev,
 *               `http://localhost:11434`). Requires `OLLAMA_ORIGINS=*`.
 *   • proxy   — the browser talks to a same-origin serverless function
 *               (`/api/assistant`) which forwards to an Ollama instance
 *               configured via the `OLLAMA_URL` env var (e.g. hosted on
 *               Render). This is what the deployed site uses.
 *
 * `mode: 'auto'` prefers the proxy when it answers a health check, otherwise
 * falls back to a direct local connection.
 */

import type { CPUState } from '../core/cpu';
import { disassemble } from '../core/disassembler';

export type AssistantMode = 'auto' | 'direct' | 'proxy';

export interface AssistantSettings {
  mode: AssistantMode;
  ollamaUrl: string;
  model: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'octo8.assistant.settings';

export const DEFAULT_SETTINGS: AssistantSettings = {
  mode: 'auto',
  ollamaUrl: 'http://localhost:11434',
  model: 'gemma3:4b',
};

export function loadSettings(): AssistantSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AssistantSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

const PROXY_ENDPOINT = '/api/assistant';

/** Resolve where chat requests should be sent, honoring the selected mode. */
async function resolveEndpoint(
  settings: AssistantSettings,
): Promise<{ kind: 'proxy' | 'direct'; url: string }> {
  const proxyOk = async () => {
    try {
      const res = await fetch(`${PROXY_ENDPOINT}?health=1`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  };

  if (settings.mode === 'proxy') return { kind: 'proxy', url: PROXY_ENDPOINT };
  if (settings.mode === 'direct') return { kind: 'direct', url: `${settings.ollamaUrl}/api/chat` };

  // auto
  if (await proxyOk()) return { kind: 'proxy', url: PROXY_ENDPOINT };
  return { kind: 'direct', url: `${settings.ollamaUrl}/api/chat` };
}

export interface ConnectionStatus {
  ok: boolean;
  via: 'proxy' | 'direct' | 'none';
  detail: string;
}

/** Probe whether a working assistant backend is reachable. */
export async function checkConnection(settings: AssistantSettings): Promise<ConnectionStatus> {
  // Try proxy first when allowed.
  if (settings.mode !== 'direct') {
    try {
      const res = await fetch(`${PROXY_ENDPOINT}?health=1`);
      if (res.ok) return { ok: true, via: 'proxy', detail: 'Connected via serverless proxy' };
    } catch {
      /* fall through */
    }
    if (settings.mode === 'proxy') {
      return { ok: false, via: 'none', detail: 'Proxy endpoint unavailable' };
    }
  }

  // Direct Ollama.
  try {
    const res = await fetch(`${settings.ollamaUrl}/api/tags`);
    if (res.ok) {
      const data = await res.json();
      const models: string[] = (data.models ?? []).map((m: { name: string }) => m.name);
      const hasModel = models.some((m) => m.startsWith(settings.model.split(':')[0]));
      return {
        ok: true,
        via: 'direct',
        detail: hasModel
          ? `Local Ollama ready · ${settings.model}`
          : `Ollama reachable, but "${settings.model}" not pulled`,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    ok: false,
    via: 'none',
    detail: 'No backend reachable. Start Ollama or configure a proxy.',
  };
}

const SYSTEM_PROMPT = `You are OCTO, the built-in AI assistant for OCTO-8, a CHIP-8 emulator and visual debugger.
You are an expert on the CHIP-8 virtual machine: its 4KB memory map, 16 V registers, I/PC/SP registers, delay/sound timers, the 16-key hex keypad, the 64x32 monochrome display, and the full 35-opcode instruction set.
Help the user understand what a program is doing, explain opcodes and register state, and suggest debugging steps.
Be concise and precise. Use short paragraphs and inline code for opcodes and values. Never invent opcodes that are not part of CHIP-8.`;

/** Build a compact, human-readable snapshot of CPU state for the model. */
export function describeState(state: CPUState | null): string {
  if (!state) return 'No ROM is currently loaded.';

  const regs = Array.from(state.V)
    .map((v, i) => `V${i.toString(16).toUpperCase()}=0x${v.toString(16).padStart(2, '0').toUpperCase()}`)
    .join(' ');

  const around: string[] = [];
  for (let a = state.PC - 4; a <= state.PC + 6; a += 2) {
    if (a < 0) continue;
    const op = (state.memory[a] << 8) | state.memory[a + 1];
    const marker = a === state.PC ? '  <-- PC' : '';
    around.push(
      `  0x${a.toString(16).padStart(3, '0').toUpperCase()}: ${op
        .toString(16)
        .padStart(4, '0')
        .toUpperCase()}  ${disassemble(op)}${marker}`,
    );
  }

  return [
    `PC=0x${state.PC.toString(16).toUpperCase()} I=0x${state.I.toString(16).toUpperCase()} SP=${state.SP} DT=${state.DT} ST=${state.ST}`,
    `Last opcode: 0x${state.lastOpcode.toString(16).padStart(4, '0').toUpperCase()} (${disassemble(state.lastOpcode)})`,
    `Registers: ${regs}`,
    `Cycles executed: ${state.cycleCount}`,
    `Status: ${state.halted ? 'HALTED' : state.waitingForKey ? 'WAITING FOR KEY' : 'ready'}`,
    'Disassembly around PC:',
    ...around,
  ].join('\n');
}

export interface ChatOptions {
  settings: AssistantSettings;
  messages: ChatMessage[];
  state?: CPUState | null;
  signal?: AbortSignal;
  onToken: (chunk: string) => void;
}

/**
 * Stream a chat completion. Prepends the system prompt + a live state snapshot,
 * then relays tokens to `onToken` as they arrive.
 */
export async function chatStream(opts: ChatOptions): Promise<void> {
  const { settings, messages, state, signal, onToken } = opts;
  const endpoint = await resolveEndpoint(settings);

  const fullMessages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: `Current machine state:\n${describeState(state ?? null)}` },
    ...messages,
  ];

  const body =
    endpoint.kind === 'proxy'
      ? JSON.stringify({ model: settings.model, messages: fullMessages })
      : JSON.stringify({ model: settings.model, messages: fullMessages, stream: true });

  const res = await fetch(endpoint.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Assistant request failed (${res.status}). ${await safeText(res)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Ollama streams newline-delimited JSON objects.
    let nl: number;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        const obj = JSON.parse(line);
        const token = obj.message?.content ?? obj.response ?? '';
        if (token) onToken(token);
      } catch {
        /* partial line — ignore */
      }
    }
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 200);
  } catch {
    return '';
  }
}
