# Spinning Wheel

A professional Material Design 3 spinning wheel application built with React 19, TypeScript, and Tauri v2. Perfect for decision making, games, presentations, and interactive activities.

![Material Design 3](https://img.shields.io/badge/Material-Design%203-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![i18n](https://img.shields.io/badge/i18n-English%2FSpanish-green)

## ✨ Features

- 🎨 **4 Professional Color Palettes**: Vibrant Sunset, Electric Night, Tropical Forest, Berry Punch
- 🔊 **Sound Effects**: Tick sounds during spin, victory fanfare on win (with mute toggle)
- 🌍 **Bilingual Support**: English and Spanish with instant language switching
- 🎯 **Elimination Mode**: Remove options after each spin
- 🖥️ **Fullscreen Mode**: Perfect for presentations and projectors
- 📱 **Responsive Design**: Works on all screen sizes
- ⚡ **GPU Accelerated**: Smooth 60fps animations with Framer Motion
- 🔒 **Offline First**: All assets (fonts, icons, sounds) bundled locally

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
- **Rust** (for Tauri builds) - Install via [rustup.rs](https://rustup.rs)

### Development Setup

```bash
# Clone the repository
cd spinning-wheel

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

## 🔨 Building for Production

### Build Commands

```bash
# Build frontend only
npm run build

# Build for current platform (installers + portable)
npm run tauri build
```

### Build Output Locations

After running `npm run tauri build`, artifacts are located in:

```
src-tauri/target/release/bundle/
```

#### Windows 🪟

| Type | Location | Format | Description |
|------|----------|--------|-------------|
| **Installer** | `msi/*.msi` | Windows Installer | Standard MSI installer |
| **Portable** | `binary/*.exe` | Standalone EXE | No installation required |

#### macOS 🍎

| Type | Location | Format | Description |
|------|----------|--------|-------------|
| **Installer** | `dmg/*.dmg` | Disk Image | DMG installer |
| **Portable** | `macos/*.app` | App Bundle | Standalone application |

#### Linux 🐧

| Type | Location | Format | Description |
|------|----------|--------|-------------|
| **Debian** | `deb/*.deb` | Debian Package | For Debian/Ubuntu |
| **AppImage** | `appimage/*.AppImage` | Portable AppImage | Universal Linux format |
| **RPM** | `rpm/*.rpm` | RPM Package | For Fedora/RHEL |

### Platform-Specific Build Notes

#### Windows

```bash
# Ensure Visual Studio Build Tools are installed
# Install Rust: winget install Rustlang.Rustup
npm run tauri build
```

#### macOS

```bash
# Install Xcode Command Line Tools
xcode-select --install
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
npm run tauri build
```

#### Linux (Debian/Ubuntu)

```bash
# Install required dependencies
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
npm run tauri build
```

## 📖 Usage

### Basic Operation

1. **Spin the Wheel**: Click the "Spin" FAB (Floating Action Button)
2. **Add Options**: Open Settings (⚙️) → Add new options
3. **Change Palette**: Select from 4 color palettes in Settings
4. **Toggle Sound**: Click volume icon (🔊/🔇) to mute/unmute
5. **Switch Language**: Click language icon (🇬🇧/🇪🇸) to toggle English/Spanish
6. **Fullscreen**: Click fullscreen icon (⛶) for presentation mode

### Elimination Mode

Enable elimination mode to remove options after each spin:

1. Click the trash icon (🗑️) in the top bar
2. Icon turns red when active
3. Spin the wheel - winner is automatically eliminated
4. Continue until all options are removed

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Spin wheel / Add option |
| `Esc` | Exit fullscreen / Close settings |

## 🎨 Color Palettes

| Palette | Seed Color | Colors | Best For |
|---------|------------|--------|----------|
| **Vibrant Sunset** | `#FF5722` | Orange, Amber, Red, Yellow | Energy, excitement |
| **Electric Night** | `#6750A4` | Purple, Blue, Cyan, Magenta | Modern, tech events |
| **Tropical Forest** | `#006A6A` | Green, Teal, Lime | Nature, growth |
| **Berry Punch** | `#984061` | Raspberry, Pink, Violet, Coral | Fun, playful events |

## 🌐 Internationalization (i18n)

The application supports **English** (default) and **Spanish**.

### Changing Language

1. Click the language icon in the top-right corner
2. Icon shows current language (🇬🇧 = English, 🇪🇸 = Spanish)
3. Language preference is saved in localStorage

### Translation Files

Translations are stored in `src/i18n/locales/`:

- `en.json` - English translations
- `es.json` - Spanish translations

## 📁 Project Structure

```
spinning-wheel/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── App.css                 # Material Design 3 styles
│   ├── main.tsx                # React entry point
│   ├── i18n.ts                 # i18next configuration
│   ├── hooks/
│   │   └── useAudio.ts         # Audio system hook
│   ├── theme/
│   │   └── m3-theme.ts         # M3 color system & tokens
│   └── assets/
│       ├── fonts/              # Roboto font files (offline)
│       └── icons/              # Material Symbols (offline)
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

### Content Security Policy (CSP)

The application uses a strict CSP:

```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; img-src 'self' asset: https://asset.localhost data: blob:; media-src 'self' asset: https://asset.localhost blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' asset: https://asset.localhost;">
```

### Tauri Capabilities

Window manipulation permissions in `src-tauri/capabilities/default.json`:

```json
{
  "permissions": [
    "core:default",
    "core:window:allow-set-fullscreen"
  ]
}
```

## ⚡ Performance

- **GPU Acceleration**: All animations use `transform` and `opacity`
- **Preloaded Audio**: Sounds synthesized on mount (zero latency)
- **Canvas Rendering**: Hardware-accelerated 2D context
- **Lazy Loading**: Settings drawer loads on demand
- **will-change**: Optimized CSS hints for animations

## 🖥️ Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |

## 🐛 Troubleshooting

### Audio Not Playing

1. Ensure browser allows audio autoplay
2. Click anywhere to unlock audio context
3. Check if mute button is enabled (red icon)

### Build Fails

**Windows**: Install Visual Studio Build Tools + Rust  
**macOS**: Install Xcode Command Line Tools + Rust  
**Linux**: Install WebKit2GTK, GTK3, libappindicator

### Text Hard to Read

1. Use shorter text (under 10 characters)
2. Switch to high-contrast palette
3. Use Fullscreen mode

## 📄 Documentation

- **[USER_GUIDE.md](./USER_GUIDE.md)** - Complete user manual
- **[README.md](./README.md)** - This file (developer documentation)

## 📝 License

MIT License - See [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## 🙏 Acknowledgments

- **Material Design 3** by Google
- **Framer Motion** by Framer
- **Tauri** by Tauri Programme
- **Canvas Confetti** by Kiril Vatev
- **i18next** by i18next contributors

---

**Version:** 1.0.0  
**Last Updated:** 2025  
**Build:** Multi-platform (Windows, macOS, Linux)
