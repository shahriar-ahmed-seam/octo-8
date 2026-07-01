/**
 * StackViewer — Shows the call stack contents and the program counter.
 * Displays the stack as a visual stack with the SP indicator.
 */

import type { CPUState } from '../../core/cpu';
import Icon from '../ui/Icon';

interface StackViewerProps {
  state: CPUState | null;
}

function hex16(val: number): string {
  return '0x' + val.toString(16).toUpperCase().padStart(4, '0');
}

export default function StackViewer({ state }: StackViewerProps) {
  if (!state) {
    return (
      <div className="panel stack-panel">
        <div className="panel-header">
          <span className="panel-title"><Icon name="stack" size={15} /> Stack</span>
        </div>
        <div className="panel-empty">No CPU state</div>
      </div>
    );
  }

  return (
    <div className="panel stack-panel">
      <div className="panel-header">
        <span className="panel-title"><Icon name="stack" size={15} /> Stack</span>
        <span className="panel-badge">SP: {state.SP}</span>
      </div>
      <div className="stack-container">
        {Array.from(state.stack).map((addr, i) => {
          const isActive = i < state.SP;
          const isTop = i === state.SP - 1;

          return (
            <div
              key={i}
              className={`stack-entry ${isActive ? 'active' : 'empty'} ${isTop ? 'top' : ''}`}
            >
              <span className="stack-index">{i.toString(16).toUpperCase()}</span>
              <span className="stack-value">
                {isActive ? hex16(addr) : '----'}
              </span>
              {isTop && <span className="stack-pointer-indicator">◀ SP</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
