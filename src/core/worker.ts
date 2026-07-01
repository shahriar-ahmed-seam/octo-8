/**
 * CHIP-8 CPU Web Worker
 * 
 * Runs the fetch-decode-execute loop in a separate thread.
 * Communicates with the main thread via postMessage for state updates.
 * 
 * The emulation loop runs at ~60fps, executing `cyclesPerFrame` CPU cycles
 * per animation frame, then sends the updated state back to the UI.
 */

import { Chip8CPU } from './cpu.ts';
import type { WorkerCommand, WorkerEvent } from './messages.ts';

const cpu = new Chip8CPU();

let running = false;
let cyclesPerFrame = 10; // ~600 instructions/sec at 60fps
let timerIntervalId: ReturnType<typeof setInterval> | null = null;
let loopTimeoutId: ReturnType<typeof setTimeout> | null = null;
const breakpoints = new Set<number>();
let justResumed = false;

function sendEvent(event: WorkerEvent) {
  self.postMessage(event);
}

function sendState() {
  sendEvent({ type: 'STATE_UPDATE', state: cpu.getState() });
}

/**
 * Main emulation loop — runs in a setTimeout loop instead of rAF 
 * (rAF is not available in Workers).
 * Targets ~60 iterations/sec (16.67ms per frame).
 */
function emulationLoop() {
  if (!running) return;

  // Execute N cycles per "frame"
  for (let i = 0; i < cyclesPerFrame; i++) {
    if (cpu.halted) {
      running = false;
      sendEvent({ type: 'HALTED', reason: 'CPU halted (stack overflow or invalid opcode)' });
      sendState();
      return;
    }

    // Breakpoint: pause before executing the instruction at a marked address.
    // `justResumed` lets execution leave a breakpoint the user is sitting on.
    if (breakpoints.has(cpu.PC) && !justResumed) {
      running = false;
      if (loopTimeoutId !== null) {
        clearTimeout(loopTimeoutId);
        loopTimeoutId = null;
      }
      sendEvent({ type: 'BREAKPOINT', address: cpu.PC });
      sendState();
      return;
    }
    justResumed = false;

    cpu.emulateCycle();
  }

  // Send state to UI for rendering
  sendState();

  // Check sound
  sendEvent({ type: 'SOUND', playing: cpu.soundFlag });

  // Schedule next frame (~60fps)
  loopTimeoutId = setTimeout(emulationLoop, 1000 / 60);
}

function startTimers() {
  // Timers decrement at 60Hz
  if (timerIntervalId === null) {
    timerIntervalId = setInterval(() => {
      if (running) {
        cpu.updateTimers();
      }
    }, 1000 / 60);
  }
}

function stopTimers() {
  if (timerIntervalId !== null) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function start() {
  if (running) return;
  running = true;
  justResumed = true;
  startTimers();
  emulationLoop();
}

function stop() {
  running = false;
  if (loopTimeoutId !== null) {
    clearTimeout(loopTimeoutId);
    loopTimeoutId = null;
  }
  stopTimers();
  sendState();
}

// ─── Message Handler ─────────────────────────────────────

self.onmessage = (e: MessageEvent<WorkerCommand>) => {
  const cmd = e.data;

  switch (cmd.type) {
    case 'LOAD_ROM':
      stop();
      try {
        cpu.loadROM(new Uint8Array(cmd.rom));
        sendState();
      } catch (err) {
        sendEvent({ type: 'ERROR', message: (err as Error).message });
      }
      break;

    case 'START':
      start();
      break;

    case 'STOP':
      stop();
      break;

    case 'STEP':
      if (running) stop();
      cpu.emulateCycle();
      cpu.updateTimers();
      sendState();
      break;

    case 'RESET':
      stop();
      cpu.reset();
      sendState();
      break;

    case 'LOAD_STATE':
      stop();
      try {
        cpu.restore(cmd.snapshot);
        sendState();
      } catch (err) {
        sendEvent({ type: 'ERROR', message: (err as Error).message });
      }
      break;

    case 'SET_SPEED':
      cyclesPerFrame = Math.max(1, Math.min(100, cmd.cyclesPerFrame));
      break;

    case 'SET_BREAKPOINTS':
      breakpoints.clear();
      for (const bp of cmd.breakpoints) breakpoints.add(bp);
      break;

    case 'KEY_DOWN':
      cpu.setKey(cmd.key, true);
      break;

    case 'KEY_UP':
      cpu.setKey(cmd.key, false);
      break;

    case 'GET_STATE':
      sendState();
      break;
  }
};

// Send initial state
sendState();
