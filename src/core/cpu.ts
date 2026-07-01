/**
 * CHIP-8 Emulator Core
 * 
 * Memory Layout:
 *   0x000-0x1FF: Reserved (font data loaded here)
 *   0x200-0xFFF: Program/data space (ROM loaded at 0x200)
 * 
 * Registers:
 *   V0-VF: 16 general-purpose 8-bit registers
 *   VF doubles as a carry/borrow/collision flag
 *   I: 16-bit index register
 *   PC: 16-bit program counter
 *   SP: 8-bit stack pointer
 *   DT: 8-bit delay timer (decrements at 60Hz)
 *   ST: 8-bit sound timer (decrements at 60Hz, beeps when >0)
 * 
 * Display: 64x32 monochrome pixels
 * Input: 16 keys (0-F hex keypad)
 * Stack: 16 levels of 16-bit return addresses
 */

// Standard CHIP-8 font set (0-F), 5 bytes per character, loaded at 0x000
const FONT_SET = new Uint8Array([
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
  0x20, 0x60, 0x20, 0x20, 0x70, // 1
  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
  0xF0, 0x80, 0xF0, 0x80, 0x80, // F
]);

export const DISPLAY_WIDTH = 64;
export const DISPLAY_HEIGHT = 32;
export const MEMORY_SIZE = 4096;
export const PROGRAM_START = 0x200;
export const STACK_SIZE = 16;
export const NUM_REGISTERS = 16;
export const NUM_KEYS = 16;

/** Tracks which memory addresses were recently read/written for the heatmap */
export interface MemoryAccess {
  address: number;
  type: 'read' | 'write';
  timestamp: number;
}

/** Full snapshot of CPU state for the debugger UI */
export interface CPUState {
  // Registers
  V: Uint8Array;
  I: number;
  PC: number;
  SP: number;
  DT: number;
  ST: number;
  // Memory
  memory: Uint8Array;
  // Stack
  stack: Uint16Array;
  // Display buffer (64*32 = 2048 pixels, 1 = on, 0 = off)
  display: Uint8Array;
  // Keyboard
  keys: Uint8Array;
  // Metadata
  halted: boolean;
  waitingForKey: boolean;
  waitKeyRegister: number;
  cycleCount: number;
  lastOpcode: number;
  // Memory access log for heatmap (recent accesses)
  memoryAccesses: MemoryAccess[];
  drawFlag: boolean;
  soundFlag: boolean;
}

export class Chip8CPU {
  // Registers
  V: Uint8Array = new Uint8Array(NUM_REGISTERS);
  I: number = 0;
  PC: number = PROGRAM_START;
  SP: number = 0;
  DT: number = 0;  // delay timer
  ST: number = 0;  // sound timer

  // Memory
  memory: Uint8Array = new Uint8Array(MEMORY_SIZE);

  // Stack (16 levels of 16-bit)
  stack: Uint16Array = new Uint16Array(STACK_SIZE);

  // Display (64x32 monochrome)
  display: Uint8Array = new Uint8Array(DISPLAY_WIDTH * DISPLAY_HEIGHT);

  // Keyboard state (16 keys)
  keys: Uint8Array = new Uint8Array(NUM_KEYS);

  // Execution state
  halted: boolean = false;
  waitingForKey: boolean = false;
  waitKeyRegister: number = 0;
  cycleCount: number = 0;
  lastOpcode: number = 0;

  // Flags
  drawFlag: boolean = false;
  soundFlag: boolean = false;

  // Memory access tracking for heatmap visualization
  memoryAccesses: MemoryAccess[] = [];
  private maxAccessLog = 512;

  constructor() {
    this.reset();
  }

  /** Full reset of the CPU to initial state */
  reset(): void {
    this.V.fill(0);
    this.I = 0;
    this.PC = PROGRAM_START;
    this.SP = 0;
    this.DT = 0;
    this.ST = 0;
    this.memory.fill(0);
    this.stack.fill(0);
    this.display.fill(0);
    this.keys.fill(0);
    this.halted = false;
    this.waitingForKey = false;
    this.waitKeyRegister = 0;
    this.cycleCount = 0;
    this.lastOpcode = 0;
    this.drawFlag = false;
    this.soundFlag = false;
    this.memoryAccesses = [];

    // Load font set into memory starting at 0x000
    this.memory.set(FONT_SET, 0);
  }

  /** Load a ROM (Uint8Array) into memory starting at 0x200 */
  loadROM(rom: Uint8Array): void {
    if (rom.length > MEMORY_SIZE - PROGRAM_START) {
      throw new Error(`ROM too large: ${rom.length} bytes (max ${MEMORY_SIZE - PROGRAM_START})`);
    }
    this.reset();
    this.memory.set(rom, PROGRAM_START);
  }

