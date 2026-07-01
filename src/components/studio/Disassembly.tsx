/**
 * Disassembly — Live disassembly view showing instructions around the PC.
 * Highlights the current instruction and shows the full program listing.
 */

import { useMemo, useRef, useEffect } from 'react';
import type { CPUState } from '../../core/cpu';
import { disassemble } from '../../core/disassembler';
import { PROGRAM_START, MEMORY_SIZE } from '../../core/cpu';
import Icon from '../ui/Icon';

interface DisassemblyProps {
  state: CPUState | null;
  breakpoints: Set<number>;
  onToggleBreakpoint: (address: number) => void;
}

interface DisassembledLine {
  address: number;
  opcode: number;
  mnemonic: string;
}

function hex16(val: number): string {
  return '0x' + val.toString(16).toUpperCase().padStart(4, '0');
}

function hex4(val: number): string {
  return val.toString(16).toUpperCase().padStart(4, '0');
}

export default function Disassembly({ state, breakpoints, onToggleBreakpoint }: DisassemblyProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const lines = useMemo((): DisassembledLine[] => {
    if (!state) return [];

    const result: DisassembledLine[] = [];
    for (let addr = PROGRAM_START; addr < MEMORY_SIZE - 1; addr += 2) {
      const opcode = (state.memory[addr] << 8) | state.memory[addr + 1];
      if (opcode === 0 && addr > state.PC + 20) continue; // skip trailing empty memory
      result.push({
        address: addr,
        opcode,
        mnemonic: disassemble(opcode),
      });
    }
    return result;
  }, [state]);

  // Auto-scroll to current PC
  useEffect(() => {
    if (!listRef.current || !state) return;

    const activeElement = listRef.current.querySelector('.disasm-line.current');
    if (activeElement) {
      activeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [state?.PC]);

  if (!state) {
    return (
      <div className="panel disassembly-panel">
        <div className="panel-header">
          <span className="panel-title"><Icon name="code" size={15} /> Disassembly</span>
        </div>
        <div className="panel-empty">No ROM loaded</div>
      </div>
    );
  }

  return (
    <div className="panel disassembly-panel">
      <div className="panel-header">
        <span className="panel-title"><Icon name="code" size={15} /> Disassembly</span>
        <span className="panel-badge">PC: {hex16(state.PC)}</span>
      </div>
      <div className="disasm-list" ref={listRef}>
        {lines.map((line) => {
          const isCurrent = line.address === state.PC;
          const isBreak = breakpoints.has(line.address);
          return (
            <div
              key={line.address}
              className={`disasm-line ${isCurrent ? 'current' : ''} ${line.opcode === 0 ? 'empty' : ''}`}
              onClick={() => onToggleBreakpoint(line.address)}
              title="Click to toggle breakpoint"
            >
              <span className={`disasm-break ${isBreak ? 'on' : ''}`} />
              <span className="disasm-arrow">{isCurrent ? '\u25B6' : ' '}</span>
              <span className="disasm-addr">{hex16(line.address)}</span>
              <span className="disasm-hex">{hex4(line.opcode)}</span>
              <span className="disasm-mnemonic">{line.mnemonic}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
