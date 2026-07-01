/**
 * useEmulator — React hook that manages the Web Worker lifecycle
 * and provides reactive CPU state + control functions to the UI.
 *
 * It also bridges the worker's SOUND events to the Web Audio buzzer and
 * supports in-memory state snapshots (save/restore).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CPUState } from '../core/cpu';
import type { WorkerCommand, WorkerEvent } from '../core/messages';
import { beeper } from '../audio/beeper';

export interface EmulatorControls {
  state: CPUState | null;
  running: boolean;
  romLoaded: boolean;
  hasSnapshot: boolean;
  loadROM: (rom: Uint8Array) => void;
  start: () => void;
  stop: () => void;
  step: () => void;
  reset: () => void;
  setSpeed: (cyclesPerFrame: number) => void;
  setBreakpoints: (breakpoints: number[]) => void;
  breakpointAddress: number | null;
  clearBreakpointFlag: () => void;
  keyDown: (key: number) => void;
  keyUp: (key: number) => void;
  saveSnapshot: () => void;
  restoreSnapshot: () => void;
}

export function useEmulator(): EmulatorControls {
  const workerRef = useRef<Worker | null>(null);
  const stateRef = useRef<CPUState | null>(null);
  const snapshotRef = useRef<CPUState | null>(null);
  const [state, setState] = useState<CPUState | null>(null);
  const [running, setRunning] = useState(false);
  const [romLoaded, setRomLoaded] = useState(false);
  const [hasSnapshot, setHasSnapshot] = useState(false);
  const [breakpointAddress, setBreakpointAddress] = useState<number | null>(null);

  // Create worker on mount
  useEffect(() => {
    const worker = new Worker(new URL('../core/worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e: MessageEvent<WorkerEvent>) => {
      const event = e.data;
      switch (event.type) {
        case 'STATE_UPDATE':
          stateRef.current = event.state;
          setState(event.state);
          break;
        case 'HALTED':
          setRunning(false);
          beeper.setPlaying(false);
          break;
        case 'BREAKPOINT':
          setRunning(false);
          beeper.setPlaying(false);
          setBreakpointAddress(event.address);
          break;
        case 'ERROR':
          console.error('[OCTO-8 Worker Error]', event.message);
          break;
        case 'SOUND':
          beeper.setPlaying(event.playing);
          break;
      }
    };

    worker.onerror = (err) => {
      console.error('[OCTO-8 Worker]', err);
    };

    workerRef.current = worker;

    return () => {
      beeper.setPlaying(false);
      worker.terminate();
    };
  }, []);

  const send = useCallback((cmd: WorkerCommand) => {
    workerRef.current?.postMessage(cmd);
  }, []);

  const loadROM = useCallback(
    (rom: Uint8Array) => {
      setRunning(false);
      setRomLoaded(true);
      beeper.setPlaying(false);
      send({ type: 'LOAD_ROM', rom });
    },
    [send],
  );

  const start = useCallback(() => {
    beeper.resume();
    setRunning(true);
    send({ type: 'START' });
  }, [send]);

  const stop = useCallback(() => {
    setRunning(false);
    beeper.setPlaying(false);
    send({ type: 'STOP' });
  }, [send]);

  const step = useCallback(() => {
    setRunning(false);
    beeper.setPlaying(false);
    send({ type: 'STEP' });
  }, [send]);

  const reset = useCallback(() => {
    setRunning(false);
    beeper.setPlaying(false);
    send({ type: 'RESET' });
  }, [send]);

  const setSpeed = useCallback(
    (cyclesPerFrame: number) => {
      send({ type: 'SET_SPEED', cyclesPerFrame });
    },
    [send],
  );

  const setBreakpoints = useCallback(
    (breakpoints: number[]) => {
      send({ type: 'SET_BREAKPOINTS', breakpoints });
    },
    [send],
  );

  const clearBreakpointFlag = useCallback(() => setBreakpointAddress(null), []);

  const keyDown = useCallback((key: number) => send({ type: 'KEY_DOWN', key }), [send]);
  const keyUp = useCallback((key: number) => send({ type: 'KEY_UP', key }), [send]);

  const saveSnapshot = useCallback(() => {
    if (stateRef.current) {
      snapshotRef.current = stateRef.current;
      setHasSnapshot(true);
    }
  }, []);

  const restoreSnapshot = useCallback(() => {
    if (snapshotRef.current) {
      setRunning(false);
      beeper.setPlaying(false);
      send({ type: 'LOAD_STATE', snapshot: snapshotRef.current });
    }
  }, [send]);

  return {
    state,
    running,
    romLoaded,
    hasSnapshot,
    loadROM,
    start,
    stop,
    step,
    reset,
    setSpeed,
    setBreakpoints,
    breakpointAddress,
    clearBreakpointFlag,
    keyDown,
    keyUp,
    saveSnapshot,
    restoreSnapshot,
  };
}
