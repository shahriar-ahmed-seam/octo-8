/**
 * Display — renders the CHIP-8 64x32 framebuffer to a <canvas>.
 *
 * The canvas is drawn at native pixel scale and stretched with CSS so it stays
 * crisp and responsive. Lit pixels get a themed bloom; an optional CRT overlay
 * adds scanlines and a vignette for the retro-arcade feel.
 */

import { useEffect, useRef } from 'react';
import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from '../../core/cpu';
import type { DisplayTheme } from '../../data/themes';
import Icon from '../ui/Icon';

interface DisplayProps {
  display: Uint8Array | null;
  theme: DisplayTheme;
  crt: boolean;
  scale?: number;
}

export default function Display({ display, theme, crt, scale = 16 }: DisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = DISPLAY_WIDTH * scale;
    const h = DISPLAY_HEIGHT * scale;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    // Background
    ctx.fillStyle = theme.off;
    ctx.fillRect(0, 0, w, h);

    if (display) {
      // Bloom pass
      ctx.shadowColor = theme.glow;
      ctx.shadowBlur = scale * 0.5;
      ctx.fillStyle = theme.on;
      for (let y = 0; y < DISPLAY_HEIGHT; y++) {
        for (let x = 0; x < DISPLAY_WIDTH; x++) {
          if (display[y * DISPLAY_WIDTH + x]) {
            ctx.fillRect(x * scale, y * scale, scale, scale);
          }
        }
      }
      ctx.shadowBlur = 0;
    }

    // Subtle grid
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= DISPLAY_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * scale + 0.5, 0);
      ctx.lineTo(x * scale + 0.5, h);
      ctx.stroke();
    }
    for (let y = 0; y <= DISPLAY_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * scale + 0.5);
      ctx.lineTo(w, y * scale + 0.5);
      ctx.stroke();
    }
  }, [display, theme, scale]);

  return (
    <section className="panel display-panel">
      <div className="panel-header">
        <span className="panel-title">
          <Icon name="display" size={15} /> Display
        </span>
        <span className="panel-badge">{DISPLAY_WIDTH}×{DISPLAY_HEIGHT}</span>
      </div>
      <div className={`display-stage ${crt ? 'crt' : ''}`} style={{ ['--glow' as string]: theme.glow }}>
        <canvas ref={canvasRef} className="chip8-display" />
        {crt && <div className="crt-overlay" />}
        {!display && <div className="display-idle">Load a ROM to begin</div>}
      </div>
    </section>
  );
}
