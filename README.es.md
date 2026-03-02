# Spinning Wheel 🎡

Una ruleta divertida para prendas, desafíos y juegos grupales. Construida con React 19, TypeScript y Tauri v2. Ideal para proyectar en pantalla grande durante reuniones, fiestas o actividades grupales.

## Idioma

[🇬🇧 English](README.md) | [🇪🇸 Español](README.es.md)

![Material Design 3](https://img.shields.io/badge/Material-Design%203-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![i18n](https://img.shields.io/badge/i18n-English%2FSpanish-green)

## ✨ Características

- 🎨 **5 Paletas de Colores**: Atardecer Vibrante, Noche Eléctrica, Bosque Tropical, Ponche de Bayas, **Fiesta**
- 🎊 **Pantalla de resultado clara**: Al parar la ruleta se muestra el desafío seleccionado en grande
- 🔊 **Efectos de sonido**: Tictac durante el giro, fanfarria al parar (con botón de silencio)
- 🌍 **Bilingüe**: Inglés y Español con cambio instantáneo
- 🔄 **Modo Turno**: Elimina opciones después de cada giro hasta que todos participen
- 🖥️ **Pantalla completa**: Perfecto para proyectores y pantallas grandes
- 📱 **Diseño responsive**: Se adapta a cualquier tamaño de ventana
- ⚡ **GPU Accelerated**: Animaciones fluidas con Framer Motion
- 🔒 **100% Offline**: Fuentes, íconos y sonidos incluidos localmente

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 19, TypeScript, Vite |
| **UI Framework** | Material Design 3 (custom) |
| **Animaciones** | Framer Motion |
| **Desktop** | Tauri v2 (backend Rust) |
| **Audio** | Web Audio API (sintetizado) |
| **Efectos** | Canvas Confetti |
| **i18n** | react-i18next |

## 📦 Instalación

### Prerequisitos

- **Node.js** 18+ y npm
- **Rust** (para builds de Tauri) — Instalar desde [rustup.rs](https://rustup.rs)

### Setup de Desarrollo

```bash
cd spinning-wheel

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run tauri dev
```

## 🔨 Build para Producción

```bash
# Solo frontend
npm run build

# Build completo para la plataforma actual
npm run tauri build
```

Los artefactos quedan en:

```
src-tauri/target/release/bundle/
```

#### Windows 🪟
| Tipo | Ubicación | Formato |
|------|-----------|---------|
| Instalador | `msi/*.msi` | Windows Installer |
| Portable | `binary/*.exe` | EXE sin instalación |

#### macOS 🍎
| Tipo | Ubicación | Formato |
|------|-----------|---------|
| Instalador | `dmg/*.dmg` | Disk Image |
| Portable | `macos/*.app` | App Bundle |

#### Linux 🐧
| Tipo | Ubicación | Formato |
|------|-----------|---------|
| Debian | `deb/*.deb` | Para Debian/Ubuntu |
| AppImage | `appimage/*.AppImage` | Linux universal |
| RPM | `rpm/*.rpm` | Para Fedora/RHEL |

### Dependencias del sistema (Linux/Debian)

```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
npm run tauri build
```

## 📖 Uso

### Operación básica

1. **Girar la ruleta**: Click en el botón "¡Girar!" (o pulsar `Enter`)
2. **Ver resultado**: Al parar, aparece el desafío seleccionado en grande
3. **Continuar**: Click en "Continuar" para volver a la ruleta
4. **Agregar desafíos**: Abrir Configuración (⚙️) → escribir en el campo → Agregar
5. **Cambiar paleta**: En Configuración, seleccionar una de las 5 paletas
6. **Silenciar**: Click en el ícono de volumen (🔊/🔇)
7. **Idioma**: Click en el ícono de idioma para alternar EN/ES
8. **Pantalla completa**: Click en ⛶ para modo presentación

### Modo Turno

Permite que todos participen eliminando opciones después de cada giro:

1. Activar el ícono de turno 🔄 en la barra superior (se pone rojo)
2. Girar — el desafío elegido queda marcado como "jugado"
3. Click "Continuar" para seguir con las opciones restantes
4. Cuando todos participaron, aparece la pantalla final 🎉

## 🎨 Paletas de Colores

| Paleta | Color semilla | Ideal para |
|--------|---------------|------------|
| **Atardecer Vibrante** | `#FF5722` | Energía, dinamismo |
| **Noche Eléctrica** | `#6750A4` | Eventos modernos, tech |
| **Bosque Tropical** | `#00BFA5` | Naturaleza, crecimiento |
| **Ponche de Bayas** | `#984061` | Diversión, eventos festivos |
| **Fiesta** | `#FF1744` | Fiestas, máxima energía 🎉 |

## 🌐 Internacionalización (i18n)

La app soporta **Inglés** (predeterminado) y **Español**.

Las traducciones están en `src/i18n/locales/`:
- `en.json` — Inglés
- `es.json` — Español

## 📁 Estructura del Proyecto

```
spinning-wheel/
├── src/
│   ├── App.tsx                 # Componente principal
│   ├── App.css                 # Estilos Material Design 3
│   ├── main.tsx                # Punto de entrada React
│   ├── i18n.ts                 # Configuración i18next
│   ├── hooks/
│   │   └── useAudio.ts         # Hook de audio (Web Audio API)
│   ├── theme/
│   │   └── m3-theme.ts         # Sistema de colores M3 + paletas
│   └── assets/
│       ├── fonts/              # Fuentes Roboto (offline)
│       └── icons/              # Íconos Material (offline)
├── src-tauri/
│   ├── src/                    # Backend Rust
│   ├── capabilities/           # Permisos Tauri
│   ├── tauri.conf.json         # Configuración Tauri
│   └── Cargo.toml              # Dependencias Rust
├── index.html                  # Template HTML con CSP
├── package.json                # Dependencias Node.js
└── vite.config.ts              # Configuración Vite
```

## 🔒 Seguridad

Content Security Policy estricta (sin llamadas externas):

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; img-src 'self' asset: https://asset.localhost data: blob:; ...">
```

## ⚡ Performance

- **GPU Acceleration**: Animaciones con `transform` y `opacity`
- **Canvas**: Renderizado 2D acelerado por hardware
- **Web Audio API**: Sonidos sintetizados (sin archivos de audio externos)
- **will-change**: Hints CSS para animaciones optimizadas

## ❓ Troubleshooting

### El sonido no funciona
1. Verificar que el botón de silencio no esté activo (rojo = silenciado)
2. Hacer click en cualquier parte para desbloquear el contexto de audio
3. Verificar el volumen del sistema

### La ruleta no gira
1. Asegurarse de que haya al menos una opción
2. Verificar que no se esté mostrando el resultado de un giro anterior
3. Click en "Reiniciar" en Configuración

### Texto ilegible en proyector
1. Usar textos cortos (1-3 palabras, máximo 20 caracteres)
2. Seleccionar la paleta "Fiesta" o "Atardecer Vibrante" (máximo contraste)
3. Activar Pantalla Completa

---

**Versión:** 1.0.0
**Última actualización:** 2026
**Plataformas:** Windows, macOS, Linux
