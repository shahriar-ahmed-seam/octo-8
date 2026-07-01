/**
 * AssistantPanel — chat UI for the on-device AI companion (Ollama).
 *
 * Streams responses token-by-token, is aware of live CPU state, and offers
 * one-tap prompts for common debugging questions. A small settings popover
 * lets the user point at a local Ollama or a hosted proxy.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CPUState } from '../../core/cpu';
import {
  chatStream,
  checkConnection,
  loadSettings,
  saveSettings,
  type AssistantSettings,
  type ChatMessage,
  type ConnectionStatus,
} from '../../ai/assistant';
import Icon from '../ui/Icon';

interface AssistantPanelProps {
  state: CPUState | null;
}

const QUICK_PROMPTS = [
  'Explain the instruction at the current PC.',
  'What is this program doing right now?',
  'Summarize the current register state.',
  'What are common CHIP-8 quirks to watch for?',
];

export default function AssistantPanel({ state }: AssistantPanelProps) {
  const [settings, setSettings] = useState<AssistantSettings>(() => loadSettings());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const refreshStatus = useCallback(async () => {
    setStatus(await checkConnection(loadSettings()));
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const next: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
      setMessages([...next, { role: 'assistant', content: '' }]);
      setInput('');
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await chatStream({
          settings,
          messages: next,
          state: stateRef.current,
          signal: controller.signal,
          onToken: (chunk) => {
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = { ...last, content: last.content + chunk };
              return copy;
            });
          },
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: 'assistant',
              content:
                `⚠️ ${(err as Error).message}\n\n` +
                'Tip: run `ollama serve` locally with `OLLAMA_ORIGINS=*`, then `ollama pull gemma3:4b`. ' +
                'Or configure a proxy in settings.',
            };
            return copy;
          });
          void refreshStatus();
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, messages, settings, refreshStatus],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setBusy(false);
  }, []);

  const persistSettings = useCallback((s: AssistantSettings) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  return (
    <section className="panel assistant-panel">
      <div className="panel-header">
        <span className="panel-title">
          <Icon name="sparkles" size={15} /> AI Assistant
        </span>
        <div className="assistant-header-actions">
          <span
            className={`assistant-status ${status?.ok ? 'ok' : 'off'}`}
            title={status?.detail ?? 'Checking…'}
          >
            <span className="status-dot" />
            {status?.ok ? (status.via === 'proxy' ? 'Proxy' : 'Local') : 'Offline'}
          </span>
          <button
            className="icon-btn"
            onClick={() => setShowSettings((s) => !s)}
            title="Assistant settings"
          >
            <Icon name="gear" size={15} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="assistant-settings">
          <label>
            Connection
            <select
              value={settings.mode}
              onChange={(e) =>
                persistSettings({ ...settings, mode: e.target.value as AssistantSettings['mode'] })
              }
            >
              <option value="auto">Auto (proxy → local)</option>
              <option value="proxy">Proxy only</option>
              <option value="direct">Local Ollama only</option>
            </select>
          </label>
          <label>
            Ollama URL
            <input
              type="text"
              value={settings.ollamaUrl}
              onChange={(e) => persistSettings({ ...settings, ollamaUrl: e.target.value })}
              placeholder="http://localhost:11434"
            />
          </label>
          <label>
            Model
            <input
              type="text"
              value={settings.model}
              onChange={(e) => persistSettings({ ...settings, model: e.target.value })}
              placeholder="gemma3:4b"
            />
          </label>
          <button className="mini-btn" onClick={() => void refreshStatus()}>
            Test connection
          </button>
          {status && <p className="assistant-detail">{status.detail}</p>}
        </div>
      )}

      <div className="assistant-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="assistant-empty">
            <Icon name="sparkles" size={26} />
            <p>Ask about opcodes, registers, or what the loaded ROM is doing.</p>
            <div className="assistant-quick">
              {QUICK_PROMPTS.map((q) => (
                <button key={q} className="quick-chip" onClick={() => void send(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            <span className="chat-role">{m.role === 'user' ? 'You' : 'OCTO'}</span>
            <div className="chat-bubble">
              {m.content || (busy && i === messages.length - 1 ? <span className="typing" /> : '')}
            </div>
          </div>
        ))}
      </div>

      <form
        className="assistant-input"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask OCTO about the machine…"
          disabled={busy}
        />
        {busy ? (
          <button type="button" className="send-btn stop" onClick={stop} title="Stop">
            <Icon name="close" size={16} />
          </button>
        ) : (
          <button type="submit" className="send-btn" title="Send" disabled={!input.trim()}>
            <Icon name="send" size={16} />
          </button>
        )}
      </form>
    </section>
  );
}
