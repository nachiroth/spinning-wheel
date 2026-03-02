# User Guide — Spinning Wheel 🎡

## Language

[🇬🇧 English](USER_GUIDE.md) | [🇪🇸 Español](USER_GUIDE.es.md)

## Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Basic Usage](#basic-usage)
4. [Settings](#settings)
5. [Language](#language)
6. [Advanced Features](#advanced-features)
7. [Tips for Presentations](#tips-for-presentations)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### When you first open the app:

- **The Wheel**: Center screen with 6 sample challenges
- **Spin Button**: Left side of the wheel
- **Top Controls**: Five icons in the top-right corner

### Interface Overview

```
┌──────────────────────────────────────────┐
│                    🌐 🔊 🔄 ⛶ ⚙️          │  ← Controls
│                                          │
│              ┌─────────────┐             │
│              │             │   ▲         │  ← Pointer
│   [ Spin! ]  │    WHEEL    │             │
│              │             │             │
│              └─────────────┘             │
│                                          │
└──────────────────────────────────────────┘
```

### Top Controls

| Icon | Name | Function |
|------|------|----------|
| 🌐 | Language | Toggle English/Spanish |
| 🔊/🔇 | Sound | Mute/Unmute audio |
| 🔄 | Turn Mode | Enable/disable turn rotation |
| ⛶ | Fullscreen | Enter/exit fullscreen mode |
| ⚙️ | Settings | Open/close settings panel |

---

## Basic Usage

### Spinning the Wheel

1. **Click "Spin!"** (or press `Enter`)
2. Wheel spins with brief anticipation animation
3. When it stops, selected challenge appears large with confetti 🎊
4. Click **"Continue"** to return to the wheel

### Adding Challenges

1. Click **Settings** (⚙️)
2. Type challenge in "New challenge..." field
3. Click "Add" or press `Enter`
4. Maximum 30 characters per challenge

### Removing Challenges

1. Open Settings
2. Click trash icon next to challenge

### Editing Challenges

1. Open Settings
2. Click directly on challenge text
3. Type new text (saves automatically)

---

## Settings

### Color Palettes

In **Settings → Color Palette**, choose from 5 options:

| Palette | Description | Best For |
|---------|-------------|----------|
| **Vibrant Sunset** | Oranges, reds, yellows | Energy, excitement |
| **Electric Night** | Purples, blues, cyan | Modern events |
| **Tropical Forest** | Greens, teals, lime | Nature themes |
| **Berry Punch** | Pinks, purples, coral | Fun, parties |
| **Fiesta 🎉** | Neon: red, orange, yellow, cyan, green, purple | Maximum energy |

Click any palette to instantly change wheel colors.

### Reset & Restart

| Button | Function |
|--------|----------|
| **Reset** | Restore default 6 challenges |
| **Restart** | Clear turn mode, keep challenges |

---

## Language

### Changing Language

1. Click language icon 🌐 (top-right corner)
2. Interface switches instantly
3. Preference saved automatically

**Available languages**: English / Español

---

## Advanced Features

### Turn Mode 🔄

Allows everyone to participate by eliminating each option after being chosen.

**To enable:**
1. Click 🔄 icon (turns red when active)
2. Spin the wheel
3. Selected challenge appears — click "Continue" to mark as played
4. Continue spinning until no options remain

**When finished:** "All done! 🎉" screen appears with option to play again.

**To disable:** Click the red 🔄 icon again.

> **Note:** In normal mode (without turn mode), "Continue" button also appears after each spin to show the result — it doesn't eliminate the option.

### Fullscreen ⛶

**Enable:** Click ⛶ — app fills entire screen
**Exit:** Click ⛶ again or press `Esc`

### Sound 🔊

- **Tick**: Plays while wheel spins (speeds up at start)
- **Fanfare**: Plays when wheel stops
- **Mute**: Icon turns red when muted

---

## Result Screen

When wheel stops, you'll see:

```
┌──────────────────────────────────┐
│                                  │
│            🎊                    │  ← Animated
│                                  │
│      The challenge is!           │  ← Title
│                                  │
│      CHALLENGE NAME              │  ← Large text
│                                  │
│         [ Continue ]             │  ← Button
│                                  │
└──────────────────────────────────┘
```

With animated confetti across the screen 🎊

---

## Final Screen (Turn Mode)

When everyone has had their turn:

```
┌──────────────────────────────────┐
│                                  │
│              🎉                  │  ← Animated
│                                  │
│        All done! 🎉              │
│                                  │
│   Everyone had their turn!       │
│                                  │
│       [ Play Again ]             │
│                                  │
└──────────────────────────────────┘
```

---

## Tips for Presentations

### Before Starting

1. ✅ **Test audio** in the venue beforehand
2. ✅ **Check visibility** on projector/screen
3. ✅ **Load challenges** before presentation
4. ✅ **Close Settings** for clean interface
5. ✅ **Enable Fullscreen** for maximum impact

### During Presentation

1. **Short text**: 1-3 words, max 18 characters for best readability
2. **4-8 options** for large screens
3. **Dramatic pause**: Let wheel spin fully before revealing
4. **Recommended palettes for projector**: Fiesta 🎉 or Vibrant Sunset (maximum contrast)

### Recommended Number of Options

| Scenario | Options |
|----------|---------|
| Large screen / projector | 4–8 |
| Small groups | up to 15 |
| Turn Mode (everyone participates) | = number of people |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Spin wheel / Add challenge |
| `Esc` | Exit fullscreen / Close settings |
| `F11` | System fullscreen |

---

## Accessibility

- **High contrast**: Activates automatically when system requests
- **Reduced motion**: Animations minimized when system requires
- **Screen readers**: All buttons have aria labels

---

## Troubleshooting

### Sound not working
1. Check sound icon is not red (= muted)
2. Click anywhere in app to initialize audio
3. Check system volume

### Wheel not spinning
1. Ensure at least one challenge exists
2. If result screen is showing, click "Continue" first
3. Click "Restart" in Settings

### Text hard to read
1. Use shorter text (under 18 characters)
2. Switch to **Fiesta** or **Vibrant Sunset** palette
3. Enable Fullscreen

### Changes not saving
App saves automatically to `localStorage`. If changes don't persist:
1. Check browser/system allows local storage
2. Don't use incognito mode

---

**Version:** 1.0.0
**Last Updated:** 2026
**Languages:** English / Español
