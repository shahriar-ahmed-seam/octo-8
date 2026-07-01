/**
 * MemoryInspector — A hex-editor-style byte inspector for the full 4KB memory.
 * Shows 16 bytes per row with ASCII representation.
 * Highlights the region around the PC and the I register.
 */

import { useMemo, useState, useRef, useEffect } from 'react';
import type { CPUState } from '../../core/cpu';
import { MEMORY_SIZE } from '../../core/cpu';
import Icon from '../ui/Icon';

interface MemoryInspectorProps {
  state: CPUState | null;
}

const BYTES_PER_ROW = 16;
const VISIBLE_ROWS = 20;

function hex8(val: number): string {
  return val.toString(16).toUpperCase().padStart(2, '0');
}

function hex16(val: number): string {
  return val.toString(16).toUpperCase().padStart(4, '0');
}

function toAscii(byte: number): string {
  return byte >= 0x20 && byte <= 0x7E ? String.fromCharCode(byte) : '.';
}

export default function MemoryInspector({ state }: MemoryInspectorProps) {
  const [scrollOffset, setScrollOffset] = useState(0x200); // Start at program region
  const containerRef = useRef<HTMLDivElement>(null);

  const totalRows = Math.ceil(MEMORY_SIZE / BYTES_PER_ROW);

  // Jump to PC region
  const jumpToPC = () => {
    if (state) {
      setScrollOffset(Math.floor(state.PC / BYTES_PER_ROW) * BYTES_PER_ROW);
    }
  };

  // Jump to I register region
  const jumpToI = () => {
    if (state) {
      setScrollOffset(Math.floor(state.I / BYTES_PER_ROW) * BYTES_PER_ROW);
    }
  };

  // Scroll handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.sign(e.deltaY) * BYTES_PER_ROW * 2;
      setScrollOffset((prev) =>
        Math.max(0, Math.min((totalRows - VISIBLE_ROWS) * BYTES_PER_ROW, prev + delta))
      );
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [totalRows]);

  const rows = useMemo(() => {
    if (!state) return [];

    const startRow = Math.floor(scrollOffset / BYTES_PER_ROW);
    const result: Array<{
      address: number;
      bytes: number[];
      ascii: string;
    }> = [];

    for (let r = 0; r < VISIBLE_ROWS; r++) {
      const rowStart = (startRow + r) * BYTES_PER_ROW;
      if (rowStart >= MEMORY_SIZE) break;

      const bytes: number[] = [];
      let ascii = '';
      for (let i = 0; i < BYTES_PER_ROW; i++) {
        const addr = rowStart + i;
        const b = addr < MEMORY_SIZE ? state.memory[addr] : 0;
        bytes.push(b);
        ascii += toAscii(b);
      }

      result.push({ address: rowStart, bytes, ascii });
    }
    return result;
  }, [state, scrollOffset]);

  if (!state) {
    return (
      <div className="panel memory-inspector-panel">
        <div className="panel-header">
          <span className="panel-title"><Icon name="memory" size={15} /> Memory Inspector</span>
        </div>
        <div className="panel-empty">No CPU state</div>
      </div>
    );
  }

  return (
    <div className="panel memory-inspector-panel">
      <div className="panel-header">
        <span className="panel-title"><Icon name="memory" size={15} /> Memory Inspector</span>
        <div className="memory-nav">
          <button className="nav-btn" onClick={jumpToPC} title="Jump to PC">
            PC
          </button>
          <button className="nav-btn" onClick={jumpToI} title="Jump to I register">
            I
          </button>
          <button className="nav-btn" onClick={() => setScrollOffset(0)} title="Jump to 0x000">
            0x000
          </button>
          <button className="nav-btn" onClick={() => setScrollOffset(0x200)} title="Jump to program start">
            0x200
          </button>
        </div>
      </div>

      <div className="memory-hex-view" ref={containerRef}>
        {/* Header row */}
        <div className="memory-row header-row">
          <span className="memory-addr">Addr</span>
          <span className="memory-bytes-header">
            {Array.from({ length: BYTES_PER_ROW }, (_, i) =>
              i.toString(16).toUpperCase()
            ).join('  ')}
          </span>
          <span className="memory-ascii-header">ASCII</span>
        </div>

        {/* Data rows */}
        {rows.map((row) => (
          <div key={row.address} className="memory-row">
            <span className="memory-addr">{hex16(row.address)}</span>
            <span className="memory-bytes">
              {row.bytes.map((b, i) => {
                const addr = row.address + i;
                const isPC = addr === state.PC || addr === state.PC + 1;
                const isI = addr === state.I;
                return (
                  <span
                    key={i}
                    className={`memory-byte ${isPC ? 'highlight-pc' : ''} ${isI ? 'highlight-i' : ''} ${b > 0 ? 'non-zero' : ''}`}
                    title={`0x${hex16(addr)}: ${hex8(b)} (${b})`}
                  >
                    {hex8(b)}
                  </span>
                );
              })}
            </span>
            <span className="memory-ascii">{row.ascii}</span>
          </div>
        ))}
      </div>

      <div className="memory-scrollbar">
        <input
          type="range"
          min={0}
          max={Math.max(0, (totalRows - VISIBLE_ROWS) * BYTES_PER_ROW)}
          step={BYTES_PER_ROW}
          value={scrollOffset}
          onChange={(e) => setScrollOffset(parseInt(e.target.value, 10))}
          className="memory-scroll-range"
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
