<div align="center">

# OCTO-8

### A cinematic CHIP-8 emulator &amp; visual debugger for the browser

Run classic ROMs, step through live assembly, watch memory breathe, and ask an
on-device AI what every opcode means — all in a fast, beautiful studio.

[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-e8b04b.svg)](./LICENSE)

[**Live Demo**](https://octo-8.vercel.app) · [Report a bug](https://github.com/shahriar-ahmed-seam/octo-8/issues) · [What is CHIP-8?](https://en.wikipedia.org/wiki/CHIP-8)

</div>

---

## Overview

**CHIP-8** is a tiny virtual machine from the 1970s — 4KB of memory, 16 registers,
a 64×32 monochrome display, and a 35-instruction set. It's the "hello world" of
emulator development. **OCTO-8** takes that humble spec and wraps it in a
production-grade, cinematic studio built for _understanding_ how the machine
works.

The CPU runs in a **Web Worker** so emulation never blocks the UI, and every part
of the machine — registers, stack, memory, and the program counter — is
visualised in real time.

## Features

- **Cycle-accurate core** — all 35 CHIP-8 instructions, executed off-thread in a Web Worker.
- **Live disassembly** — follow the PC through annotated assembly with **click-to-set breakpoints** (enforced precisely inside the worker).
- **Memory heatmap** — a canvas visualisation of all 4KB; reads glow blue, writes glow orange, and the hot path of execution decays over time.
- **Deep inspection** — registers (hex / decimal / binary), the call stack with a live SP pointer, and a hex-editor-style memory inspector.
- **On-device AI assistant** — an Ollama model (`gemma3:4b` by default) that is aware of live CPU state and explains opcodes, registers, and program behaviour. Streams token-by-token.
- **Authentic feel** — five CRT phosphor themes, scanline overlay, real Web Audio buzzer for the sound timer, and a gamepad-style keypad.
- **Verified ROM library** — the canonical IBM Logo, David Winter's Maze, and hand-traced demos, plus drag-in support for any `.ch8` file.
- **State snapshots** — save and restore the full machine state instantly.
- **Responsive & keyboard-first** — works from ultrawide down to mobile, with `F5` / `F10` / `Esc` transport shortcuts.

## Screenshots

> The landing hero and studio use cinematic imagery curated from Unsplash at
> build time. Launch the [live demo](https://octo-8.vercel.app) for the full
> experience.

## Tech stack

| Layer        | Choice                                            |
| ------------ | ------------------------------------------------- |
| UI           | React 19 + TypeScript, hand-rolled CSS design system |
| Build        | Vite 7 (ES module Web Workers)                    |
| Emulation    | Plain TypeScript `Chip8CPU`, no dependencies      |
| AI           | Ollama (`gemma3:4b`) via a Vercel Edge proxy or direct local connection |
| Hosting      | Vercel (frontend + `/api`) · Render (optional Ollama) |

## Getting started

```bash
# 1. Install
npm install

# 2. Run the dev server
npm run dev

# 3. Build for production
npm run build && npm run preview
```

> **Windows note:** if your project path contains a `&` (e.g. `Games & Emulators`),
> the npm script runner can choke on it. Run the build steps directly instead:
> `node ./node_modules/typescript/bin/tsc && node ./node_modules/vite/bin/vite.js build`.

## Using the AI assistant

The assistant talks to an [Ollama](https://ollama.com) server. There are two ways
to connect:

### Local (great for development)

```bash
# Pull the model and allow the browser to reach Ollama
ollama pull gemma3:4b
OLLAMA_ORIGINS=* ollama serve
```

Open the **Assistant** tab → the status pill turns green (`Local`). The default
URL is `http://localhost:11434` and can be changed in the assistant settings.

### Hosted (for the deployed site)

Deploy the Ollama service (see [`deploy/render.yaml`](./deploy/render.yaml) and
[`deploy/ollama`](./deploy/ollama)), then set `OLLAMA_URL` on your Vercel project.
The browser calls the same-origin `/api/assistant` Edge function, which forwards
to your Ollama instance. No model or key is ever exposed to the browser.

If no backend is reachable, the assistant degrades gracefully and tells the user
how to connect — the rest of the emulator is unaffected.

## Deployment

### Frontend → Vercel

```bash
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard for push-to-deploy. Config
lives in [`vercel.json`](./vercel.json). Optional environment variables:

| Variable       | Scope        | Purpose                                    |
| -------------- | ------------ | ------------------------------------------ |
| `OLLAMA_URL`   | Server       | Ollama endpoint for `/api/assistant`       |
| `OLLAMA_MODEL` | Server       | Model name (default `gemma3:4b`)           |

### Optional AI backend → Render

The [`deploy/render.yaml`](./deploy/render.yaml) blueprint deploys Ollama as a Docker web
service with a persistent disk for the model cache.

## Keyboard & controls

The original 16-key hex keypad maps to the left of a QWERTY keyboard:

```
CHIP-8 keypad        Your keyboard
1 2 3 C              1 2 3 4
4 5 6 D      ⇐       Q W E R
7 8 9 E              A S D F
A 0 B F              Z X C V
```

| Shortcut | Action        |
| -------- | ------------- |
| `F5`     | Run / Pause   |
| `F10`    | Step one instruction |
| `Esc`    | Stop          |

## Project structure

```
octo-8/
├── api/
│   └── assistant.ts          # Vercel Edge proxy → Ollama
├── deploy/ollama/            # Dockerfile + start script for the AI backend
├── scripts/
│   └── fetch-images.mjs      # build-time Unsplash curator
├── src/
│   ├── ai/assistant.ts       # AI client (streaming, state-aware)
│   ├── audio/beeper.ts       # Web Audio sound-timer buzzer
│   ├── components/
│   │   ├── landing/          # cinematic landing page
│   │   ├── studio/           # emulator workspace + debug panels
│   │   └── ui/               # icons, toasts
│   ├── core/                 # Chip8CPU, disassembler, worker, messages
│   ├── data/                 # themes, curated gallery
│   ├── hooks/                # useEmulator, useToast
│   ├── roms/                 # verified bundled ROMs
│   └── styles/               # design system (tokens + partials)
└── vercel.json · deploy/render.yaml
```

## How it works

The `Chip8CPU` (in `src/core/cpu.ts`) implements the fetch → decode → execute
loop and exposes a serialisable state snapshot. It lives entirely inside a Web
Worker (`src/core/worker.ts`), which runs the emulation loop at ~60fps and
decrements the delay/sound timers at 60Hz. The main thread sends commands
(load, run, step, set breakpoints…) and receives state updates, which drive
every panel in the UI. Because the CPU never touches the DOM, the interface
stays smooth even at high clock speeds.

## Credits

- Emulation reference: [Cowgod's CHIP-8 Technical Reference](http://devernay.free.fr/hacks/chip8/C8TECH10.HTM) and [Tobias V. Langhoff's guide](https://tobiasvl.github.io/blog/write-a-chip-8-emulator/).
- Cinematic imagery: [Unsplash](https://unsplash.com) — curated at build time, attribution shown in-app.
- Local AI: [Ollama](https://ollama.com) with Google's Gemma models.

## License

[MIT](./LICENSE) © Shahriar Ahmed
