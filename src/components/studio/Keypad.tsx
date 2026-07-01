/**
 * Keypad — Visual CHIP-8 keypad showing the hex keyboard layout (0-F)
 * and the corresponding physical keyboard mappings.
 * 
 * CHIP-8 Keypad:         Keyboard Mapping:
 * | 1 | 2 | 3 | C |     | 1 | 2 | 3 | 4 |
 * | 4 | 5 | 6 | D |     | Q | W | E | R |
 * | 7 | 8 | 9 | E |     | A | S | D | F |
 * | A | 0 | B | F |     | Z | X | C | V |
 */

import type { CPUState } from '../../core/cpu';
import Icon from '../ui/Icon';

interface KeypadProps {
  state: CPUState | null;
  onKeyDown: (key: number) => void;
  onKeyUp: (key: number) => void;
}

// CHIP-8 keypad layout (4x4 grid, reading order)
const KEYPAD_LAYOUT: Array<{ chip8Key: number; label: string; kbKey: string }> = [
  { chip8Key: 0x1, label: '1', kbKey: '1' },
  { chip8Key: 0x2, label: '2', kbKey: '2' },
  { chip8Key: 0x3, label: '3', kbKey: '3' },
  { chip8Key: 0xC, label: 'C', kbKey: '4' },
  { chip8Key: 0x4, label: '4', kbKey: 'Q' },
  { chip8Key: 0x5, label: '5', kbKey: 'W' },
  { chip8Key: 0x6, label: '6', kbKey: 'E' },
  { chip8Key: 0xD, label: 'D', kbKey: 'R' },
  { chip8Key: 0x7, label: '7', kbKey: 'A' },
  { chip8Key: 0x8, label: '8', kbKey: 'S' },
  { chip8Key: 0x9, label: '9', kbKey: 'D' },
  { chip8Key: 0xE, label: 'E', kbKey: 'F' },
  { chip8Key: 0xA, label: 'A', kbKey: 'Z' },
  { chip8Key: 0x0, label: '0', kbKey: 'X' },
  { chip8Key: 0xB, label: 'B', kbKey: 'C' },
  { chip8Key: 0xF, label: 'F', kbKey: 'V' },
];

export default function Keypad({ state, onKeyDown, onKeyUp }: KeypadProps) {
  return (
    <div className="panel keypad-panel">
      <div className="panel-header">
        <span className="panel-title"><Icon name="keypad" size={15} /> Keypad</span>
      </div>
      <div className="keypad-grid">
        {KEYPAD_LAYOUT.map(({ chip8Key, label, kbKey }) => {
          const isPressed = state?.keys[chip8Key] === 1;
          return (
            <button
              key={chip8Key}
              className={`keypad-btn ${isPressed ? 'pressed' : ''}`}
              onMouseDown={() => onKeyDown(chip8Key)}
              onMouseUp={() => onKeyUp(chip8Key)}
              onMouseLeave={() => onKeyUp(chip8Key)}
              onTouchStart={(e) => { e.preventDefault(); onKeyDown(chip8Key); }}
              onTouchEnd={(e) => { e.preventDefault(); onKeyUp(chip8Key); }}
            >
              <span className="keypad-chip8">{label}</span>
              <span className="keypad-kb">{kbKey}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Keyboard mapping: physical key -> CHIP-8 key index (0-F)
 */
export const KEY_MAP: Record<string, number> = {
  '1': 0x1, '2': 0x2, '3': 0x3, '4': 0xC,
  'q': 0x4, 'w': 0x5, 'e': 0x6, 'r': 0xD,
  'a': 0x7, 's': 0x8, 'd': 0x9, 'f': 0xE,
  'z': 0xA, 'x': 0x0, 'c': 0xB, 'v': 0xF,
};
