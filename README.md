# Spinning Wheel

Desktop spinning wheel for group challenges and quick random decisions.
Built with React + TypeScript + Tauri v2.

## Language

[English](README.md) | [Español](README.es.md)

## Features

- 5 built-in color palettes
- Custom challenge list (add, edit, remove)
- Turn mode (eliminates selected options until all are played)
- Sound effects with mute toggle
- Fullscreen support
- English/Spanish UI switch
- Keyboard shortcuts (`Enter`, `Esc`)
- Offline-friendly assets and generated native icons

## Tech Stack

- React 19
- TypeScript
- Vite
- Framer Motion
- i18next + react-i18next
- Tauri v2 (Rust)

## Requirements

- Node.js 18+
- npm
- Rust toolchain (for Tauri desktop build)

## Run in Development

```bash
npm install
npm run tauri dev
```

## Build

```bash
# Web build
npm run build

# Desktop bundle
npm run tauri build
```

Desktop bundles are generated under `src-tauri/target/release/bundle/`.

## Keyboard Shortcuts

- `Enter`: spin wheel / continue result / add option (when typing in input)
- `Esc`: close settings drawer or close result overlay

## Project Structure

```text
spinning-wheel/
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── hooks/useAudio.ts
│   ├── i18n.ts
│   ├── i18n/locales/
│   └── theme/m3-theme.ts
├── public/
│   └── app-icon.svg
├── src-tauri/
│   ├── src/
│   ├── icons/
│   └── tauri.conf.json
├── README.md
├── README.es.md
├── USER_GUIDE.md
└── USER_GUIDE.es.md
```

## Notes

- Settings are persisted in `localStorage`.
- Native app icons are generated from `public/app-icon.svg` using:

```bash
npm run tauri icon public/app-icon.svg
```