  /** Log a memory access for the heatmap */
  private logAccess(address: number, type: 'read' | 'write'): void {
    this.memoryAccesses.push({ address, type, timestamp: Date.now() });
    if (this.memoryAccesses.length > this.maxAccessLog) {
      this.memoryAccesses = this.memoryAccesses.slice(-this.maxAccessLog / 2);
    }
  }

  /** Read a byte from memory with tracking */
  private readMem(addr: number): number {
    const val = this.memory[addr & 0xFFF];
    this.logAccess(addr & 0xFFF, 'read');
    return val;
  }

  /** Write a byte to memory with tracking */
  private writeMem(addr: number, val: number): void {
    this.memory[addr & 0xFFF] = val & 0xFF;
    this.logAccess(addr & 0xFFF, 'write');
  }

  /** Set a key state (0-15) */
  setKey(key: number, pressed: boolean): void {
    if (key >= 0 && key < NUM_KEYS) {
      this.keys[key] = pressed ? 1 : 0;

      // If waiting for a key press and a key was pressed, resume execution
      if (pressed && this.waitingForKey) {
        this.V[this.waitKeyRegister] = key;
        this.waitingForKey = false;
      }
    }
  }

  /** Decrement timers — should be called at 60Hz */
  updateTimers(): void {
    if (this.DT > 0) this.DT--;
    if (this.ST > 0) {
      this.soundFlag = true;
      this.ST--;
    } else {
      this.soundFlag = false;
    }
  }

  /**
   * Restore CPU state from a snapshot (used by save/load state).
   * Copies data out of the snapshot so the caller keeps ownership of its arrays.
   */
  restore(s: CPUState): void {
    this.V.set(s.V);
    this.I = s.I;
    this.PC = s.PC;
    this.SP = s.SP;
    this.DT = s.DT;
    this.ST = s.ST;
    this.memory.set(s.memory);
    this.stack.set(s.stack);
    this.display.set(s.display);
    this.keys.set(s.keys);
    this.halted = s.halted;
    this.waitingForKey = s.waitingForKey;
    this.waitKeyRegister = s.waitKeyRegister;
    this.cycleCount = s.cycleCount;
    this.lastOpcode = s.lastOpcode;
    this.drawFlag = true;
    this.soundFlag = false;
    this.memoryAccesses = [];
  }

  /** Get a complete snapshot of the CPU state for the UI */
  getState(): CPUState {
    return {
      V: new Uint8Array(this.V),
      I: this.I,
      PC: this.PC,
      SP: this.SP,
      DT: this.DT,
      ST: this.ST,
      memory: new Uint8Array(this.memory),
      stack: new Uint16Array(this.stack),
      display: new Uint8Array(this.display),
      keys: new Uint8Array(this.keys),
      halted: this.halted,
      waitingForKey: this.waitingForKey,
      waitKeyRegister: this.waitKeyRegister,
      cycleCount: this.cycleCount,
      lastOpcode: this.lastOpcode,
      memoryAccesses: [...this.memoryAccesses],
      drawFlag: this.drawFlag,
      soundFlag: this.soundFlag,
    };
  }

