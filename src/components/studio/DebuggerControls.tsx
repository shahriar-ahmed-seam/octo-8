/**
 * DebuggerControls — the transport bar: load ROM, run/pause, step, reset,
 * save/restore a state snapshot, and adjust clock speed.
 */

import { useRef, useCallback } from 'react';
import type { EmulatorControls } from '../../hooks/useEmulator';
import Icon from '../ui/Icon';

interface DebuggerControlsProps {
  controls: EmulatorControls;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onLoadFile: (file: File) => void;
}

export default function DebuggerControls({
  controls,
  speed,
  onSpeedChange,
  onLoadFile,
}: DebuggerControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileLoad = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onLoadFile(file);
      e.target.value = '';
    },
    [onLoadFile],
  );

  const handleSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      onSpeedChange(val);
      controls.setSpeed(val);
    },
    [controls, onSpeedChange],
  );

  return (
    <section className="panel controls-panel">
      <div className="controls-row">
        <input
          ref={fileInputRef}
          type="file"
          accept=".ch8,.rom,.bin"
          onChange={handleFileLoad}
          style={{ display: 'none' }}
        />
        <button
          className="control-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Load a ROM file (.ch8, .rom, .bin)"
        >
          <Icon name="upload" size={16} /> <span>Load</span>
        </button>

        <div className="controls-divider" />

        {controls.running ? (
          <button className="control-btn pause-btn" onClick={controls.stop} title="Pause (Esc)">
            <Icon name="pause" size={16} /> <span>Pause</span>
          </button>
        ) : (
          <button
            className="control-btn play-btn"
            onClick={controls.start}
            disabled={!controls.romLoaded}
            title="Run / resume (F5)"
          >
            <Icon name="play" size={16} /> <span>Run</span>
          </button>
        )}

        <button
          className="control-btn"
          onClick={controls.step}
          disabled={controls.running || !controls.romLoaded}
          title="Step one instruction (F10)"
        >
          <Icon name="step" size={16} /> <span>Step</span>
        </button>

        <button className="control-btn" onClick={controls.reset} title="Reset CPU">
          <Icon name="reset" size={16} /> <span>Reset</span>
        </button>

        <div className="controls-divider" />

        <button
          className="control-btn icon-only"
          onClick={controls.saveSnapshot}
          disabled={!controls.romLoaded}
          title="Save state snapshot"
        >
          <Icon name="save" size={16} />
        </button>
        <button
          className="control-btn icon-only"
          onClick={controls.restoreSnapshot}
          disabled={!controls.hasSnapshot}
          title="Restore saved snapshot"
        >
          <Icon name="restore" size={16} />
        </button>
      </div>

      <div className="speed-control">
        <div className="speed-label">
          <span>Clock</span>
          <strong>{speed} cyc/frame</strong>
          <span className="speed-hz">≈ {(speed * 60).toLocaleString()} Hz</span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={speed}
          onChange={handleSpeedChange}
          className="speed-slider"
        />
      </div>
    </section>
  );
}
