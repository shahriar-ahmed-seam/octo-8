/**
 * MemoryHeatmap — A visual heatmap of the entire 4KB CHIP-8 memory.
 * 
 * Each cell represents one byte of memory. Cells glow/highlight
 * when their address has been recently read or written:
 *   - Blue glow for reads
 *   - Red/orange glow for writes
 *   - Green highlight for the current PC location
 * 
 * The heatmap decays over time so you can see the "hot path" of execution.
 */

import { useEffect, useRef, useMemo } from 'react';
import { MEMORY_SIZE, PROGRAM_START } from '../../core/cpu';
import type { CPUState } from '../../core/cpu';
import Icon from '../ui/Icon';

interface MemoryHeatmapProps {
  state: CPUState | null;
}

const COLS = 64;
const ROWS = Math.ceil(MEMORY_SIZE / COLS); // 64 rows
const CELL_SIZE = 6;
const GAP = 1;

export default function MemoryHeatmap({ state }: MemoryHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Build a heat map from the recent memory accesses
  const heatData = useMemo(() => {
    if (!state) return null;

    const now = Date.now();
    const readHeat = new Float32Array(MEMORY_SIZE);
    const writeHeat = new Float32Array(MEMORY_SIZE);

    for (const access of state.memoryAccesses) {
      const age = now - access.timestamp;
      const decay = Math.max(0, 1 - age / 2000); // Decay over 2 seconds
      if (access.type === 'read') {
        readHeat[access.address] = Math.max(readHeat[access.address], decay);
      } else {
        writeHeat[access.address] = Math.max(writeHeat[access.address], decay);
      }
    }

    return { readHeat, writeHeat };
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalW = COLS * (CELL_SIZE + GAP);
    const totalH = ROWS * (CELL_SIZE + GAP);
    canvas.width = totalW;
    canvas.height = totalH;

    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, totalW, totalH);

    for (let addr = 0; addr < MEMORY_SIZE; addr++) {
      const col = addr % COLS;
      const row = Math.floor(addr / COLS);
      const x = col * (CELL_SIZE + GAP);
      const y = row * (CELL_SIZE + GAP);

      const byteVal = state.memory[addr];

      // Base color: brightness based on byte value
      let r = 0, g = 0, b = 0;
      const brightness = (byteVal / 255) * 40;
      r = brightness;
      g = brightness;
      b = brightness;

      // Font region: subtle purple tint
      if (addr < 0x50) {
        r = brightness + 15;
        b = brightness + 25;
      }

      // Program region has non-zero data: subtle cyan
      if (addr >= PROGRAM_START && byteVal > 0) {
        g = brightness + 20;
        b = brightness + 30;
      }

      // Apply read heat (blue glow)
      if (heatData) {
        const rh = heatData.readHeat[addr];
        if (rh > 0) {
          b = Math.min(255, b + rh * 200);
          g = Math.min(255, g + rh * 50);
        }

        // Apply write heat (red/orange glow)
        const wh = heatData.writeHeat[addr];
        if (wh > 0) {
          r = Math.min(255, r + wh * 255);
          g = Math.min(255, g + wh * 80);
        }
      }

      // PC highlight (bright green)
      if (addr === state.PC || addr === state.PC + 1) {
        r = 57;
        g = 255;
        b = 20;
      }

      // I register highlight (bright yellow)
      if (addr === state.I) {
        r = 255;
        g = 255;
        b = 0;
      }

      ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    }

    // Draw region labels
    ctx.font = '9px monospace';
    ctx.fillStyle = '#666';
    const labelY = 0 * (CELL_SIZE + GAP) - 2;
    ctx.fillText('0x000 Font', 2, Math.max(8, labelY));

  }, [state, heatData]);

  return (
    <div className="panel heatmap-panel">
      <div className="panel-header">
        <span className="panel-title"><Icon name="map" size={15} /> Memory Heatmap</span>
        <span className="panel-badge">{MEMORY_SIZE} bytes</span>
      </div>
      <div className="heatmap-legend">
        <span className="legend-item"><span className="legend-swatch" style={{ background: '#3399ff' }} /> Read</span>
        <span className="legend-item"><span className="legend-swatch" style={{ background: '#ff5533' }} /> Write</span>
        <span className="legend-item"><span className="legend-swatch" style={{ background: '#39FF14' }} /> PC</span>
        <span className="legend-item"><span className="legend-swatch" style={{ background: '#ffff00' }} /> I</span>
      </div>
      <div className="heatmap-container">
        <canvas ref={canvasRef} className="heatmap-canvas" />
      </div>
      <div className="heatmap-addresses">
        <span>0x000</span>
        <span>0x200 (Program Start)</span>
        <span>0xFFF</span>
      </div>
    </div>
  );
}
