/**
 * CHIP-8 Opcode Disassembler
 * Converts raw 16-bit opcodes into human-readable assembly mnemonics.
 */

export function disassemble(opcode: number): string {
  const nnn = opcode & 0x0FFF;
  const nn = opcode & 0x00FF;
  const n = opcode & 0x000F;
  const x = (opcode >> 8) & 0x0F;
  const y = (opcode >> 4) & 0x0F;

  const hex = (v: number, pad: number) => '0x' + v.toString(16).toUpperCase().padStart(pad, '0');

  switch (opcode & 0xF000) {
    case 0x0000:
      switch (opcode) {
        case 0x00E0: return 'CLS';
        case 0x00EE: return 'RET';
        default:     return `SYS  ${hex(nnn, 3)}`;
      }

    case 0x1000: return `JP   ${hex(nnn, 3)}`;
    case 0x2000: return `CALL ${hex(nnn, 3)}`;
    case 0x3000: return `SE   V${x.toString(16).toUpperCase()}, ${hex(nn, 2)}`;
    case 0x4000: return `SNE  V${x.toString(16).toUpperCase()}, ${hex(nn, 2)}`;
    case 0x5000: return `SE   V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
    case 0x6000: return `LD   V${x.toString(16).toUpperCase()}, ${hex(nn, 2)}`;
    case 0x7000: return `ADD  V${x.toString(16).toUpperCase()}, ${hex(nn, 2)}`;

    case 0x8000:
      switch (n) {
        case 0x0: return `LD   V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
        case 0x1: return `OR   V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
        case 0x2: return `AND  V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
        case 0x3: return `XOR  V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
        case 0x4: return `ADD  V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
        case 0x5: return `SUB  V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
        case 0x6: return `SHR  V${x.toString(16).toUpperCase()} {, V${y.toString(16).toUpperCase()}}`;
        case 0x7: return `SUBN V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
        case 0xE: return `SHL  V${x.toString(16).toUpperCase()} {, V${y.toString(16).toUpperCase()}}`;
        default:  return `??? ${hex(opcode, 4)}`;
      }

    case 0x9000: return `SNE  V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`;
    case 0xA000: return `LD   I, ${hex(nnn, 3)}`;
    case 0xB000: return `JP   V0, ${hex(nnn, 3)}`;
    case 0xC000: return `RND  V${x.toString(16).toUpperCase()}, ${hex(nn, 2)}`;
    case 0xD000: return `DRW  V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}, ${n}`;

    case 0xE000:
      switch (nn) {
        case 0x9E: return `SKP  V${x.toString(16).toUpperCase()}`;
        case 0xA1: return `SKNP V${x.toString(16).toUpperCase()}`;
        default:   return `??? ${hex(opcode, 4)}`;
      }

    case 0xF000:
      switch (nn) {
        case 0x07: return `LD   V${x.toString(16).toUpperCase()}, DT`;
        case 0x0A: return `LD   V${x.toString(16).toUpperCase()}, K`;
        case 0x15: return `LD   DT, V${x.toString(16).toUpperCase()}`;
        case 0x18: return `LD   ST, V${x.toString(16).toUpperCase()}`;
        case 0x1E: return `ADD  I, V${x.toString(16).toUpperCase()}`;
        case 0x29: return `LD   F, V${x.toString(16).toUpperCase()}`;
        case 0x33: return `LD   B, V${x.toString(16).toUpperCase()}`;
        case 0x55: return `LD   [I], V${x.toString(16).toUpperCase()}`;
        case 0x65: return `LD   V${x.toString(16).toUpperCase()}, [I]`;
        default:   return `??? ${hex(opcode, 4)}`;
      }

    default: return `??? ${hex(opcode, 4)}`;
  }
}

/**
 * Disassemble a region of memory into an array of { address, opcode, mnemonic }
 */
export function disassembleRegion(
  memory: Uint8Array,
  start: number,
  end: number
): Array<{ address: number; opcode: number; mnemonic: string }> {
  const result: Array<{ address: number; opcode: number; mnemonic: string }> = [];
  for (let addr = start; addr < end && addr < memory.length - 1; addr += 2) {
    const opcode = (memory[addr] << 8) | memory[addr + 1];
    if (opcode === 0) continue; // skip empty memory
    result.push({
      address: addr,
      opcode,
      mnemonic: disassemble(opcode),
    });
  }
  return result;
}
