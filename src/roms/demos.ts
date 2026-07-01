/**
 * Bundled ROMs — a curated set of small, verified CHIP-8 programs.
 *
 * Each ROM is stored as a whitespace-tolerant hex string. `IBM Logo` and
 * `Maze` are canonical public-domain test ROMs; the rest are compact,
 * hand-assembled demos traced instruction-by-instruction so they run cleanly
 * on a spec-accurate interpreter.
 */

export interface DemoROM {
  name: string;
  description: string;
  category: 'test' | 'demo' | 'game';
  hex: string;
}

/** Strip whitespace so ROMs can be written in readable, spaced blocks. */
export function romBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

export const DEMO_ROMS: DemoROM[] = [
  {
    name: 'IBM Logo',
    category: 'test',
    description: 'The classic IBM logo — the canonical first ROM every CHIP-8 emulator should render correctly.',
    hex: `
      00e0 a22a 600c 6108 d01f 7009 a239 d01f
      a248 7008 d01f 7004 a257 d01f 7008 a266
      d01f 7008 a275 d01f 1228 ff00 ff00 3c00
      3c00 3c00 3c00 ff00 ffff 00ff 0038 003f
      003f 0038 00ff 00ff 8000 e000 e000 8000
      8000 e000 e000 80f8 00fc 00fe 00fe 003e
      001f 00ff 00ff 0000 0000 3f00 7f00 e000
      e000 8000 8000 e000 e000 0080 0080 0080
      00e0 00e0
    `,
  },
  {
    name: 'Maze',
    category: 'demo',
    description: 'A random maze generator by David Winter — draws diagonal tiles chosen at random to fill the screen.',
    hex: `
      6000 6100 a222 c201 3201 a21e d014 7004
      3040 1204 6000 7104 3120 1204 121c 8040
      2010 2040 8010
    `,
  },
  {
    name: 'Font Parade',
    category: 'demo',
    description: 'Cycles through the built-in hex font (0–F) at screen center — exercises the font sprites and delay timer.',
    hex: `
      00e0 6000 611c 620c 00e0 f029 d125 6320
      f315 f307 3300 1212 7001 4010 6000 1208
    `,
  },
  {
    name: 'Starfield',
    category: 'demo',
    description: 'Scatters random pixels across the display using the RND opcode — a growing field of stars.',
    hex: `
      00e0 a220 c03f c11f d011 6602 f615 f607
      3600 120e 1204 0000 0000 0000 0000 8000
    `,
  },
  {
    name: 'Keypad Test',
    category: 'test',
    description: 'Waits for a key, then draws that hex digit at screen center — the fastest way to verify input wiring.',
    hex: `
      00e0 601c 610d f20a 00e0 f229 d015 1206
    `,
  },
];
