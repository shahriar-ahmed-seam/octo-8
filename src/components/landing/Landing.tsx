/**
 * Landing — the cinematic entry experience.
 *
 * A full-bleed 4K hero (curated from Unsplash at build time) introduces the
 * product, followed by a capabilities grid and an image showcase. The single
 * CTA hands off to the Studio via `onEnter`.
 */

import Icon, { type IconName } from '../ui/Icon';
import { GALLERY, img } from '../../data/gallery';

interface LandingProps {
  onEnter: () => void;
}

interface Feature {
  icon: IconName;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: 'chip',
    title: 'Cycle-accurate core',
    body: 'All 35 CHIP-8 instructions, executed in a dedicated Web Worker so the UI never drops a frame.',
  },
  {
    icon: 'code',
    title: 'Live disassembly',
    body: 'Follow the program counter through annotated assembly with click-to-set breakpoints.',
  },
  {
    icon: 'map',
    title: 'Memory heatmap',
    body: 'Watch the hot path of execution light up across all 4KB of memory in real time.',
  },
  {
    icon: 'registers',
    title: 'Deep inspection',
    body: 'Registers, stack, and a hex memory inspector — in hex, decimal, or binary.',
  },
  {
    icon: 'sparkles',
    title: 'AI assistant',
    body: 'An on-device model (Ollama · gemma3:4b) explains opcodes and state as you step.',
  },
  {
    icon: 'palette',
    title: 'CRT aesthetics',
    body: 'Five phosphor themes, authentic scanlines, real audio, and a gamepad-ready keypad.',
  },
];

const STATS = [
  { value: '35', label: 'Opcodes' },
  { value: '4KB', label: 'Addressable memory' },
  { value: '64×32', label: 'Display' },
  { value: '60Hz', label: 'Timers' },
];

export default function Landing({ onEnter }: LandingProps) {
  return (
    <div className="landing">
      {/* ── Top nav ── */}
      <nav className="landing-nav">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="chip" size={20} />
          </span>
          <span className="brand-name">OCTO-8</span>
        </div>
        <div className="landing-nav-actions">
          <a
            className="ghost-link"
            href="https://github.com/shahriar-ahmed-seam/octo-8"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="github" size={18} /> <span>GitHub</span>
          </a>
          <button className="btn-primary" onClick={onEnter}>
            Launch Studio <Icon name="arrowRight" size={16} />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="hero">
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${img(GALLERY.hero.base, 2600)})` }}
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-eyebrow">CHIP-8 · Emulator &amp; Visual Debugger</span>
          <h1 className="hero-title">
            The retro machine,<br />
            <span className="hero-accent">rendered in cinema.</span>
          </h1>
          <p className="hero-sub">
            OCTO-8 turns a 1970s virtual machine into a living studio — run classic ROMs, step
            through assembly, watch memory breathe, and ask an AI what every opcode means.
          </p>
          <div className="hero-cta">
            <button className="btn-primary lg" onClick={onEnter}>
              <Icon name="play" size={18} /> Enter the Studio
            </button>
            <a
              className="btn-ghost lg"
              href="https://en.wikipedia.org/wiki/CHIP-8"
              target="_blank"
              rel="noreferrer"
            >
              What is CHIP-8?
            </a>
          </div>
          <div className="hero-stats">
            {STATS.map((s) => (
              <div key={s.label} className="hero-stat">
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-scroll">Scroll to explore</div>
      </header>

      {/* ── Features ── */}
      <section className="section features">
        <div className="section-head">
          <span className="section-kicker">Built for understanding</span>
          <h2>A debugger that shows its work.</h2>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="feature-card">
              <span className="feature-icon">
                <Icon name={f.icon} size={22} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Showcase ── */}
      <section className="section showcase">
        <div
          className="showcase-panel"
          style={{ backgroundImage: `url(${img(GALLERY.retro.base, 1800)})` }}
        >
          <div className="showcase-inner">
            <h2>Load a ROM. Watch it think.</h2>
            <p>
              From the IBM logo to a David Winter maze, OCTO-8 ships with verified programs — or drop
              in any <code>.ch8</code> file and take control.
            </p>
            <button className="btn-primary" onClick={onEnter}>
              Start emulating <Icon name="arrowRight" size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <Icon name="chip" size={18} /> OCTO-8
        </div>
        <p className="footer-note">
          A cinematic CHIP-8 emulator &amp; visual debugger. Built with React, TypeScript &amp; Web
          Workers.
        </p>
        <p className="footer-credit">
          Imagery via Unsplash —{' '}
          <a href={GALLERY.hero.authorUrl} target="_blank" rel="noreferrer">
            {GALLERY.hero.author}
          </a>
          ,{' '}
          <a href={GALLERY.retro.authorUrl} target="_blank" rel="noreferrer">
            {GALLERY.retro.author}
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
