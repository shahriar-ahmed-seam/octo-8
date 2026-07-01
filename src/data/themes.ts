/**
 * Display themes — CRT phosphor palettes for the CHIP-8 screen.
 *
 * Each theme defines the "on" and "off" pixel colors plus a glow color used
 * for the bloom effect on lit pixels. Themes are purely cosmetic and can be
 * switched live without touching emulation state.
 */

export interface DisplayTheme {
  id: string;
  name: string;
  /** Lit pixel color */
  on: string;
  /** Unlit pixel / background color */
  off: string;
  /** Glow color for the bloom around lit pixels */
  glow: string;
  /** Subtle grid line color */
  grid: string;
  /** Accent used for the theme swatch in the UI */
  accent: string;
}

export const DISPLAY_THEMES: DisplayTheme[] = [
  {
    id: 'phosphor',
    name: 'Phosphor Green',
    on: '#4ade80',
    off: '#07100a',
    glow: '#22c55e',
    grid: '#0f1b13',
    accent: '#4ade80',
  },
  {
    id: 'amber',
    name: 'Amber CRT',
    on: '#ffb757',
    off: '#120a03',
    glow: '#ff9500',
    grid: '#1c1206',
    accent: '#ffb757',
  },
  {
    id: 'ice',
    name: 'Ice Blue',
    on: '#5fd3ff',
    off: '#050c14',
    glow: '#2ba7e0',
    grid: '#0b1720',
    accent: '#5fd3ff',
  },
  {
    id: 'plasma',
    name: 'Plasma',
    on: '#ff5ea8',
    off: '#12060d',
    glow: '#ff2d87',
    grid: '#1d0a15',
    accent: '#ff5ea8',
  },
  {
    id: 'paper',
    name: 'Paper White',
    on: '#f4f6fb',
    off: '#0a0b0e',
    glow: '#c9d4e6',
    grid: '#15171c',
    accent: '#f4f6fb',
  },
];

export const DEFAULT_THEME_ID = 'phosphor';

export function getTheme(id: string): DisplayTheme {
  return DISPLAY_THEMES.find((t) => t.id === id) ?? DISPLAY_THEMES[0];
}
