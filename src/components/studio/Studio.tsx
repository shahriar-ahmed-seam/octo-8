/**
 * Studio — the emulator workspace.
 *
 * Left column: the display, transport controls, ROM library, and keypad.
 * Right column: a tabbed developer-tools suite (registers/stack, disassembly,
 * memory inspector, heatmap) plus the AI assistant.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useEmulator } from '../../hooks/useEmulator';
import { useToast } from '../../hooks/useToast';
import Display from './Display';
import Registers from './Registers';
import MemoryHeatmap from './MemoryHeatmap';
import StackViewer from './StackViewer';
import Disassembly from './Disassembly';
import DebuggerControls from './DebuggerControls';
import Keypad, { KEY_MAP } from './Keypad';
import MemoryInspector from './MemoryInspector';
import AssistantPanel from './AssistantPanel';
import Icon, { type IconName } from '../ui/Icon';
import Toasts from '../ui/Toasts';
import { DEMO_ROMS, romBytes } from '../../roms/demos';
import { DISPLAY_THEMES, getTheme, DEFAULT_THEME_ID } from '../../data/themes';
import { beeper } from '../../audio/beeper';

type DebugTab = 'inspect' | 'disassembly' | 'memory' | 'heatmap' | 'assistant';

interface StudioProps {
  onExit: () => void;
}

const TABS: Array<{ id: DebugTab; label: string; icon: IconName }> = [
  { id: 'inspect', label: 'Inspect', icon: 'registers' },
  { id: 'disassembly', label: 'Disassembly', icon: 'code' },
  { id: 'memory', label: 'Memory', icon: 'memory' },
  { id: 'heatmap', label: 'Heatmap', icon: 'map' },
  { id: 'assistant', label: 'Assistant', icon: 'sparkles' },
];

export default function Studio({ onExit }: StudioProps) {
  const controls = useEmulator();
  const { toasts, push, dismiss } = useToast();
  const [speed, setSpeed] = useState(10);
  const [activeTab, setActiveTab] = useState<DebugTab>('inspect');
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [crt, setCrt] = useState(true);
  const [muted, setMuted] = useState(false);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [romName, setRomName] = useState<string | null>(null);
  const theme = useMemo(() => getTheme(themeId), [themeId]);

  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  // ── Keyboard input + shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const c = controlsRef.current;
      const key = KEY_MAP[e.key.toLowerCase()];
      if (key !== undefined) {
        e.preventDefault();
        c.keyDown(key);
      }
      if (e.key === 'F5') {
        e.preventDefault();
        c.running ? c.stop() : c.start();
      }
      if (e.key === 'F10') {
        e.preventDefault();
        c.step();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        c.stop();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.key.toLowerCase()];
      if (key !== undefined) {
        e.preventDefault();
        controlsRef.current.keyUp(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ── Breakpoint hit notifications ──
  useEffect(() => {
    if (controls.breakpointAddress !== null) {
      push(
        `Paused at breakpoint 0x${controls.breakpointAddress.toString(16).toUpperCase()}`,
        'warning',
      );
      controls.clearBreakpointFlag();
    }
  }, [controls, push]);

  const loadDemo = useCallback(
    (hex: string, name: string) => {
      controls.loadROM(romBytes(hex));
      setRomName(name);
      push(`Loaded "${name}"`, 'success');
    },
    [controls, push],
  );

  const loadFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        controls.loadROM(new Uint8Array(reader.result as ArrayBuffer));
        setRomName(file.name);
        push(`Loaded "${file.name}"`, 'success');
      };
      reader.onerror = () => push('Failed to read ROM file', 'error');
      reader.readAsArrayBuffer(file);
    },
    [controls, push],
  );

  const toggleBreakpoint = useCallback(
    (address: number) => {
      setBreakpoints((prev) => {
        const next = new Set(prev);
        if (next.has(address)) next.delete(address);
        else next.add(address);
        controls.setBreakpoints([...next]);
        return next;
      });
    },
    [controls],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      beeper.setMuted(next);
      return next;
    });
  }, []);

  const status = controls.running
    ? 'running'
    : controls.state?.halted
      ? 'halted'
      : controls.state?.waitingForKey
        ? 'waiting'
        : 'paused';

  return (
    <div className="studio">
      {/* ── Header ── */}
      <header className="studio-header">
        <div className="header-left">
          <button className="brand-btn" onClick={onExit} title="Back to home">
            <span className="brand-mark">
              <Icon name="chip" size={18} />
            </span>
            <span className="brand-name">OCTO-8</span>
          </button>
          {romName && <span className="rom-chip">{romName}</span>}
        </div>

        <div className="header-center">
          <div className={`status-indicator ${status}`}>
            <span className="status-dot" />
            <span className="status-text">{status.toUpperCase()}</span>
          </div>
          {controls.state && (
            <span className="cycle-counter">
              Cycle #{controls.state.cycleCount.toLocaleString()}
            </span>
          )}
        </div>

        <div className="header-right">
          <div className="theme-swatches" title="Display theme">
            {DISPLAY_THEMES.map((t) => (
              <button
                key={t.id}
                className={`swatch ${themeId === t.id ? 'active' : ''}`}
                style={{ background: t.on }}
                onClick={() => setThemeId(t.id)}
                title={t.name}
                aria-label={t.name}
              />
            ))}
          </div>
          <button
            className={`icon-btn ${crt ? 'active' : ''}`}
            onClick={() => setCrt((c) => !c)}
            title="Toggle CRT effect"
          >
            <Icon name="display" size={16} />
          </button>
          <button className="icon-btn" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
            <Icon name={muted ? 'mute' : 'volume'} size={16} />
          </button>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="studio-main">
        <div className="left-column">
          <Display
            display={controls.romLoaded ? (controls.state?.display ?? null) : null}
            theme={theme}
            crt={crt}
          />

          <DebuggerControls
            controls={controls}
            speed={speed}
            onSpeedChange={setSpeed}
            onLoadFile={loadFile}
          />

          <section className="panel demo-panel">
            <div className="panel-header">
              <span className="panel-title">
                <Icon name="gamepad" size={15} /> ROM Library
              </span>
            </div>
            <div className="demo-list">
              {DEMO_ROMS.map((rom) => (
                <button
                  key={rom.name}
                  className="demo-btn"
                  onClick={() => loadDemo(rom.hex, rom.name)}
                  title={rom.description}
                >
                  <span className="demo-name">{rom.name}</span>
                  <span className={`demo-tag ${rom.category}`}>{rom.category}</span>
                </button>
              ))}
            </div>
          </section>

          <Keypad state={controls.state} onKeyDown={controls.keyDown} onKeyUp={controls.keyUp} />
        </div>

        <div className="right-column">
          <div className="devtools-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`devtools-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon name={tab.icon} size={15} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="devtools-content">
            {activeTab === 'inspect' && (
              <div className="devtools-split">
                <Registers state={controls.state} />
                <StackViewer state={controls.state} />
              </div>
            )}
            {activeTab === 'disassembly' && (
              <Disassembly
                state={controls.state}
                breakpoints={breakpoints}
                onToggleBreakpoint={toggleBreakpoint}
              />
            )}
            {activeTab === 'memory' && <MemoryInspector state={controls.state} />}
            {activeTab === 'heatmap' && <MemoryHeatmap state={controls.state} />}
            {activeTab === 'assistant' && <AssistantPanel state={controls.state} />}
          </div>
        </div>
      </div>

      <footer className="studio-footer">
        <span>Web Worker CPU · all 35 instructions</span>
        <span className="dot">·</span>
        <span>F5 Run/Pause · F10 Step · Esc Stop</span>
        <span className="dot">·</span>
        <span>Click a disassembly line to toggle a breakpoint</span>
      </footer>

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
