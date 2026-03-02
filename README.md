# Spinning Wheel 🎡

A fun roulette wheel for group challenges, forfeits, and party games. Built with React 19, TypeScript, and Tauri v2. Perfect for projecting on large screens during meetings, parties, or group activities.

## Language

[🇬🇧 English](README.md) | [🇪🇸 Español](README.es.md)

![Material Design 3](https://img.shields.io/badge/Material-Design%203-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![i18n](https://img.shields.io/badge/i18n-English%2FSpanish-green)

## ✨ Features

- 🎨 **5 Color Palettes**: Vibrant Sunset, Electric Night, Tropical Forest, Berry Punch, **Fiesta**
- 🎊 **Clear result display**: Selected challenge shown large when wheel stops
- 🔊 **Sound effects**: Tick sounds during spin, victory fanfare on stop (with mute toggle)
- 🌍 **Bilingual**: English and Spanish with instant language switching
- 🔄 **Turn Mode**: Eliminate options after each spin until everyone participates
- 🖥️ **Fullscreen mode**: Perfect for projectors and large screens
- 📱 **Responsive design**: Adapts to any window size
- ⚡ **GPU Accelerated**: Smooth animations with Framer Motion
- 🔒 **100% Offline**: Fonts, icons, and sounds bundled locally

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite |
| **UI Framework** | Material Design 3 (custom) |
| **Animations** | Framer Motion |
| **Desktop** | Tauri v2 (Rust backend) |
| **Audio** | Web Audio API (synthesized) |
| **Effects** | Canvas Confetti |
| **i18n** | react-i18next |

## 📦 Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** (for Tauri builds) — Install via [rustup.rs](https://rustup.rs)

### Development Setup

```bash
cd spinning-wheel

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

## 🔨 Building for Production

```bash
# Frontend only
npm run build

# Full build for current platform
npm run tauri build
```

Build artifacts are located in:

```
src-tauri/target/release/bundle/
```

#### Windows 🪟
| Type | Location | Format |
|------|----------|--------|
| Installer | `msi/*.msi` | Windows Installer |
| Portable | `binary/*.exe` | Standalone EXE |

#### macOS 🍎
| Type | Location | Format |
|------|----------|--------|
| Installer | `dmg/*.dmg` | Disk Image |
| Portable | `macos/*.app` | App Bundle |

#### Linux 🐧
| Type | Location | Format |
|------|----------|--------|
| Debian | `deb/*.deb` | For Debian/Ubuntu |
| AppImage | `appimage/*.AppImage` | Universal Linux |
| RPM | `rpm/*.rpm` | For Fedora/RHEL |

### System Dependencies (Linux/Debian)

```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
npm run tauri build
```

## 📖 Usage

### Basic Operation

1. **Spin the wheel**: Click the "Spin!" button (or press `Enter`)
2. **View result**: Selected challenge appears large when wheel stops
3. **Continue**: Click "Continue" to return to the wheel
4. **Add challenges**: Open Settings (⚙️) → type in field → Add
5. **Change palette**: In Settings, select one of the 5 palettes
6. **Mute**: Click volume icon (🔊/🔇)
7. **Language**: Click language icon to toggle EN/ES
8. **Fullscreen**: Click ⛶ for presentation mode

### Turn Mode

Allows everyone to participate by eliminating options after each spin:

1. Enable turn mode 🔄 in the top bar (icon turns red)
2. Spin — selected challenge is marked as "played"
3. Click "Continue" to proceed with remaining options
4. When everyone has participated, the final screen appears 🎉

## 🎨 Color Palettes

| Palette | Seed Color | Best For |
|---------|------------|----------|
| **Vibrant Sunset** | `#FF5722` | Energy, excitement |
| **Electric Night** | `#6750A4` | Modern, tech events |
| **Tropical Forest** | `#00BFA5` | Nature, growth |
| **Berry Punch** | `#984061` | Fun, playful events |
| **Fiesta** | `#FF1744` | Parties, maximum energy 🎉 |

## 🌐 Internationalization (i18n)

The app supports **English** (default) and **Spanish**.

Translations are located in `src/i18n/locales/`:
- `en.json` — English
- `es.json` — Spanish

## 📁 Project Structure

```
spinning-wheel/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── App.css                 # Material Design 3 styles
│   ├── main.tsx                # React entry point
│   ├── i18n.ts                 # i18next configuration
│   ├── hooks/
│   │   └── useAudio.ts         # Audio hook (Web Audio API)
│   ├── theme/
│   │   └── m3-theme.ts         # M3 color system & palettes
│   └── assets/
│       ├── fonts/              # Roboto fonts (offline)
│       └── icons/              # Material Icons (offline)
├── src-tauri/
│   ├── src/                    # Rust backend
│   ├── capabilities/           # Tauri permissions
│   ├── tauri.conf.json         # Tauri configuration
│   └── Cargo.toml              # Rust dependencies
├── index.html                  # HTML template with CSP
├── package.json                # Node.js dependencies
└── vite.config.ts              # Vite configuration
```

## 🔒 Security

Strict Content Security Policy (no external calls):

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; img-src 'self' asset: https://asset.localhost data: blob:; ...">
```

## ⚡ Performance

- **GPU Acceleration**: Animations use `transform` and `opacity`
- **Canvas**: Hardware-accelerated 2D rendering
- **Web Audio API**: Synthesized sounds (no external audio files)
- **will-change**: CSS hints for optimized animations

## ❓ Troubleshooting

### Sound not working
1. Check that mute button is not active (red = muted)
2. Click anywhere to unlock audio context
3. Check system volume

### Wheel not spinning
1. Ensure at least one option exists
2. Check if result screen is showing from previous spin
3. Click "Restart" in Settings

### Text hard to read on projector
1. Use short text (1-3 words, max 20 characters)
2. Select "Fiesta" or "Vibrant Sunset" palette (maximum contrast)
3. Enable Fullscreen mode

---

**Version:** 1.0.0
**Last Updated:** 2026
**Platforms:** Windows, macOS, Linux
