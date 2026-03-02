import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Window } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";
import { useAudio } from "./hooks/useAudio";
import {
  defaultTheme,
  WHEEL_PALETTES,
  shape,
  elevation,
  typography,
  getContrastingTextColor,
} from "./theme/m3-theme";
import "./App.css";

interface WheelOption {
  id: string;
  text: string;
  eliminated: boolean;
}

interface AppSettings {
  options: WheelOption[];
  paletteIndex: number;
}

const DEFAULT_OPTIONS: WheelOption[] = [
  { id: "1", text: "Imitar animal", eliminated: false },
  { id: "2", text: "Cantar algo", eliminated: false },
  { id: "3", text: "Hacer 10 flexiones", eliminated: false },
  { id: "4", text: "Contar un chiste", eliminated: false },
  { id: "5", text: "Bailar 30 seg", eliminated: false },
  { id: "6", text: "Hablar raro", eliminated: false },
];

function App() {
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
      console.error("Failed to load settings:", e);
    }
    return DEFAULT_OPTIONS;
  });

  const [paletteIndex, setPaletteIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("wheelSettings");
      if (saved) {
        const parsed: AppSettings = JSON.parse(saved);
        return parsed.paletteIndex ?? 0;
      }
    } catch (e) {
      console.error("Failed to load palette:", e);
    }
    return 0;
  });

  const [newOptionText, setNewOptionText] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showRoundComplete, setShowRoundComplete] = useState(false);
  const [turnMode, setTurnMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [showContinue, setShowContinue] = useState(false);
  const [pendingEliminationId, setPendingEliminationId] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string>("");
  const [resultColor, setResultColor] = useState<string>("");

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinVelocityRef = useRef(0);
  const lastSegmentIndexRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const confettiActiveRef = useRef(false);
  // Custom confetti instance with high z-index canvas (above result overlay)
  const myConfetti = useRef<confetti.CreateTypes | null>(null);
  const [wheelSize, setWheelSize] = useState(400);

  const { playTickSound, playVictorySound, isMuted, toggleMute } = useAudio();
  const { t, i18n } = useTranslation();
  const currentPalette = WHEEL_PALETTES[paletteIndex];

  // ── Custom confetti canvas ──────────────────────────────────────────────
  // We create our own canvas at z-index 9999 so confetti always appears
  // on top of the result overlay (z-index 500) and game-over modal (z-index 1000)
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none;";
    document.body.appendChild(canvas);
    myConfetti.current = confetti.create(canvas, {
      resize: true,
      useWorker: false,
    });
    return () => {
      myConfetti.current = null;
      document.body.removeChild(canvas);
    };
  }, []);

  // ── CSS variables for theme sync ────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--md-sys-color-primary", currentPalette.colors[0]);
    root.style.setProperty("--md-sys-color-primary-container", currentPalette.colors[3]);
    root.style.setProperty("--md-sys-color-on-primary", "#FFFFFF");
    root.style.setProperty("--md-sys-color-on-primary-container", "#000000");
    root.style.setProperty("--md-sys-color-tertiary", currentPalette.colors[4]);
    root.style.setProperty("--md-sys-color-tertiary-container", currentPalette.colors[5]);
    root.style.setProperty("--md-sys-color-on-tertiary", "#FFFFFF");
    root.style.setProperty("--md-sys-color-on-tertiary-container", "#000000");
    root.style.setProperty("--md-sys-color-secondary", currentPalette.colors[1]);
    root.style.setProperty("--md-sys-color-secondary-container", currentPalette.colors[2]);
    root.style.setProperty("--md-sys-color-surface", currentPalette.surface);
  }, [currentPalette]);

  const activeOptions = options.filter((opt) => !opt.eliminated);
  const segmentAngle =
    activeOptions.length > 0 ? (2 * Math.PI) / activeOptions.length : 0;

  // ── Persist settings ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem("wheelSettings", JSON.stringify({ options, paletteIndex }));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }, [options, paletteIndex]);

  // ── Responsive wheel sizing (side-panel layout) ─────────────────────────
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        // Reserve space for the two side panels (button + spacer) and gaps
        const panelW = Math.max(80, Math.min(150, cw * 0.10));
        const gap = Math.max(20, Math.min(40, cw * 0.025));
        const paddingH = 32;
        const paddingV = 32;
        const availW = cw - paddingH * 2 - 2 * (panelW + gap);
        const availH = ch - paddingV * 2;
        const size = Math.min(availW, availH, 900);
        setWheelSize(Math.max(size, 240));
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

  // ── Draw wheel ──────────────────────────────────────────────────────────
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const W = canvas.width;
    const H = canvas.height;
    const centerX = W / 2;
    const centerY = H / 2;
    const radius = Math.min(centerX, centerY) - 8;

    ctx.clearRect(0, 0, W, H);

    if (activeOptions.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = currentPalette.surface;
      ctx.fill();
      return;
    }

    const currentRotation = (rotation * Math.PI) / 180;

    activeOptions.forEach((option, index) => {
      const startAngle = currentRotation + index * segmentAngle;
      const endAngle = currentRotation + (index + 1) * segmentAngle;
      const color = currentPalette.colors[index % currentPalette.colors.length];

      // ── Segment fill ──
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // ── Segment border ──
      ctx.strokeStyle = currentPalette.surface;
      ctx.lineWidth = 3;
      ctx.stroke();

      // ── Text — clipped to segment, dynamic sizing, white+shadow ──
      ctx.save();

      // Clip so text can never overflow segment boundaries
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 8, startAngle, endAngle);
      ctx.closePath();
      ctx.clip();

      const midAngle = startAngle + segmentAngle / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(midAngle);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Truncate long text
      let displayText = option.text;
      if (displayText.length > 16) displayText = displayText.substring(0, 13) + "…";

      // Dynamic font size: start large, shrink until text fits
      const availableWidth = radius * 0.50; // usable width per segment
      let fontSize = Math.max(11, Math.min(30, radius / 5.5));
      ctx.font = `800 ${fontSize}px 'Roboto', sans-serif`;
      while (ctx.measureText(displayText).width > availableWidth && fontSize > 9) {
        fontSize -= 1;
        ctx.font = `800 ${fontSize}px 'Roboto', sans-serif`;
      }

      // Always white text with dark shadow → readable on any color
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(displayText, radius * 0.58, 0);

      ctx.restore();
    });

    // ── Decorative center hub ──
    ctx.beginPath();
    ctx.arc(centerX, centerY, 46, 0, 2 * Math.PI);
    ctx.fillStyle = currentPalette.surface;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = currentPalette.colors[0];
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = currentPalette.surface;
    ctx.fill();

    // ── Pointer arrow ──
    const pointerX = centerX + radius - 14;
    const pointerY = centerY;
    const ps = Math.max(30, Math.min(52, radius / 8));

    ctx.beginPath();
    ctx.moveTo(pointerX - ps + 4, pointerY);
    ctx.lineTo(pointerX + ps * 0.5, pointerY - ps * 0.5);
    ctx.lineTo(pointerX + ps * 0.5, pointerY + ps * 0.5);
    ctx.closePath();
    ctx.fillStyle = "#FF1744";
    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [activeOptions, rotation, segmentAngle, currentPalette]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel, wheelSize]);

  // ── Active segment tracker (tick sound) ────────────────────────────────
  useEffect(() => {
    if (!isSpinning || activeOptions.length === 0) {
      setActiveSegmentIndex(null);
      return;
    }
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const currentSegmentIndex = Math.floor(
      ((2 * Math.PI - (normalizedRotation * Math.PI) / 180) % (2 * Math.PI)) /
      segmentAngle,
    );
    setActiveSegmentIndex(currentSegmentIndex);
    if (
      lastSegmentIndexRef.current !== null &&
      currentSegmentIndex !== lastSegmentIndexRef.current
    ) {
      playTickSound();
    }
    lastSegmentIndexRef.current = currentSegmentIndex;
  }, [rotation, isSpinning, activeOptions.length, segmentAngle, playTickSound]);

  // ── Spin animation ──────────────────────────────────────────────────────
  const spin = useCallback(() => {
    if (isSpinning || activeOptions.length === 0 || showRoundComplete) return;
    setIsSpinning(true);

    const spinDuration = 4000 + Math.random() * 2000;
    const initialVelocity = 20 + Math.random() * 10;
    const startRotation = rotation;
    const anticipationRotation = -2;
    const anticipationDuration = 150;
    const anticipationStart = performance.now();

    const animateAnticipation = (currentTime: number) => {
      const elapsed = currentTime - anticipationStart;
      const progress = Math.min(elapsed / anticipationDuration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setRotation(startRotation + anticipationRotation * easeOut * progress);
      if (progress < 1) {
        requestAnimationFrame(animateAnticipation);
      } else {
        const mainStart = performance.now();
        const animateSpin = (currentTime: number) => {
          const elapsed = currentTime - mainStart;
          const progress = Math.min(elapsed / spinDuration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          spinVelocityRef.current = initialVelocity * (1 - progress);
          const totalRotation =
            startRotation + anticipationRotation + initialVelocity * easeOut * 100;
          setRotation(totalRotation);

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animateSpin);
          } else {
            const normalizedRotation = ((totalRotation % 360) + 360) % 360;
            const winningAngle =
              (((2 * Math.PI - (normalizedRotation * Math.PI) / 180) % (2 * Math.PI)) +
                2 * Math.PI) %
              (2 * Math.PI);
            const winningIndex =
              Math.floor(winningAngle / segmentAngle) % activeOptions.length;
            const winningOption = activeOptions[winningIndex];
            const winningColor =
              currentPalette.colors[winningIndex % currentPalette.colors.length];

            setIsSpinning(false);
            spinVelocityRef.current = 0;

            setResultText(winningOption.text);
            setResultColor(winningColor);
            playVictorySound();

            if (turnMode) {
              setPendingEliminationId(winningOption.id);
              setShowContinue(true);
            } else if (activeOptions.length <= 1) {
              setShowRoundComplete(true);
            } else {
              setShowContinue(true);
            }

            // Confetti fires 350ms after result overlay animates in
            confettiActiveRef.current = true;
            setTimeout(() => {
              if (confettiActiveRef.current) triggerConfetti();
            }, 350);
          }
        };
        animationFrameRef.current = requestAnimationFrame(animateSpin);
      }
    };
    requestAnimationFrame(animateAnticipation);
  }, [
    isSpinning,
    activeOptions,
    rotation,
    segmentAngle,
    turnMode,
    showRoundComplete,
    currentPalette,
    playVictorySound,
  ]);

  // ── Confetti (custom canvas, always above overlays) ─────────────────────
  const triggerConfetti = useCallback(() => {
    const mc = myConfetti.current;
    if (!mc) return;
    const duration = 3500;
    const end = Date.now() + duration;

    const frame = () => {
      if (!confettiActiveRef.current || !myConfetti.current) return;
      mc({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: currentPalette.colors });
      mc({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: currentPalette.colors });
      if (Date.now() < end && confettiActiveRef.current) requestAnimationFrame(frame);
    };
    frame();

    setTimeout(() => {
      if (confettiActiveRef.current && myConfetti.current) {
        mc({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: currentPalette.colors,
          scalar: 1.2,
          decay: 0.9,
          gravity: 1,
          drift: 0,
        });
      }
    }, 100);
  }, [currentPalette]);

  const stopConfetti = () => {
    confettiActiveRef.current = false;
    myConfetti.current?.reset();
  };

  // ── Option management ───────────────────────────────────────────────────
  const addOption = () => {
    if (!newOptionText.trim()) return;
    setOptions((prev) => [
      ...prev,
      { id: Date.now().toString(), text: newOptionText.trim(), eliminated: false },
    ]);
    setNewOptionText("");
  };

  const removeOption = (id: string) =>
    setOptions((prev) => prev.filter((opt) => opt.id !== id));

  const updateOptionText = (id: string, text: string) =>
    setOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, text } : opt)));

  const resetGame = () => {
    stopConfetti();
    setOptions((prev) => prev.map((opt) => ({ ...opt, eliminated: false })));
    setShowRoundComplete(false);
    setRotation(0);
    setShowContinue(false);
    setPendingEliminationId(null);
    setResultText("");
  };

  const resetToDefaults = () => {
    stopConfetti();
    setOptions(
      DEFAULT_OPTIONS.map((opt, i) => ({ ...opt, id: Date.now().toString() + i })),
    );
    setShowRoundComplete(false);
    setRotation(0);
    setShowContinue(false);
    setPendingEliminationId(null);
    setResultText("");
  };

  const handleContinue = () => {
    stopConfetti();

    if (turnMode && pendingEliminationId) {
      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === pendingEliminationId ? { ...opt, eliminated: true } : opt,
        ),
      );
      const remainingOptions = activeOptions.filter(
        (opt) => opt.id !== pendingEliminationId,
      );
      // Round ends only when ALL challenges have been played (0 remaining)
      if (remainingOptions.length <= 0) {
        setPendingEliminationId(null);
        setShowContinue(false);
        setResultText("");
        setTimeout(() => setShowRoundComplete(true), 500);
        return;
      }
    }

    setPendingEliminationId(null);
    setShowContinue(false);
    setResultText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addOption();
  };

  const toggleFullscreen = async () => {
    try {
      const currentWindow = Window.getCurrent();
      await currentWindow.setFullscreen(!isFullscreen);
      setIsFullscreen(!isFullscreen);
    } catch (e) {
      console.error("Failed to toggle fullscreen:", e);
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "es" : "en");
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="app" style={{ background: currentPalette.background }}>
      {/* ── Top App Bar ── */}
      <motion.header
        className="top-app-bar"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <div className="top-app-bar__actions">
          <M3IconButton
            icon="language"
            active={false}
            onClick={toggleLanguage}
            title={`${t("language.switch")} (${i18n.language === "en" ? "English" : "Español"})`}
            size="large"
          >
            <span style={{ fontSize: "0.65rem", fontWeight: 700, position: "absolute", bottom: "4px", right: "7px", color: "inherit" }}>
              {i18n.language === "en" ? "EN" : "ES"}
            </span>
          </M3IconButton>
          <M3IconButton
            icon={isMuted ? "volume-off" : "volume-on"}
            active={isMuted}
            onClick={toggleMute}
            title={isMuted ? t("controls.unmute") : t("controls.mute")}
            size="large"
          />
          <M3IconButton
            icon={turnMode ? "eliminate-active" : "eliminate"}
            active={turnMode}
            onClick={() => setTurnMode(!turnMode)}
            title={turnMode ? t("controls.disableTurnMode") : t("controls.enableTurnMode")}
          />
          <M3IconButton
            icon={isFullscreen ? "fullscreen-exit" : "fullscreen"}
            active={isFullscreen}
            onClick={toggleFullscreen}
            title={isFullscreen ? t("controls.exitFullscreen") : t("controls.fullscreen")}
          />
          <M3IconButton
            icon="settings"
            active={showSettings}
            onClick={() => setShowSettings(!showSettings)}
            title={t("controls.settings")}
          />
        </div>
      </motion.header>

      {/* ── Main content ── */}
      <main className="main">
        {/* Wheel section — fills remaining space */}
        <div className="wheel-section" ref={containerRef}>
          {/* Three-column layout: [button] [wheel] [spacer] */}
          <div className="wheel-layout">
            {/* Left panel: spin / empty message */}
            <div className="wheel-panel">
              <AnimatePresence mode="wait">
                {!isSpinning && !showRoundComplete && !showContinue && activeOptions.length > 0 && (
                  <motion.div
                    key="spin"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <MFab onClick={spin} icon="play" size="large">
                      {t("controls.spin")}
                    </MFab>
                  </motion.div>
                )}
                {activeOptions.length === 0 && !showRoundComplete && (
                  <motion.div
                    key="empty"
                    className="empty-message"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {t("settings.noOptions")}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Center: wheel canvas */}
            <motion.div
              className="wheel-wrapper"
              animate={isSpinning ? { scale: [1, 1.015, 1] } : {}}
              transition={{ duration: 0.3 }}
              style={{ willChange: "transform" }}
            >
              <canvas
                ref={canvasRef}
                width={wheelSize * 2}
                height={wheelSize * 2}
                className="wheel"
                style={{
                  width: wheelSize,
                  height: wheelSize,
                  filter:
                    isSpinning && activeSegmentIndex !== null
                      ? `drop-shadow(0 0 22px ${currentPalette.colors[activeSegmentIndex % currentPalette.colors.length]})`
                      : undefined,
                }}
              />
            </motion.div>

            {/* Right spacer — mirrors left panel for visual centering */}
            <div className="wheel-panel" />
          </div>
        </div>

        {/* ── Settings Drawer ── */}
        <AnimatePresence>
          {showSettings && (
            <motion.aside
              className="settings-drawer"
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="drawer-header">
                <h2 style={{ ...typography.titleLarge, color: defaultTheme.onSurface }}>
                  {t("settings.title")}
                </h2>
                <button
                  className="close-button"
                  onClick={() => setShowSettings(false)}
                  aria-label={t("settings.close")}
                >
                  <svg width="24" height="24" fill="currentColor">
                    <use href="#icon-close" />
                  </svg>
                </button>
              </div>

              <div className="drawer-content">
                {/* Palette chips */}
                <div className="palette-section">
                  <h3 style={{ ...typography.titleSmall, color: defaultTheme.onSurfaceVariant, marginBottom: "12px" }}>
                    {t("settings.colorPalette")}
                  </h3>
                  <div className="palette-chips">
                    {WHEEL_PALETTES.map((palette, index) => (
                      <motion.button
                        key={palette.name}
                        className={`palette-chip ${paletteIndex === index ? "selected" : ""}`}
                        onClick={() => setPaletteIndex(index)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          borderColor: paletteIndex === index ? palette.seedColor : "transparent",
                        }}
                      >
                        <div className="chip-colors">
                          {palette.colors.slice(0, 4).map((color, i) => (
                            <div key={i} className="chip-swatch" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                        <span style={{ ...typography.labelSmall, color: defaultTheme.onSurface }}>
                          {t(`palettes.${palette.name.toLowerCase().replace(/\s+/g, "")}` as const)}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Add option */}
                <div className="add-option">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t("settings.newOption")}
                    maxLength={30}
                    className="text-field"
                  />
                  <M3Button variant="filled" onClick={addOption} disabled={!newOptionText.trim()} icon="add">
                    {t("settings.add")}
                  </M3Button>
                </div>

                {/* Options list */}
                <div className="options-list">
                  <AnimatePresence>
                    {options.map((option) => (
                      <motion.div
                        key={option.id}
                        className={`option-item ${option.eliminated ? "eliminated" : ""}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                      >
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOptionText(option.id, e.target.value)}
                          className="option-text"
                          maxLength={30}
                        />
                        <button
                          className="remove-button"
                          onClick={() => removeOption(option.id)}
                          aria-label={`${t("settings.remove")} ${option.text}`}
                        >
                          <svg width="18" height="18" fill="currentColor">
                            <use href="#icon-delete" />
                          </svg>
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="drawer-actions">
                <M3Button variant="tonal" onClick={resetToDefaults} icon="refresh">
                  {t("settings.reset")}
                </M3Button>
                <M3Button variant="filled" onClick={resetGame}>
                  {t("settings.restart")}
                </M3Button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* ── Result Overlay (fixed, always above everything, z-index 500) ── */}
      <AnimatePresence>
        {showContinue && resultText && (
          <motion.div
            className="result-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="result-banner"
              initial={{ scale: 0.75, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.75, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              style={{ borderColor: resultColor }}
            >
              <div className="result-emoji">🎊</div>
              <p className="result-title">{t("victory.title")}</p>
              <p className="result-text" style={{ color: resultColor }}>
                {resultText}
              </p>
              <M3Button
                variant="filled"
                size="large"
                onClick={handleContinue}
                icon="check"
                style={{
                  marginTop: "16px",
                  background: resultColor,
                  color: getContrastingTextColor(resultColor),
                }}
              >
                {t("victory.continue")}
              </M3Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Round Complete Modal ── */}
      <AnimatePresence>
        {showRoundComplete && (
          <motion.div
            className="game-over-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="game-over-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div
                className="trophy-icon"
                animate={{ rotate: [0, -15, 15, -15, 15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
              >
                🎉
              </motion.div>
              <h2 style={{ ...typography.headlineMedium, color: defaultTheme.onSurface, marginBottom: "12px" }}>
                {t("gameOver.title")}
              </h2>
              <p style={{ ...typography.bodyLarge, color: defaultTheme.onSurfaceVariant, marginBottom: "32px" }}>
                {t("gameOver.message")}
              </p>
              <M3Button variant="filled" size="large" onClick={resetGame} icon="refresh" style={{ width: "100%" }}>
                {t("gameOver.playAgain")}
              </M3Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── M3 Button ──────────────────────────────────────────────────────────────
interface M3ButtonProps {
  variant?: "filled" | "tonal" | "outlined";
  size?: "medium" | "large";
  icon?: string;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function M3Button({ variant = "filled", size = "medium", icon, disabled = false, onClick, children, className = "", style = {} }: M3ButtonProps) {
  return (
    <motion.button
      className={`m3-button ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        background:
          variant === "filled" ? "var(--md-sys-color-primary)"
            : variant === "tonal" ? "var(--md-sys-color-primary-container)"
              : "transparent",
        color:
          variant === "filled" ? "var(--md-sys-color-on-primary)"
            : variant === "tonal" ? "var(--md-sys-color-on-primary-container)"
              : "var(--md-sys-color-primary)",
        border: "none",
        borderRadius: shape.cornerFull,
        height: size === "large" ? "56px" : "40px",
        padding: size === "large" ? "0 32px" : "0 24px",
        fontSize: size === "large" ? "1rem" : "0.9375rem",
        fontWeight: 500,
        fontFamily: "'Roboto', sans-serif",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.38 : 1,
        ...style,
      }}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      {icon && <svg width="18" height="18" fill="currentColor"><use href={`#icon-${icon}`} /></svg>}
      {children}
    </motion.button>
  );
}

// ── M3 Icon Button ──────────────────────────────────────────────────────────
interface M3IconButtonProps {
  icon: string;
  active?: boolean;
  onClick?: () => void;
  title: string;
  size?: "medium" | "large";
  children?: React.ReactNode;
}

function M3IconButton({ icon, active = false, onClick, title, size = "medium", children }: M3IconButtonProps) {
  const buttonSize = size === "large" ? 52 : 44;
  return (
    <motion.button
      className="m3-icon-button"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
        borderRadius: shape.cornerFull,
        background: active ? defaultTheme.error : "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? defaultTheme.onError : defaultTheme.onSurfaceVariant,
        position: "relative",
      }}
      whileHover={{ scale: 1.1, background: active ? defaultTheme.error : defaultTheme.surfaceVariant }}
      whileTap={{ scale: 0.95 }}
    >
      <svg width="24" height="24" fill="currentColor"><use href={`#icon-${icon}`} /></svg>
      {children}
    </motion.button>
  );
}

// ── M3 FAB ──────────────────────────────────────────────────────────────────
interface MFabProps {
  icon?: string;
  size?: "medium" | "large";
  onClick?: () => void;
  children?: React.ReactNode;
}

function MFab({ icon = "play", size = "medium", onClick, children }: MFabProps) {
  return (
    <motion.button
      className="m3-fab"
      onClick={onClick}
      style={{
        background: "var(--md-sys-color-primary-container)",
        color: "var(--md-sys-color-on-primary-container)",
        border: "none",
        borderRadius: shape.cornerLarge,
        height: size === "large" ? "56px" : "40px",
        padding: size === "large" ? "0 28px" : "0 16px",
        fontSize: size === "large" ? "1rem" : "0.9375rem",
        fontWeight: 500,
        fontFamily: "'Roboto', sans-serif",
        display: "inline-flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
        boxShadow: elevation[2],
        whiteSpace: "nowrap",
      }}
      whileHover={{ scale: 1.05, boxShadow: elevation[3] }}
      whileTap={{ scale: 0.95 }}
    >
      {icon && (
        <svg width={size === "large" ? 24 : 20} height={size === "large" ? 24 : 20} fill="currentColor">
          <use href={`#icon-${icon}`} />
        </svg>
      )}
      {children && <span>{children}</span>}
    </motion.button>
  );
}

export default App;
