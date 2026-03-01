import { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";

interface WheelOption {
  id: string;
  text: string;
  color: string;
  eliminated: boolean;
}

interface AppSettings {
  bgColor: string;
  options: WheelOption[];
}

// Colores VIBRANTES y SATURADOS para la ruleta
const DEFAULT_COLORS = [
  "#FF0055", // Rojo neón
  "#00FF88", // Verde neón
  "#00CCFF", // Azul brillante
  "#FFDD00", // Amarillo intenso
  "#FF00FF", // Magenta
  "#00FFCC", // Cyan
  "#FF6600", // Naranja
  "#9D00FF", // Violeta
];

const DEFAULT_OPTIONS: WheelOption[] = [
  { id: "1", text: "Opción 1", color: DEFAULT_COLORS[0], eliminated: false },
  { id: "2", text: "Opción 2", color: DEFAULT_COLORS[1], eliminated: false },
  { id: "3", text: "Opción 3", color: DEFAULT_COLORS[2], eliminated: false },
  { id: "4", text: "Opción 4", color: DEFAULT_COLORS[3], eliminated: false },
  { id: "5", text: "Opción 5", color: DEFAULT_COLORS[4], eliminated: false },
  { id: "6", text: "Opción 6", color: DEFAULT_COLORS[5], eliminated: false },
];

// Fondo oscuro azulado consistente en todas las pantallas
const DEFAULT_BG_COLOR = "#0A0E1A";

const Confetti = ({
  x,
  y,
  color,
  delay,
  rotation,
  dirX,
  dirY,
}: {
  x: number;
  y: number;
  color: string;
  delay: number;
  rotation: number;
  dirX: number;
  dirY: number;
}) => (
  <div
    className="confetti"
    style={
      {
        left: `${x}%`,
        top: `${y}%`,
        backgroundColor: color,
        animationDelay: `${delay}ms`,
        transform: `rotate(${rotation}deg)`,
        ["--dir-x" as string]: String(dirX),
        ["--dir-y" as string]: String(dirY),
      } as React.CSSProperties
    }
  />
);

function App() {
  const [bgColor, setBgColor] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("wheelSettings");
      if (saved) {
        const parsed: AppSettings = JSON.parse(saved);
        return parsed.bgColor || DEFAULT_BG_COLOR;
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
    return DEFAULT_BG_COLOR;
  });

  const [options, setOptions] = useState<WheelOption[]>(() => {
    try {
      const saved = localStorage.getItem("wheelSettings");
      if (saved) {
        const parsed: AppSettings = JSON.parse(saved);
        if (parsed.options && parsed.options.length > 0) {
          return parsed.options.map((opt: WheelOption) => ({
            ...opt,
            eliminated: false,
          }));
        }
      }
    } catch (e) {
      console.error("Failed to load options:", e);
    }
    return DEFAULT_OPTIONS;
  });

  const [newOptionText, setNewOptionText] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<WheelOption | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [eliminateMode, setEliminateMode] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<{
    type: "bg" | "option";
    id?: string;
  } | null>(null);
  const [confetti, setConfetti] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      color: string;
      delay: number;
      rotation: number;
      dirX: number;
      dirY: number;
    }>
  >([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const spinVelocityRef = useRef(0);
  const lastSegmentIndexRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [wheelSize, setWheelSize] = useState(400);

  const activeOptions = options.filter((opt) => !opt.eliminated);
  const segmentAngle =
    activeOptions.length > 0 ? (2 * Math.PI) / activeOptions.length : 0;

  useEffect(() => {
    try {
      localStorage.setItem(
        "wheelSettings",
        JSON.stringify({ bgColor, options }),
      );
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }, [bgColor, options]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const buttonSpace = 120;
        const padding = 80;
        const maxWidth = containerWidth - padding;
        const maxHeight = containerHeight - buttonSpace - padding;
        const size = Math.min(maxWidth, maxHeight, 700);
        setWheelSize(Math.max(size, 280));
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    const interval = setInterval(updateSize, 500);
    return () => {
      window.removeEventListener("resize", updateSize);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    audioContextRef.current = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playTickSound = useCallback(
    (frequency: number = 800, duration: number = 50) => {
      if (!soundEnabled || !audioContextRef.current) return;
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = "square";
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + duration / 1000,
      );
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    },
    [soundEnabled],
  );

  const playWinnerSound = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = freq;
      oscillator.type = "sine";
      const startTime = now + i * 0.12;
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    });
  }, [soundEnabled]);

  const generateConfetti = useCallback(() => {
    const newConfetti = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 10,
      y: 50 + (Math.random() - 0.5) * 10,
      color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
      delay: Math.random() * 300,
      rotation: Math.random() * 360,
      dirX: Math.random(),
      dirY: Math.random(),
    }));
    setConfetti(newConfetti);
    setTimeout(() => setConfetti([]), 3000);
  }, []);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 8;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (activeOptions.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = "#1C1B1F";
      ctx.fill();
      return;
    }

    const currentRotation = (rotation * Math.PI) / 180;

    activeOptions.forEach((option, index) => {
      const startAngle = currentRotation + index * segmentAngle;
      const endAngle = currentRotation + (index + 1) * segmentAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = option.color;
      ctx.fill();

      // Borde GRIS OSCURO entre segmentos
      ctx.strokeStyle = "#1A1A1F";
      ctx.lineWidth = 4;
      ctx.stroke();

      const midAngle = startAngle + segmentAngle / 2;
      const baseFontSize = Math.max(20, Math.min(40, radius / 5));
      const textLength = option.text.length;
      const lengthFactor =
        textLength <= 6
          ? 1.4
          : textLength <= 10
            ? 1.2
            : textLength <= 14
              ? 1.0
              : 0.85;
      const fontSize = Math.floor(baseFontSize * lengthFactor);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(midAngle);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000000";
      ctx.font = `900 ${fontSize}px 'Roboto', sans-serif`;

      let displayText = option.text;
      if (displayText.length > 14) {
        displayText = displayText.substring(0, 11) + "...";
      }

      const textX = radius * 0.65;
      ctx.fillText(displayText, textX, 0);
      ctx.restore();
    });

    // Centro gris oscuro
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
    ctx.fillStyle = "#1A1A1F";
    ctx.fill();

    // Flecha ROJA INTENSA que RESALTA
    const pointerX = centerX + radius - 12;
    const pointerY = centerY;
    const pointerSize = Math.max(30, Math.min(50, radius / 9));

    ctx.beginPath();
    ctx.moveTo(pointerX - pointerSize + 5, pointerY);
    ctx.lineTo(pointerX + pointerSize * 0.5, pointerY - pointerSize * 0.5);
    ctx.lineTo(pointerX + pointerSize * 0.5, pointerY + pointerSize * 0.5);
    ctx.closePath();
    ctx.fillStyle = "#FF0000";
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = 25;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [activeOptions, rotation, segmentAngle]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel, wheelSize]);

  useEffect(() => {
    if (!isSpinning || activeOptions.length === 0) return;
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const currentSegmentIndex = Math.floor(
      ((2 * Math.PI - (normalizedRotation * Math.PI) / 180) % (2 * Math.PI)) /
        segmentAngle,
    );
    if (
      lastSegmentIndexRef.current !== null &&
      currentSegmentIndex !== lastSegmentIndexRef.current
    ) {
      const velocity = Math.abs(spinVelocityRef.current);
      playTickSound(Math.min(600 + velocity * 3, 1500), 40);
    }
    lastSegmentIndexRef.current = currentSegmentIndex;
  }, [rotation, isSpinning, activeOptions.length, segmentAngle, playTickSound]);

  const spin = useCallback(() => {
    if (isSpinning || activeOptions.length === 0 || showGameOver) return;
    setIsSpinning(true);
    setWinner(null);
    const spinDuration = 4000 + Math.random() * 2000;
    const initialVelocity = 20 + Math.random() * 10;
    const startTime = performance.now();
    const startRotation = rotation;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      spinVelocityRef.current = initialVelocity * (1 - progress);
      const totalRotation =
        startRotation + initialVelocity * progress * 100 * (1 - progress * 0.5);
      setRotation(totalRotation);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        const normalizedRotation = ((totalRotation % 360) + 360) % 360;
        const winningAngle =
          (((2 * Math.PI - (normalizedRotation * Math.PI) / 180) %
            (2 * Math.PI)) +
            2 * Math.PI) %
          (2 * Math.PI);
        const winningIndex =
          Math.floor(winningAngle / segmentAngle) % activeOptions.length;
        const winningOption = activeOptions[winningIndex];

        setWinner(winningOption);
        setIsSpinning(false);
        spinVelocityRef.current = 0;
        playWinnerSound();

        if (eliminateMode && winningOption) {
          setOptions((prev) =>
            prev.map((opt) =>
              opt.id === winningOption.id ? { ...opt, eliminated: true } : opt,
            ),
          );
        }

        setTimeout(() => {
          generateConfetti();
          setShowWinner(true);
          if (eliminateMode && activeOptions.length <= 1) {
            setTimeout(() => setShowGameOver(true), 800);
          }
        }, 400);
      }
    };
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [
    isSpinning,
    activeOptions,
    rotation,
    segmentAngle,
    eliminateMode,
    showGameOver,
    playWinnerSound,
    generateConfetti,
  ]);

  const addOption = () => {
    if (!newOptionText.trim()) return;
    const newOption: WheelOption = {
      id: Date.now().toString(),
      text: newOptionText.trim(),
      color: DEFAULT_COLORS[options.length % DEFAULT_COLORS.length],
      eliminated: false,
    };
    setOptions((prev) => [...prev, newOption]);
    setNewOptionText("");
  };

  const removeOption = (id: string) =>
    setOptions((prev) => prev.filter((opt) => opt.id !== id));
  const updateOptionText = (id: string, text: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, text } : opt)),
    );
  };
  const updateOptionColor = (id: string, color: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, color } : opt)),
    );
  };
  const resetGame = () => {
    setOptions((prev) => prev.map((opt) => ({ ...opt, eliminated: false })));
    setShowGameOver(false);
    setWinner(null);
    setRotation(0);
    setShowWinner(false);
  };
  const resetToDefaults = () => {
    const defaults = DEFAULT_OPTIONS.map((opt, i) => ({
      ...opt,
      id: Date.now().toString() + i,
    }));
    setOptions(defaults);
    setBgColor(DEFAULT_BG_COLOR);
    setShowGameOver(false);
    setWinner(null);
    setRotation(0);
    setShowWinner(false);
  };
  const continueAfterWinner = () => {
    setShowWinner(false);
    setWinner(null);
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addOption();
  };

  return (
    <div className="app" style={{ backgroundColor: bgColor }}>
      <div className="controls">
        <button
          className={`ctrl-btn sound ${soundEnabled ? "active" : ""}`}
          onClick={() => setSoundEnabled(!soundEnabled)}
          title="Sonido"
          aria-label={soundEnabled ? "Desactivar sonido" : "Activar sonido"}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            {soundEnabled ? (
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            ) : (
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            )}
          </svg>
        </button>
        <button
          className={`ctrl-btn eliminate ${eliminateMode ? "active" : ""}`}
          onClick={() => setEliminateMode(!eliminateMode)}
          title="Eliminar opciones"
          aria-label={
            eliminateMode ? "Desactivar modo eliminar" : "Activar modo eliminar"
          }
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            {eliminateMode ? (
              <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zm-7 14c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2s2 .9 2 2v8c0 1.1-.9 2-2 2zm-5 0c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2s2 .9 2 2v8c0 1.1-.9 2-2 2zm10 0c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2s2 .9 2 2v8c0 1.1-.9 2-2 2z" />
            ) : (
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            )}
          </svg>
        </button>
        <button
          className={`ctrl-btn config ${showConfig ? "active" : ""}`}
          onClick={() => setShowConfig(!showConfig)}
          title="Configurar"
          aria-label="Configurar opciones"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>
      </div>

      <main className="main">
        <div className="wheel-section" ref={containerRef}>
          <div className="wheel-container">
            <canvas
              ref={canvasRef}
              width={wheelSize * 2}
              height={wheelSize * 2}
              className={`wheel ${isSpinning ? "spinning" : ""}`}
              style={{ width: wheelSize, height: wheelSize }}
            />

            {!isSpinning && !showGameOver && activeOptions.length > 0 && (
              <button className="spin-button" onClick={spin}>
                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Girar
              </button>
            )}

            {activeOptions.length === 0 && !showGameOver && (
              <div className="empty-msg">No hay más opciones</div>
            )}
          </div>
        </div>

        {showConfig && (
          <aside className="config-panel">
            <div className="config-header">
              <h2>Opciones</h2>
              <button
                className="close-btn"
                onClick={() => setShowConfig(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="currentColor"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <div className="config-section">
              <label className="config-label">Color de fondo</label>
              <div className="color-picker-row">
                <button
                  className="color-preview"
                  style={{ backgroundColor: bgColor }}
                  onClick={() => setShowColorPicker({ type: "bg" })}
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="color-input"
                  placeholder="#121214"
                />
              </div>
            </div>

            <div className="add-opt">
              <input
                type="text"
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nueva opción..."
                maxLength={30}
              />
              <button
                className="add-btn"
                onClick={addOption}
                disabled={!newOptionText.trim()}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="currentColor"
                >
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </button>
            </div>
            <div className="options-list">
              {options.map((option) => (
                <div
                  key={option.id}
                  className={`opt-item ${option.eliminated ? "eliminated" : ""}`}
                >
                  <button
                    className="opt-color"
                    style={{ backgroundColor: option.color }}
                    onClick={() =>
                      setShowColorPicker({ type: "option", id: option.id })
                    }
                    title="Cambiar color"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) =>
                      updateOptionText(option.id, e.target.value)
                    }
                    className="opt-text"
                    maxLength={30}
                  />
                  <button
                    className="remove-btn"
                    onClick={() => removeOption(option.id)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="currentColor"
                    >
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="config-actions">
              <button className="btn secondary" onClick={resetToDefaults}>
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                >
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
                Restaurar
              </button>
              <button className="btn primary" onClick={resetGame}>
                Reiniciar
              </button>
            </div>
          </aside>
        )}
      </main>

      {showColorPicker && (
        <div
          className="color-picker-overlay"
          onClick={() => setShowColorPicker(null)}
        >
          <div
            className="color-picker-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {showColorPicker.type === "bg"
                ? "Color de fondo"
                : "Color de opción"}
            </h3>
            <div className="color-grid">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  className="color-swatch"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    if (showColorPicker.type === "bg") {
                      setBgColor(color);
                    } else if (showColorPicker.id) {
                      updateOptionColor(showColorPicker.id, color);
                    }
                    setShowColorPicker(null);
                  }}
                />
              ))}
            </div>
            <div className="color-picker-custom">
              <label>Personalizado:</label>
              <input
                type="color"
                defaultValue={
                  showColorPicker.type === "bg"
                    ? bgColor
                    : options.find((o) => o.id === showColorPicker.id)?.color ||
                      "#FF0055"
                }
                onChange={(e) => {
                  if (showColorPicker.type === "bg") {
                    setBgColor(e.target.value);
                  } else if (showColorPicker.id) {
                    updateOptionColor(showColorPicker.id, e.target.value);
                  }
                  setShowColorPicker(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showWinner && winner && (
        <div className="winner-reveal">
          {confetti.map((c) => (
            <Confetti
              key={c.id}
              x={c.x}
              y={c.y}
              color={c.color}
              delay={c.delay}
              rotation={c.rotation}
              dirX={c.dirX}
              dirY={c.dirY}
            />
          ))}
          <div className="winner-content">
            <div className="winner-text">{winner.text}</div>
          </div>
          <button className="continue-btn" onClick={continueAfterWinner}>
            Continuar
          </button>
        </div>
      )}

      {showGameOver && (
        <div className="game-over">
          <div className="go-content">
            <div className="go-icon">🏆</div>
            <h2>¡Juego Completado!</h2>
            <p>Se eliminaron todas las opciones</p>
            <div className="go-actions">
              <button className="btn primary lg" onClick={resetGame}>
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="currentColor"
                >
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
                Jugar de Nuevo
              </button>
              <button
                className="btn secondary lg"
                onClick={() => setShowGameOver(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
