/**
 * Registers — Shows all CPU registers (V0-VF, I, PC, SP, DT, ST)
 * in a developer-tools-style panel with hex/decimal/binary views.
 */

import { useState } from 'react';
import type { CPUState } from '../../core/cpu';
import Icon from '../ui/Icon';

interface RegistersProps {
  state: CPUState | null;
}

type DisplayFormat = 'hex' | 'dec' | 'bin';

function formatValue(value: number, bits: number, format: DisplayFormat): string {
  switch (format) {
    case 'hex':
      return '0x' + value.toString(16).toUpperCase().padStart(Math.ceil(bits / 4), '0');
    case 'dec':
      return value.toString(10);
    case 'bin':
      return '0b' + value.toString(2).padStart(bits, '0');
  }
}

export default function Registers({ state }: RegistersProps) {
  const [format, setFormat] = useState<DisplayFormat>('hex');

  if (!state) {
    return (
      <div className="panel registers-panel">
        <div className="panel-header">
          <span className="panel-title"><Icon name="registers" size={15} /> Registers</span>
        </div>
        <div className="panel-empty">No CPU state</div>
      </div>
    );
  }

  return (
    <div className="panel registers-panel">
      <div className="panel-header">
        <span className="panel-title"><Icon name="registers" size={15} /> Registers</span>
        <div className="format-toggle">
          {(['hex', 'dec', 'bin'] as DisplayFormat[]).map((f) => (
            <button
              key={f}
              className={`format-btn ${format === f ? 'active' : ''}`}
              onClick={() => setFormat(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="registers-grid">
        {/* General Purpose Registers V0-VF */}
        <div className="register-section">
          <div className="register-section-title">General Purpose</div>
          <div className="register-list">
            {Array.from(state.V).map((val, i) => (
              <div
                key={i}
                className={`register-row ${i === 0xF ? 'register-flag' : ''}`}
              >
                <span className="register-name">
                  V{i.toString(16).toUpperCase()}
                </span>
                <span className="register-value">
                  {formatValue(val, 8, format)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Special Registers */}
        <div className="register-section">
          <div className="register-section-title">Special</div>
          <div className="register-list">
            <div className="register-row register-special">
              <span className="register-name">I</span>
              <span className="register-value">{formatValue(state.I, 16, format)}</span>
            </div>
            <div className="register-row register-special register-pc">
              <span className="register-name">PC</span>
              <span className="register-value">{formatValue(state.PC, 16, format)}</span>
            </div>
            <div className="register-row register-special">
              <span className="register-name">SP</span>
              <span className="register-value">{formatValue(state.SP, 8, format)}</span>
            </div>
          </div>

          <div className="register-section-title" style={{ marginTop: '8px' }}>Timers</div>
          <div className="register-list">
            <div className="register-row">
              <span className="register-name">DT</span>
              <span className="register-value timer-value">{formatValue(state.DT, 8, format)}</span>
            </div>
            <div className="register-row">
              <span className="register-name">ST</span>
              <span className={`register-value timer-value ${state.ST > 0 ? 'sound-active' : ''}`}>
                {formatValue(state.ST, 8, format)}
              </span>
            </div>
          </div>

          <div className="register-section-title" style={{ marginTop: '8px' }}>Status</div>
          <div className="register-list">
            <div className="register-row">
              <span className="register-name">Opcode</span>
              <span className="register-value opcode-value">
                {formatValue(state.lastOpcode, 16, 'hex')}
              </span>
            </div>
            <div className="register-row">
              <span className="register-name">Cycles</span>
              <span className="register-value">{state.cycleCount.toLocaleString()}</span>
            </div>
            <div className="register-row">
              <span className="register-name">State</span>
              <span className={`register-value status-badge ${state.halted ? 'halted' : state.waitingForKey ? 'waiting' : 'running'}`}>
                {state.halted ? '⛔ HALTED' : state.waitingForKey ? '⏳ WAIT KEY' : '✅ OK'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
