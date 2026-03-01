# 🎡 Ruleta Giratoria

Una aplicación portable de ruleta giratoria para sorteos, construida con **Tauri** + **React** + **TypeScript**.

## ✨ Características

- **Ruleta giratoria animada** - Animación suave y visualmente atractiva
- **Opciones configurables** - Agrega, edita o elimina opciones de la ruleta
- **Sonido sincronizado** - Efectos de sonido que se activan con el giro (activable/desactivable)
- **Modo eliminación** - Las opciones seleccionadas se eliminan automáticamente
- **Fin de juego** - Pantalla especial cuando se agotan las opciones
- **Multiplataforma** - Funciona en Windows, Linux y macOS
- **100% offline** - No requiere conexión a internet
- **Portable** - Sin dependencias externas

## 🚀 Uso

### Desarrollo

```bash
# Instalar dependencias
npm install

# Modo desarrollo (frontend + Tauri)
npm run tauri dev
```

### Compilar

```bash
# Compilar para producción
npm run tauri build
```

Los paquetes se generan en:
- **Linux**: `src-tauri/target/release/bundle/deb/*.deb` y `*.rpm`
- **Windows**: `src-tauri/target/release/bundle/msi/*.msi`
- **macOS**: `src-tauri/target/release/bundle/dmg/*.dmg`

## 🎮 Cómo Jugar

1. **Configurar opciones**: Haz clic en "⚙️ Opciones" para agregar, editar o eliminar elementos de la ruleta
2. **Activar/desactivar sonido**: Usa el botón "🔊" para controlar el sonido
3. **Modo eliminación**: Activa "🗑️ Eliminar" para que las opciones ganadoras se eliminen
4. **¡Girar!**: Presiona el botón para girar la ruleta
5. **Reiniciar**: Cuando se agoten las opciones, usa "🔄 Jugar de Nuevo"

## 📁 Estructura del Proyecto

```
spinning-wheel/
├── src/                    # Código frontend (React)
│   ├── App.tsx            # Componente principal
│   ├── App.css            # Estilos
│   └── main.tsx           # Punto de entrada
├── src-tauri/             # Código backend (Rust/Tauri)
│   ├── src/
│   │   └── lib.rs        # Lógica Rust
│   └── tauri.conf.json   # Configuración Tauri
├── package.json           # Dependencias Node.js
└── README.md             # Este archivo
```

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Tauri 2.x (Rust)
- **Gráficos**: HTML5 Canvas
- **Sonido**: Web Audio API (sin dependencias externas)
- **Estilos**: CSS3 moderno con animaciones

## 📦 Requisitos de Desarrollo

- Node.js 18+
- Rust (última versión estable)
- En Linux: `librsvg2-dev` y dependencias de GTK

## 📝 Licencia

MIT
