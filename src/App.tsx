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

/**
 * Wheel option interface
 */
interface WheelOption {
  id: string;
  text: string;
  eliminated: boolean;
}

/**
 * Application settings stored in localStorage
 */
interface AppSettings {
  options: WheelOption[];
  paletteIndex: number;
}

/**
 * Default wheel options
 */
const DEFAULT_OPTIONS: WheelOption[] = [
  { id: "1", text: "Option 1", eliminated: false },
  { id: "2", text: "Option 2", eliminated: false },
  { id: "3", text: "Option 3", eliminated: false },
  { id: "4", text: "Option 4", eliminated: false },
  { id: "5", text: "Option 5", eliminated: false },
  { id: "6", text: "Option 6", eliminated: false },
];

/**
 * Main Application Component
 * Material Design 3 Spinning Wheel with Tauri v2
 */
function App() {
  // State management
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
    } catch (error) {
      console.error("Failed to load settings:", error);
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
    } catch (error) {
      console.error("Failed to load palette:", error);
    }
    return 0;
  });

  const [newOptionText, setNewOptionText] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showGameOver, setShowGameOver] = useState(false);
  const [eliminateMode, setEliminateMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(
    null,
  );
  const [showContinue, setShowContinue] = useState(false);
  const [pendingEliminationId, setPendingEliminationId] = useState<
    string | null
  >(null);

  // Refs for performance optimization
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinVelocityRef = useRef(0);
  const lastSegmentIndexRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [wheelSize, setWheelSize] = useState(400);

  // Audio hook - preloaded on mount
  const { playTickSound, playVictorySound, isMuted, toggleMute } = useAudio();

  // i18n hook
  const { t, i18n } = useTranslation();

  // Get current palette
  const currentPalette = WHEEL_PALETTES[paletteIndex];

  // Update CSS variables for theme synchronization
  useEffect(() => {
    const root = document.documentElement;
    const primaryColor = currentPalette.colors[0];
    const primaryContainer = currentPalette.colors[3];

    // Set CSS variables for dynamic theming
    root.style.setProperty("--md-sys-color-primary", primaryColor);
    root.style.setProperty(
      "--md-sys-color-primary-container",
      primaryContainer,
    );
    root.style.setProperty("--md-sys-color-on-primary", "#FFFFFF");
    root.style.setProperty("--md-sys-color-on-primary-container", "#000000");
    root.style.setProperty("--md-sys-color-tertiary", currentPalette.colors[4]);
    root.style.setProperty(
      "--md-sys-color-tertiary-container",
      currentPalette.colors[5],
    );
    root.style.setProperty("--md-sys-color-on-tertiary", "#FFFFFF");
    root.style.setProperty("--md-sys-color-on-tertiary-container", "#000000");
    root.style.setProperty(
      "--md-sys-color-secondary",
      currentPalette.colors[1],
    );
    root.style.setProperty(
      "--md-sys-color-secondary-container",
      currentPalette.colors[2],
    );
  }, [currentPalette]);

  // Computed values
  const activeOptions = options.filter((opt) => !opt.eliminated);
  const segmentAngle =
    activeOptions.length > 0 ? (2 * Math.PI) / activeOptions.length : 0;

  /**
   * Persist settings to localStorage
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        "wheelSettings",
        JSON.stringify({ options, paletteIndex }),
      );
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [options, paletteIndex]);

  /**
   * Responsive wheel sizing
   */
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

  /**
   * Draw the wheel with high-contrast M3 colors
   */
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
      ctx.fillStyle = currentPalette.surface;
      ctx.fill();
      return;
    }

    const currentRotation = (rotation * Math.PI) / 180;

    activeOptions.forEach((option, index) => {
      const startAngle = currentRotation + index * segmentAngle;
      const endAngle = currentRotation + (index + 1) * segmentAngle;
      const color = currentPalette.colors[index % currentPalette.colors.length];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      ctx.strokeStyle = currentPalette.surface;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Text with proper contrast
      const midAngle = startAngle + segmentAngle / 2;
      const baseFontSize = Math.max(24, Math.min(44, radius / 4.5));
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

      const textColor = getContrastingTextColor(color);
      ctx.fillStyle = textColor;
      ctx.font = `900 ${fontSize}px 'Roboto', sans-serif`;

      let displayText = option.text;
      if (displayText.length > 14) {
        displayText = displayText.substring(0, 11) + "...";
      }

      const textX = radius * 0.65;
      ctx.fillText(displayText, textX, 0);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
    ctx.fillStyle = currentPalette.surface;
    ctx.fill();

    // High-contrast pointer
    const pointerX = centerX + radius - 12;
    const pointerY = centerY;
    const pointerSize = Math.max(35, Math.min(55, radius / 8));

    ctx.beginPath();
    ctx.moveTo(pointerX - pointerSize + 5, pointerY);
    ctx.lineTo(pointerX + pointerSize * 0.5, pointerY - pointerSize * 0.5);
    ctx.lineTo(pointerX + pointerSize * 0.5, pointerY + pointerSize * 0.5);
    ctx.closePath();
    ctx.fillStyle = "#FF1744";
    ctx.shadowColor = "#FFFFFF";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [activeOptions, rotation, segmentAngle, currentPalette]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel, wheelSize]);

  /**
   * Track active segment for glow effect
   */
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

  /**
   * Spin animation with anticipation and spring physics
   */
  const spin = useCallback(() => {
    if (isSpinning || activeOptions.length === 0 || showGameOver) return;

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
      const currentRot =
        startRotation + anticipationRotation * easeOut * progress;
      setRotation(currentRot);

      if (progress < 1) {
        requestAnimationFrame(animateAnticipation);
      } else {
        const mainStartTime = performance.now();

        const animateSpin = (currentTime: number) => {
          const elapsed = currentTime - mainStartTime;
          const progress = Math.min(elapsed / spinDuration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          spinVelocityRef.current = initialVelocity * (1 - progress);

          const totalRotation =
            startRotation +
            anticipationRotation +
            initialVelocity * easeOut * 100;
          setRotation(totalRotation);

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animateSpin);
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

            setIsSpinning(false);
            spinVelocityRef.current = 0;

            // Play victory sound and show confetti
            playVictorySound();
            triggerConfetti();

            // In elimination mode, show continue button
            if (eliminateMode) {
              setPendingEliminationId(winningOption.id);
              setShowContinue(true);
            } else if (activeOptions.length <= 1) {
              setShowGameOver(true);
            }
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
    eliminateMode,
    showGameOver,
    playTickSound,
    playVictorySound,
  ]);

  /**
   * Trigger confetti explosion
   */
  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: currentPalette.colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: currentPalette.colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: currentPalette.colors,
        scalar: 1.2,
        decay: 0.9,
        gravity: 1,
        drift: 0,
      });
    }, 100);
  }, [currentPalette]);

  // Option management
  const addOption = () => {
    if (!newOptionText.trim()) return;
    const newOption: WheelOption = {
      id: Date.now().toString(),
      text: newOptionText.trim(),
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

  const resetGame = () => {
    setOptions((prev) => prev.map((opt) => ({ ...opt, eliminated: false })));
    setShowGameOver(false);
    setRotation(0);
    setShowContinue(false);
    setPendingEliminationId(null);
  };

  const resetToDefaults = () => {
    const defaults = DEFAULT_OPTIONS.map((opt, i) => ({
      ...opt,
      id: Date.now().toString() + i,
    }));
    setOptions(defaults);
    setShowGameOver(false);
    setRotation(0);
    setShowContinue(false);
    setPendingEliminationId(null);
  };

  const handleContinue = () => {
    // Eliminate the pending option
    if (pendingEliminationId) {
      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === pendingEliminationId ? { ...opt, eliminated: true } : opt,
        ),
      );
      setPendingEliminationId(null);
    }
    setShowContinue(false);

    // Check if game is over
    const remainingOptions = activeOptions.filter(
      (opt) => opt.id !== pendingEliminationId,
    );
    if (eliminateMode && remainingOptions.length <= 1) {
      setTimeout(() => setShowGameOver(true), 500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addOption();
  };

  const toggleFullscreen = async () => {
    try {
      const currentWindow = Window.getCurrent();
      await currentWindow.setFullscreen(!isFullscreen);
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error("Failed to toggle fullscreen:", error);
    }
  };

  const selectPalette = (index: number) => {
    setPaletteIndex(index);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "es" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="app" style={{ background: currentPalette.background }}>
      {/* Top App Bar */}
      <motion.header
        className="top-app-bar"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <div className="top-app-bar__actions">
          {/* Language Selector - Shows current language */}
          <M3IconButton
            icon="language"
            active={false}
            onClick={toggleLanguage}
            title={`${t("language.switch")} (${i18n.language === "en" ? "English" : "Español"})`}
            size="large"
          >
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                position: "absolute",
                bottom: "4px",
                right: "8px",
                color: "inherit",
              }}
            >
              {i18n.language === "en" ? "EN" : "ES"}
            </span>
          </M3IconButton>
          {/* Sound Toggle - Large 48px button */}
          <M3IconButton
            icon={isMuted ? "volume-off" : "volume-on"}
            active={isMuted}
            onClick={toggleMute}
            title={isMuted ? t("controls.unmute") : t("controls.mute")}
            size="large"
          />
          <M3IconButton
            icon={eliminateMode ? "eliminate-active" : "eliminate"}
            active={eliminateMode}
            onClick={() => setEliminateMode(!eliminateMode)}
            title={
              eliminateMode
                ? t("controls.disableEliminate")
                : t("controls.enableEliminate")
            }
          />
          <M3IconButton
            icon={isFullscreen ? "fullscreen-exit" : "fullscreen"}
            active={isFullscreen}
            onClick={toggleFullscreen}
            title={
              isFullscreen
                ? t("controls.exitFullscreen")
                : t("controls.fullscreen")
            }
          />
          <M3IconButton
            icon="settings"
            active={showSettings}
            onClick={() => setShowSettings(!showSettings)}
            title={t("controls.settings")}
          />
        </div>
      </motion.header>

      {/* Main content */}
      <main className="main">
        <div className="wheel-section" ref={containerRef}>
          <div className="wheel-container">
            <motion.div
              className="wheel-wrapper"
              animate={isSpinning ? { scale: [1, 1.02, 1] } : {}}
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
                      ? `drop-shadow(0 0 20px ${currentPalette.colors[activeSegmentIndex % currentPalette.colors.length]})`
                      : undefined,
                }}
              />
            </motion.div>

            <AnimatePresence>
              {!isSpinning &&
                !showGameOver &&
                !showContinue &&
                activeOptions.length > 0 && (
                  <motion.div
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
            </AnimatePresence>

            {activeOptions.length === 0 && !showGameOver && (
              <motion.div
                className="empty-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {t("settings.noOptions")}
              </motion.div>
            )}

            {/* Continue Button - Shows after spin in elimination mode (aligned with Spin button) */}
            <AnimatePresence>
              {showContinue && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <M3Button
                    variant="filled"
                    size="large"
                    onClick={handleContinue}
                    icon="check"
                    style={{
                      background: "var(--md-sys-color-primary)",
                      color: "var(--md-sys-color-on-primary)",
                      minWidth: "200px",
                    }}
                  >
                    {t("victory.continue")}
                  </M3Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Settings Drawer - Scrollable */}
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
                <h2
                  style={{
                    ...typography.titleLarge,
                    color: defaultTheme.onSurface,
                  }}
                >
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

              {/* Scrollable content */}
              <div className="drawer-content">
                {/* Compact Palette Chips */}
                <div className="palette-section">
                  <h3
                    style={{
                      ...typography.titleSmall,
                      color: defaultTheme.onSurfaceVariant,
                      marginBottom: "12px",
                    }}
                  >
                    {t("settings.colorPalette")}
                  </h3>
                  <div className="palette-chips">
                    {WHEEL_PALETTES.map((palette, index) => (
                      <motion.button
                        key={palette.name}
                        className={`palette-chip ${paletteIndex === index ? "selected" : ""}`}
                        onClick={() => selectPalette(index)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          borderColor:
                            paletteIndex === index
                              ? palette.seedColor
                              : "transparent",
                        }}
                      >
                        <div className="chip-colors">
                          {palette.colors.slice(0, 3).map((color, i) => (
                            <div
                              key={i}
                              className="chip-swatch"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span
                          style={{
                            ...typography.labelSmall,
                            color: defaultTheme.onSurface,
                          }}
                        >
                          {t(
                            `palettes.${palette.name.toLowerCase().replace(/\s+/g, "")}` as const,
                          )}
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
                  <M3Button
                    variant="filled"
                    onClick={addOption}
                    disabled={!newOptionText.trim()}
                    icon="add"
                  >
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
                          onChange={(e) =>
                            updateOptionText(option.id, e.target.value)
                          }
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

              {/* Actions - Fixed at bottom */}
              <div className="drawer-actions">
                <M3Button
                  variant="tonal"
                  onClick={resetToDefaults}
                  icon="refresh"
                >
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

      {/* Game Over Modal */}
      <AnimatePresence>
        {showGameOver && (
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
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🏆
              </motion.div>

              <h2
                style={{
                  ...typography.headlineMedium,
                  color: defaultTheme.onSurface,
                  marginBottom: "12px",
                }}
              >
                {t("gameOver.title")}
              </h2>

              <p
                style={{
                  ...typography.bodyLarge,
                  color: defaultTheme.onSurfaceVariant,
                  marginBottom: "32px",
                }}
              >
                {t("gameOver.message")}
              </p>

              <M3Button
                variant="filled"
                size="large"
                onClick={resetGame}
                icon="refresh"
                style={{ width: "100%" }}
              >
                {t("gameOver.playAgain")}
              </M3Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * M3 Button Component
 */
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

function M3Button({
  variant = "filled",
  size = "medium",
  icon,
  disabled = false,
  onClick,
  children,
  className = "",
  style = {},
}: M3ButtonProps) {
  return (
    <motion.button
      className={`m3-button ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        /* Use CSS variables for dynamic theme sync */
        background:
          variant === "filled"
            ? "var(--md-sys-color-primary)"
            : variant === "tonal"
              ? "var(--md-sys-color-primary-container)"
              : "transparent",
        color:
          variant === "filled"
            ? "var(--md-sys-color-on-primary)"
            : variant === "tonal"
              ? "var(--md-sys-color-on-primary-container)"
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
      {icon && (
        <svg width="18" height="18" fill="currentColor">
          <use href={`#icon-${icon}`} />
        </svg>
      )}
      {children}
    </motion.button>
  );
}

/**
 * M3 Icon Button Component
 */
interface M3IconButtonProps {
  icon: string;
  active?: boolean;
  onClick?: () => void;
  title: string;
  size?: "medium" | "large";
  children?: React.ReactNode;
}

function M3IconButton({
  icon,
  active = false,
  onClick,
  title,
  size = "medium",
  children,
}: M3IconButtonProps) {
  const buttonSize = size === "large" ? 56 : 48;

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
      whileHover={{
        scale: 1.1,
        background: active ? defaultTheme.error : defaultTheme.surfaceVariant,
      }}
      whileTap={{ scale: 0.95 }}
    >
      <svg width="24" height="24" fill="currentColor">
        <use href={`#icon-${icon}`} />
      </svg>
      {children}
    </motion.button>
  );
}

/**
 * M3 FAB Component
 */
interface MFabProps {
  icon?: string;
  size?: "medium" | "large";
  onClick?: () => void;
  children?: React.ReactNode;
}

function MFab({
  icon = "play",
  size = "medium",
  onClick,
  children,
}: MFabProps) {
  return (
    <motion.button
      className="m3-fab"
      onClick={onClick}
      style={{
        /* Use CSS variables for dynamic theme sync */
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
      }}
      whileHover={{ scale: 1.05, boxShadow: elevation[3] }}
      whileTap={{ scale: 0.95 }}
    >
      {icon && (
        <svg
          width={size === "large" ? 24 : 20}
          height={size === "large" ? 24 : 20}
          fill="currentColor"
        >
          <use href={`#icon-${icon}`} />
        </svg>
      )}
      {children && <span>{children}</span>}
    </motion.button>
  );
}

export default App;
