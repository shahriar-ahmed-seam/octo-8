/**
 * Icon — a small, dependency-free line-icon set drawn with inline SVG.
 *
 * Using inline SVG (instead of an icon font or emoji) keeps the bundle lean,
 * makes icons inherit `currentColor`, and gives crisp rendering at any size.
 */

export type IconName =
  | 'play'
  | 'pause'
  | 'step'
  | 'reset'
  | 'upload'
  | 'save'
  | 'restore'
  | 'chip'
  | 'display'
  | 'keypad'
  | 'registers'
  | 'stack'
  | 'code'
  | 'memory'
  | 'map'
  | 'sparkles'
  | 'volume'
  | 'mute'
  | 'gear'
  | 'send'
  | 'close'
  | 'arrowRight'
  | 'github'
  | 'palette'
  | 'bolt'
  | 'gamepad';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const PATHS: Record<IconName, React.ReactNode> = {
  play: <path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" />
    </>
  ),
  step: (
    <>
      <path d="M5 4l10 8-10 8V4z" fill="currentColor" stroke="none" />
      <rect x="17" y="4" width="3" height="16" fill="currentColor" stroke="none" />
    </>
  ),
  reset: <path d="M4 4v6h6M20 20v-6h-6M20 9a8 8 0 0 0-14.9-2M4 15a8 8 0 0 0 14.9 2" />,
  upload: <path d="M12 16V4m0 0l-5 5m5-5l5 5M4 20h16" />,
  save: <path d="M5 3h11l3 3v15H5V3zM8 3v5h8M8 21v-6h8v6" />,
  restore: <path d="M3 8l4-4 4 4M7 4v9a5 5 0 0 0 5 5h6" />,
  chip: (
    <path d="M8 8h8v8H8zM4 9V7a3 3 0 0 1 3-3h2M15 4h2a3 3 0 0 1 3 3v2M20 15v2a3 3 0 0 1-3 3h-2M9 20H7a3 3 0 0 1-3-3v-2" />
  ),
  display: <path d="M3 5h18v12H3zM8 21h8M12 17v4" />,
  keypad: <path d="M4 4h16v16H4zM9 4v16M15 4v16M4 9h16M4 15h16" />,
  registers: <path d="M4 6h16M4 12h16M4 18h10" />,
  stack: <path d="M12 3l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5" />,
  code: <path d="M8 6l-5 6 5 6M16 6l5 6-5 6M13 4l-2 16" />,
  memory: <path d="M4 5h16v14H4zM8 5v14M12 5v14M16 5v14" />,
  map: <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />,
  sparkles: (
    <path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8L12 3zM19 14l.9 2.3L22 17l-2.1.7L19 20l-.9-2.3L16 17l2.1-.7L19 14z" />
  ),
  volume: <path d="M4 9v6h4l5 4V5L8 9H4zM16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14" />,
  mute: <path d="M4 9v6h4l5 4V5L8 9H4zM17 9l5 6M22 9l-5 6" />,
  gear: (
    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1l-.4-2.5H10.9l-.4 2.5a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 1.7 1l.4 2.5h3.9l.4-2.5a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6z" />
  ),
  send: <path d="M4 12l16-8-6 16-3-7-7-1z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  arrowRight: <path d="M4 12h16M14 6l6 6-6 6" />,
  github: (
    <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.4 4.7-4.6 4.9.3.3.6.9.6 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z" fill="currentColor" stroke="none" />
  ),
  palette: (
    <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7zM7.5 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
  ),
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  gamepad: (
    <path d="M7 8h10a5 5 0 0 1 5 5c0 2-1.5 3.5-3.4 3.5-1 0-1.8-.5-2.4-1.2L15 14H9l-1.2 1.3c-.6.7-1.4 1.2-2.4 1.2C3.5 16.5 2 15 2 13a5 5 0 0 1 5-5zM6 11v3M4.5 12.5h3M15 11h.01M17.5 13h.01" />
  ),
};

export default function Icon({ name, size = 18, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
