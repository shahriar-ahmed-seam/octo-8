/**
 * Message types for communicating between the main thread and the CPU Web Worker.
 * 
 * Main Thread → Worker: Commands
 * Worker → Main Thread: State updates
 */

import type { CPUState } from './cpu.ts';

// ─── Commands (Main → Worker) ─────────────────────────────

export type WorkerCommand =
  | { type: 'LOAD_ROM'; rom: Uint8Array }
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'STEP' }
  | { type: 'RESET' }
  | { type: 'LOAD_STATE'; snapshot: CPUState }
  | { type: 'SET_SPEED'; cyclesPerFrame: number }
  | { type: 'SET_BREAKPOINTS'; breakpoints: number[] }
  | { type: 'KEY_DOWN'; key: number }
  | { type: 'KEY_UP'; key: number }
  | { type: 'GET_STATE' };

// ─── Events (Worker → Main) ──────────────────────────────

export type WorkerEvent =
  | { type: 'STATE_UPDATE'; state: CPUState }
  | { type: 'DISPLAY_UPDATE'; display: Uint8Array }
  | { type: 'SOUND'; playing: boolean }
  | { type: 'ERROR'; message: string }
  | { type: 'BREAKPOINT'; address: number }
  | { type: 'HALTED'; reason: string };
