# Spinning Wheel

Ruleta de escritorio para desafíos grupales y decisiones rápidas al azar.
Construida con React + TypeScript + Tauri v2.

## Idioma

[English](README.md) | [Español](README.es.md)

## Características

- 5 paletas de color integradas
- Lista de desafíos editable (agregar, editar, eliminar)
- Modo turno (elimina opciones elegidas hasta completar todas)
- Efectos de sonido con botón de silencio
- Soporte de pantalla completa
- Cambio de idioma inglés/español
- Atajos de teclado (`Enter`, `Esc`)
- Assets offline e íconos nativos generados

## Stack

- React 19
- TypeScript
- Vite
- Framer Motion
- i18next + react-i18next
- Tauri v2 (Rust)

## Requisitos

- Node.js 18+
- npm
- Toolchain de Rust (para compilar escritorio con Tauri)

## Ejecutar en Desarrollo

```bash
npm install
npm run tauri dev
```

## Build

```bash
# Build web
npm run build

# Bundle de escritorio
npm run tauri build
```

Los binarios de escritorio se generan en `src-tauri/target/release/bundle/`.

## Atajos de Teclado

- `Enter`: girar / continuar resultado / agregar opción (si estás escribiendo)
- `Esc`: cerrar panel de configuración o cerrar overlay de resultado

## Estructura del Proyecto

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

## Notas

- La configuración se guarda en `localStorage`.
- Los íconos nativos se generan desde `public/app-icon.svg` con:

```bash
npm run tauri icon public/app-icon.svg
```