  /**
   * Execute a single CPU cycle: Fetch → Decode → Execute
   * 
   * CHIP-8 opcodes are 2 bytes (big-endian), fetched from memory[PC] and memory[PC+1].
   * After fetch, PC is incremented by 2 before execution.
   * 
   * Opcode format notation:
   *   NNN  - 12-bit address (lowest 12 bits)
   *   NN   - 8-bit constant (lowest 8 bits)
   *   N    - 4-bit constant (lowest 4 bits)
   *   X    - 4-bit register identifier (bits 8-11)
   *   Y    - 4-bit register identifier (bits 4-7)
   */
  emulateCycle(): void {
    if (this.halted || this.waitingForKey) return;

    // ═══════════════════════════════════════════
    //  FETCH: Read 2-byte opcode from memory[PC]
    // ═══════════════════════════════════════════
    const opcode = (this.memory[this.PC] << 8) | this.memory[this.PC + 1];
    this.lastOpcode = opcode;

    // Extract common fields
    const nnn = opcode & 0x0FFF;        // 12-bit address
    const nn = opcode & 0x00FF;         // 8-bit constant
    const n = opcode & 0x000F;          // 4-bit constant
    const x = (opcode >> 8) & 0x0F;     // register Vx
    const y = (opcode >> 4) & 0x0F;     // register Vy

    // Advance PC before execution (some opcodes modify PC)
    this.PC += 2;

    // ═══════════════════════════════════════════
    //  DECODE & EXECUTE: Full 35-instruction set
    // ═══════════════════════════════════════════
    switch (opcode & 0xF000) {

      // ──── 0x0___ ────
      case 0x0000:
        switch (opcode) {
          // 00E0 — CLS: Clear the display
          case 0x00E0:
            this.display.fill(0);
            this.drawFlag = true;
            break;

          // 00EE — RET: Return from subroutine
          case 0x00EE:
            if (this.SP === 0) {
              this.halted = true;
              break;
            }
            this.SP--;
            this.PC = this.stack[this.SP];
            break;

          // 0NNN — SYS addr: Call RCA 1802 program (ignored on modern interpreters)
          default:
            // Ignored — this was for the original hardware
            break;
        }
        break;

      // ──── 1NNN — JP addr: Jump to address NNN ────
      case 0x1000:
        this.PC = nnn;
        break;

      // ──── 2NNN — CALL addr: Call subroutine at NNN ────
      case 0x2000:
        if (this.SP >= STACK_SIZE) {
          this.halted = true; // Stack overflow
          break;
        }
        this.stack[this.SP] = this.PC;
        this.SP++;
        this.PC = nnn;
        break;

      // ──── 3XNN — SE Vx, byte: Skip next instruction if Vx == NN ────
      case 0x3000:
        if (this.V[x] === nn) {
          this.PC += 2;
        }
        break;

      // ──── 4XNN — SNE Vx, byte: Skip next instruction if Vx != NN ────
      case 0x4000:
        if (this.V[x] !== nn) {
          this.PC += 2;
        }
        break;

      // ──── 5XY0 — SE Vx, Vy: Skip next instruction if Vx == Vy ────
      case 0x5000:
        if (this.V[x] === this.V[y]) {
          this.PC += 2;
        }
        break;

      // ──── 6XNN — LD Vx, byte: Set Vx = NN ────
      case 0x6000:
        this.V[x] = nn;
        break;

      // ──── 7XNN — ADD Vx, byte: Set Vx = Vx + NN (no carry flag) ────
      case 0x7000:
        this.V[x] = (this.V[x] + nn) & 0xFF;
        break;

      // ──── 8XY_ — Arithmetic/Logic operations ────
      case 0x8000:
        switch (n) {
          // 8XY0 — LD Vx, Vy: Set Vx = Vy
          case 0x0:
            this.V[x] = this.V[y];
            break;

          // 8XY1 — OR Vx, Vy: Set Vx = Vx | Vy
          case 0x1:
            this.V[x] |= this.V[y];
            this.V[0xF] = 0; // CHIP-8 quirk: VF reset
            break;

          // 8XY2 — AND Vx, Vy: Set Vx = Vx & Vy
          case 0x2:
            this.V[x] &= this.V[y];
            this.V[0xF] = 0; // CHIP-8 quirk: VF reset
            break;

          // 8XY3 — XOR Vx, Vy: Set Vx = Vx ^ Vy
          case 0x3:
            this.V[x] ^= this.V[y];
            this.V[0xF] = 0; // CHIP-8 quirk: VF reset
            break;

          // 8XY4 — ADD Vx, Vy: Set Vx = Vx + Vy, VF = carry
          case 0x4: {
            const sum = this.V[x] + this.V[y];
            this.V[x] = sum & 0xFF;
            this.V[0xF] = sum > 0xFF ? 1 : 0;
            break;
          }

          // 8XY5 — SUB Vx, Vy: Set Vx = Vx - Vy, VF = NOT borrow
          case 0x5: {
            const notBorrow = this.V[x] >= this.V[y] ? 1 : 0;
            this.V[x] = (this.V[x] - this.V[y]) & 0xFF;
            this.V[0xF] = notBorrow;
            break;
          }

          // 8XY6 — SHR Vx {, Vy}: Shift Vy right by 1, store in Vx. VF = LSB before shift
          case 0x6: {
            const lsb = this.V[y] & 0x1;
            this.V[x] = this.V[y] >> 1;
            this.V[0xF] = lsb;
            break;
          }

          // 8XY7 — SUBN Vx, Vy: Set Vx = Vy - Vx, VF = NOT borrow
          case 0x7: {
            const notBorrow = this.V[y] >= this.V[x] ? 1 : 0;
            this.V[x] = (this.V[y] - this.V[x]) & 0xFF;
            this.V[0xF] = notBorrow;
            break;
          }

          // 8XYE — SHL Vx {, Vy}: Shift Vy left by 1, store in Vx. VF = MSB before shift
          case 0xE: {
            const msb = (this.V[y] >> 7) & 0x1;
            this.V[x] = (this.V[y] << 1) & 0xFF;
            this.V[0xF] = msb;
            break;
          }

          default:
            // Unknown 8XY_ sub-opcode
            break;
        }
        break;

      // ──── 9XY0 — SNE Vx, Vy: Skip next instruction if Vx != Vy ────
      case 0x9000:
        if (this.V[x] !== this.V[y]) {
          this.PC += 2;
        }
        break;

      // ──── ANNN — LD I, addr: Set I = NNN ────
      case 0xA000:
        this.I = nnn;
        break;

      // ──── BNNN — JP V0, addr: Jump to NNN + V0 ────
      case 0xB000:
        this.PC = (nnn + this.V[0]) & 0xFFF;
        break;

      // ──── CXNN — RND Vx, byte: Set Vx = random byte AND NN ────
      case 0xC000:
        this.V[x] = (Math.floor(Math.random() * 256)) & nn;
        break;

      // ──── DXYN — DRW Vx, Vy, nibble: Draw sprite at (Vx, Vy) with N bytes of sprite data starting at address I ────
      // The sprite is XORed onto the display. VF is set to 1 if any pixels are erased (collision).
      case 0xD000: {
        const xPos = this.V[x] % DISPLAY_WIDTH;
        const yPos = this.V[y] % DISPLAY_HEIGHT;
        this.V[0xF] = 0; // Reset collision flag

        for (let row = 0; row < n; row++) {
          if (yPos + row >= DISPLAY_HEIGHT) break; // Clip at bottom edge

          const spriteByte = this.readMem(this.I + row);

          for (let col = 0; col < 8; col++) {
            if (xPos + col >= DISPLAY_WIDTH) break; // Clip at right edge

            // Check if the current pixel in the sprite is set (MSB first)
            const spritePixel = (spriteByte >> (7 - col)) & 1;

            if (spritePixel === 1) {
              const displayIndex = (yPos + row) * DISPLAY_WIDTH + (xPos + col);

              // If display pixel is already on, we have a collision
              if (this.display[displayIndex] === 1) {
                this.V[0xF] = 1;
              }

              // XOR the pixel
              this.display[displayIndex] ^= 1;
            }
          }
        }

        this.drawFlag = true;
        break;
      }

      // ──── EX__ — Keyboard operations ────
      case 0xE000:
        switch (nn) {
          // EX9E — SKP Vx: Skip next instruction if key Vx is pressed
          case 0x9E:
            if (this.keys[this.V[x] & 0xF]) {
              this.PC += 2;
            }
            break;

          // EXA1 — SKNP Vx: Skip next instruction if key Vx is NOT pressed
          case 0xA1:
            if (!this.keys[this.V[x] & 0xF]) {
              this.PC += 2;
            }
            break;

          default:
            break;
        }
        break;

      // ──── FX__ — Misc operations ────
      case 0xF000:
        switch (nn) {
          // FX07 — LD Vx, DT: Set Vx = delay timer value
          case 0x07:
            this.V[x] = this.DT;
            break;

          // FX0A — LD Vx, K: Wait for a key press, store the key value in Vx
          case 0x0A:
            this.waitingForKey = true;
            this.waitKeyRegister = x;
            break;

          // FX15 — LD DT, Vx: Set delay timer = Vx
          case 0x15:
            this.DT = this.V[x];
            break;

          // FX18 — LD ST, Vx: Set sound timer = Vx
          case 0x18:
            this.ST = this.V[x];
            break;

          // FX1E — ADD I, Vx: Set I = I + Vx
          case 0x1E:
            this.I = (this.I + this.V[x]) & 0xFFF;
            break;

          // FX29 — LD F, Vx: Set I = location of sprite for digit Vx (font character)
          case 0x29:
            // Each font character is 5 bytes, starting at 0x000
            this.I = (this.V[x] & 0xF) * 5;
            break;

          // FX33 — LD B, Vx: Store BCD representation of Vx at I, I+1, I+2
          case 0x33: {
            const val = this.V[x];
            this.writeMem(this.I, Math.floor(val / 100));       // hundreds
            this.writeMem(this.I + 1, Math.floor(val / 10) % 10); // tens
            this.writeMem(this.I + 2, val % 10);                 // ones
            break;
          }

          // FX55 — LD [I], Vx: Store registers V0 through Vx in memory starting at I
          case 0x55:
            for (let i = 0; i <= x; i++) {
              this.writeMem(this.I + i, this.V[i]);
            }
            this.I = (this.I + x + 1) & 0xFFF; // CHIP-8 quirk: I is incremented
            break;

          // FX65 — LD Vx, [I]: Read registers V0 through Vx from memory starting at I
          case 0x65:
            for (let i = 0; i <= x; i++) {
              this.V[i] = this.readMem(this.I + i);
            }
            this.I = (this.I + x + 1) & 0xFFF; // CHIP-8 quirk: I is incremented
            break;

          default:
            break;
        }
        break;

      default:
        // Unknown opcode
        break;
    }

    this.cycleCount++;
  }
}
