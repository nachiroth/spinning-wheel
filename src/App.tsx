import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { Window } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";
import { useAudio } from "./hooks/useAudio";
import {
  defaultTheme,
  WHEEL_PALETTES,
  shape,
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

const DEFAULT_OPTION_TEXTS = {
  en: [
    "Imitate an animal",
    "Sing something",
    "Do 10 push-ups",
    "Tell a joke",
    "Dance 30 sec",
    "Talk funny",
  ],
  es: [
    "Imitar un animal",
    "Cantar algo",
    "Hacer 10 flexiones",
    "Contar un chiste",
    "Bailar 30 seg",
    "Hablar raro",
  ],
} as const;

const SETTINGS_KEY = "wheelSettings";

function getDefaultOptions(language: string): WheelOption[] {
  const baseLanguage = language.toLowerCase().startsWith("es") ? "es" : "en";
  return DEFAULT_OPTION_TEXTS[baseLanguage].map((text, index) => ({
    id: String(index + 1),
    text,
    eliminated: false,
  }));
}

function sanitizeOptions(input: unknown): WheelOption[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((opt): opt is Partial<WheelOption> =>
      Boolean(opt && typeof opt === "object"),
    )
    .map((opt, index) => {
      const text = typeof opt.text === "string" ? opt.text.trim() : "";
      const id =
        typeof opt.id === "string" && opt.id ? opt.id : `restored-${index}`;
      return {
        id,
        text,
        eliminated: false,
      };
    })
    .filter((opt) => opt.text.length > 0);
}

function isInteractiveElement(target: HTMLElement | null): boolean {
  if (!target) return false;

  const tagName = target.tagName;
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "BUTTON" ||
    tagName === "A" ||
    tagName === "SELECT" ||
    target.isContentEditable
  );
}

function loadSettings(language: string): AppSettings {
  const localizedDefaults = getDefaultOptions(language);

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) {
      return {
        options: localizedDefaults,
        paletteIndex: 0,
      };
    }

    const parsed = JSON.parse(saved) as Partial<AppSettings>;
    const options = sanitizeOptions(parsed.options);
    const paletteIndex =
      typeof parsed.paletteIndex === "number" &&
      parsed.paletteIndex >= 0 &&
      parsed.paletteIndex < WHEEL_PALETTES.length
        ? parsed.paletteIndex
        : 0;

    return {
      options: options.length > 0 ? options : localizedDefaults,
      paletteIndex,
    };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return {
      options: localizedDefaults,
      paletteIndex: 0,
    };
  }
}

function App() {
  const { t, i18n } = useTranslation();
  const initialSettingsRef = useRef<AppSettings | null>(null);
  if (!initialSettingsRef.current) {
    initialSettingsRef.current = loadSettings(
      i18n.resolvedLanguage ?? i18n.language,
    );
  }

  const [options, setOptions] = useState<WheelOption[]>(
    () => initialSettingsRef.current!.options,
  );
  const [paletteIndex, setPaletteIndex] = useState<number>(
    () => initialSettingsRef.current!.paletteIndex,
  );
  const [newOptionText, setNewOptionText] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showRoundComplete, setShowRoundComplete] = useState(false);
  const [turnMode, setTurnMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(
    null,
  );
  const [showContinue, setShowContinue] = useState(false);
  const [pendingEliminationId, setPendingEliminationId] = useState<
    string | null
  >(null);
  const [resultText, setResultText] = useState("");
  const [resultColor, setResultColor] = useState("");
  const [wheelSize, setWheelSize] = useState(400);
  const [spinCharge, setSpinCharge] = useState(0);
  const [isChargingSpin, setIsChargingSpin] = useState(false);
  const [touchTooltipPaletteIndex, setTouchTooltipPaletteIndex] = useState<
    number | null
  >(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastSegmentIndexRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const confettiActiveRef = useRef(false);
  const myConfetti = useRef<confetti.CreateTypes | null>(null);
  const spinChargeFrameRef = useRef<number | null>(null);
  const spinChargeStartRef = useRef<number | null>(null);
  const enterChargingRef = useRef(false);
  const paletteTooltipTimerRef = useRef<number | null>(null);

  const { playTickSound, playVictorySound, isMuted, toggleMute } = useAudio();
  const currentPalette = WHEEL_PALETTES[paletteIndex];
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(prefersReducedMotion);

  const activeOptions = options.filter((opt) => !opt.eliminated);
  const segmentAngle =
    activeOptions.length > 0 ? (2 * Math.PI) / activeOptions.length : 0;
  const modeLabel = turnMode
    ? t("status.turnModeEnabled")
    : t("status.turnModeDisabled");
  const getPaletteLabel = (palette: (typeof WHEEL_PALETTES)[number]) =>
    t(`palettes.${palette.i18nKey}`, { defaultValue: palette.name });
  const currentPaletteLabel = getPaletteLabel(currentPalette);
  const fadeTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };
  const springTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 300, damping: 24, mass: 0.78 };
  const drawerTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 320, damping: 33, mass: 0.82 };

  const stopConfetti = useCallback(() => {
    confettiActiveRef.current = false;
    myConfetti.current?.reset();
  }, []);

  const triggerConfetti = useCallback(() => {
    const confettiInstance = myConfetti.current;
    if (!confettiInstance) return;

    const duration = shouldReduceMotion ? 1200 : 3000;
    const end = Date.now() + duration;

    const frame = () => {
      if (!confettiActiveRef.current || !myConfetti.current) return;

      confettiInstance({
        particleCount: shouldReduceMotion ? 3 : 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: currentPalette.colors,
      });
      confettiInstance({
        particleCount: shouldReduceMotion ? 3 : 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: currentPalette.colors,
      });

      if (Date.now() < end && confettiActiveRef.current) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    setTimeout(() => {
      if (!confettiActiveRef.current || !myConfetti.current) return;
      confettiInstance({
        particleCount: shouldReduceMotion ? 60 : 120,
        spread: 95,
        origin: { y: 0.6 },
        colors: currentPalette.colors,
        scalar: 1.15,
      });
    }, 120);
  }, [currentPalette.colors, shouldReduceMotion]);

  const resetOutcomeState = useCallback(() => {
    stopConfetti();
    setShowRoundComplete(false);
    setShowContinue(false);
    setPendingEliminationId(null);
    setResultText("");
    setResultColor("");
  }, [stopConfetti]);

  const resetGame = useCallback(() => {
    setOptions((prev) => prev.map((opt) => ({ ...opt, eliminated: false })));
    setRotation(0);
    resetOutcomeState();
  }, [resetOutcomeState]);

  const handleContinue = useCallback(() => {
    stopConfetti();

    if (turnMode && pendingEliminationId) {
      const remainingCount = activeOptions.filter(
        (option) => option.id !== pendingEliminationId,
      ).length;

      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === pendingEliminationId ? { ...opt, eliminated: true } : opt,
        ),
      );

      if (remainingCount <= 0) {
        setPendingEliminationId(null);
        setShowContinue(false);
        setResultText("");
        setTimeout(() => setShowRoundComplete(true), 350);
        return;
      }
    }

    setPendingEliminationId(null);
    setShowContinue(false);
    setResultText("");
  }, [activeOptions, pendingEliminationId, stopConfetti, turnMode]);

  const spin = useCallback(
    (power?: number) => {
      if (
        isSpinning ||
        showRoundComplete ||
        showContinue ||
        activeOptions.length === 0
      ) {
        return;
      }

      setIsSpinning(true);

      const normalizedPower =
        typeof power === "number"
          ? Math.max(0.02, Math.min(1, power))
          : 0.2 + Math.random() * 0.8;
      const randomFactor = 0.92 + Math.random() * 0.16;
      const spinDuration = shouldReduceMotion
        ? (380 + normalizedPower * 900) * randomFactor
        : (700 + normalizedPower * 4200) * randomFactor;
      const targetTurns = shouldReduceMotion
        ? 1 + normalizedPower * 4 + Math.random() * 0.8
        : 2 + normalizedPower * 14 + Math.random() * 1.4;
      const startRotation = rotation;
      const anticipationRotation = shouldReduceMotion ? -1 : -2;
      const anticipationDuration = shouldReduceMotion ? 70 : 150;
      const anticipationStart = performance.now();

      const animateAnticipation = (currentTime: number) => {
        const elapsed = currentTime - anticipationStart;
        const progress = Math.min(elapsed / anticipationDuration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        setRotation(startRotation + anticipationRotation * easeOut * progress);

        if (progress < 1) {
          animationFrameRef.current =
            requestAnimationFrame(animateAnticipation);
          return;
        }

        const mainStart = performance.now();

        const animateSpin = (time: number) => {
          const elapsedMain = time - mainStart;
          const progressMain = Math.min(elapsedMain / spinDuration, 1);
          const easeOutMain = 1 - Math.pow(1 - progressMain, 3);

          const totalRotation =
            startRotation +
            anticipationRotation +
            targetTurns * 360 * easeOutMain;

          setRotation(totalRotation);

          if (progressMain < 1) {
            animationFrameRef.current = requestAnimationFrame(animateSpin);
            return;
          }

          const normalizedRotation = ((totalRotation % 360) + 360) % 360;
          const winningAngle =
            (((2 * Math.PI - (normalizedRotation * Math.PI) / 180) %
              (2 * Math.PI)) +
              2 * Math.PI) %
            (2 * Math.PI);
          const winningIndex =
            Math.floor(winningAngle / segmentAngle) % activeOptions.length;
          const winningOption = activeOptions[winningIndex];
          const winningColor =
            currentPalette.colors[winningIndex % currentPalette.colors.length];

          setIsSpinning(false);
          setResultText(winningOption.text);
          setResultColor(winningColor);
          playVictorySound();

          if (turnMode) {
            setPendingEliminationId(winningOption.id);
          }

          if (!turnMode && activeOptions.length <= 1) {
            setShowRoundComplete(true);
          } else {
            setShowContinue(true);
          }

          confettiActiveRef.current = true;
          setTimeout(() => {
            if (confettiActiveRef.current) {
              triggerConfetti();
            }
          }, 260);
        };

        animationFrameRef.current = requestAnimationFrame(animateSpin);
      };

      animationFrameRef.current = requestAnimationFrame(animateAnticipation);
    },
    [
      activeOptions,
      currentPalette.colors,
      isSpinning,
      playVictorySound,
      rotation,
      segmentAngle,
      showContinue,
      showRoundComplete,
      triggerConfetti,
      turnMode,
      shouldReduceMotion,
    ],
  );

  const addOption = useCallback(() => {
    const text = newOptionText.trim();
    if (!text) return;

    setOptions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text,
        eliminated: false,
      },
    ]);
    setNewOptionText("");
  }, [newOptionText]);

  const removeOption = useCallback((id: string) => {
    setOptions((prev) => prev.filter((opt) => opt.id !== id));
  }, []);

  const updateOptionText = useCallback((id: string, text: string) => {
    setOptions((prev) =>
      prev.map((opt) => {
        if (opt.id !== id) return opt;

        const trimmed = text.trim();
        return {
          ...opt,
          text: trimmed.length > 0 ? text : opt.text,
        };
      }),
    );
  }, []);

  const resetToDefaults = useCallback(() => {
    const uniqueSeed = Date.now().toString();
    const defaultOptions = getDefaultOptions(
      i18n.resolvedLanguage ?? i18n.language,
    );

    setOptions(
      defaultOptions.map((option, index) => ({
        ...option,
        id: `${uniqueSeed}-${index}`,
      })),
    );
    setRotation(0);
    resetOutcomeState();
  }, [i18n.language, i18n.resolvedLanguage, resetOutcomeState]);

  const toggleFullscreen = useCallback(async () => {
    try {
      const currentWindow = Window.getCurrent();
      const fullscreenNow = await currentWindow.isFullscreen();
      await currentWindow.setFullscreen(!fullscreenNow);
      setIsFullscreen(!fullscreenNow);
    } catch (error) {
      console.error("Failed to toggle fullscreen:", error);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    i18n.changeLanguage(i18n.language === "en" ? "es" : "en");
  }, [i18n]);

  const stopChargingAnimation = useCallback(() => {
    if (spinChargeFrameRef.current !== null) {
      cancelAnimationFrame(spinChargeFrameRef.current);
      spinChargeFrameRef.current = null;
    }
    spinChargeStartRef.current = null;
  }, []);

  const clearPaletteTooltipTimer = useCallback(() => {
    if (paletteTooltipTimerRef.current !== null) {
      window.clearTimeout(paletteTooltipTimerRef.current);
      paletteTooltipTimerRef.current = null;
    }
  }, []);

  const hideTouchPaletteTooltip = useCallback(() => {
    clearPaletteTooltipTimer();
    setTouchTooltipPaletteIndex(null);
  }, [clearPaletteTooltipTimer]);

  const startSpinCharge = useCallback(() => {
    if (
      isSpinning ||
      showRoundComplete ||
      showContinue ||
      activeOptions.length === 0
    ) {
      return;
    }

    stopChargingAnimation();
    setIsChargingSpin(true);
    setSpinCharge(0);
    spinChargeStartRef.current = performance.now();

    const CHARGE_TIME_MS = shouldReduceMotion ? 700 : 1600;
    const tick = (now: number) => {
      if (spinChargeStartRef.current === null) return;
      const elapsed = now - spinChargeStartRef.current;
      const nextCharge = Math.min(elapsed / CHARGE_TIME_MS, 1);
      setSpinCharge(nextCharge);

      if (nextCharge < 1) {
        spinChargeFrameRef.current = requestAnimationFrame(tick);
      }
    };

    spinChargeFrameRef.current = requestAnimationFrame(tick);
  }, [
    activeOptions.length,
    isSpinning,
    shouldReduceMotion,
    showContinue,
    showRoundComplete,
    stopChargingAnimation,
  ]);

  const releaseSpinCharge = useCallback(() => {
    if (!isChargingSpin) return;

    const holdStartedAt = spinChargeStartRef.current;
    const holdDuration =
      holdStartedAt !== null ? performance.now() - holdStartedAt : 0;

    stopChargingAnimation();
    setIsChargingSpin(false);

    const isQuickTap = holdDuration < 70 && spinCharge < 0.02;
    const appliedPower = Math.max(spinCharge, 0.02);
    setSpinCharge(0);
    if (isQuickTap) {
      spin();
      return;
    }
    spin(appliedPower);
  }, [isChargingSpin, spin, spinCharge, stopChargingAnimation]);

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
      stopConfetti();
      myConfetti.current = null;
      document.body.removeChild(canvas);
    };
  }, [stopConfetti]);

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty("--md-sys-color-primary", currentPalette.colors[0]);
    root.style.setProperty(
      "--md-sys-color-primary-container",
      currentPalette.colors[3],
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
    root.style.setProperty("--md-sys-color-surface", currentPalette.surface);
  }, [currentPalette]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          options,
          paletteIndex,
        }),
      );
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [options, paletteIndex]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const panelWidth = Math.max(80, Math.min(150, width * 0.1));
      const gap = Math.max(20, Math.min(40, width * 0.025));
      const horizontalPadding = 32;
      const verticalPadding = 32;

      const availableWidth =
        width - horizontalPadding * 2 - 2 * (panelWidth + gap);
      const availableHeight = height - verticalPadding * 2;
      const size = Math.min(availableWidth, availableHeight, 900);

      setWheelSize(Math.max(size, 240));
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener("resize", updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    const cssSize = wheelSize;
    const scaledSize = Math.floor(cssSize * dpr);

    if (canvas.width !== scaledSize || canvas.height !== scaledSize) {
      canvas.width = scaledSize;
      canvas.height = scaledSize;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, cssSize, cssSize);

    const centerX = cssSize / 2;
    const centerY = cssSize / 2;
    const radius = Math.min(centerX, centerY) - 8;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    if (activeOptions.length === 0) {
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      context.fillStyle = currentPalette.surface;
      context.fill();
      return;
    }

    const currentRotation = (rotation * Math.PI) / 180;

    activeOptions.forEach((option, index) => {
      const startAngle = currentRotation + index * segmentAngle;
      const endAngle = currentRotation + (index + 1) * segmentAngle;
      const color = currentPalette.colors[index % currentPalette.colors.length];

      context.beginPath();
      context.moveTo(centerX, centerY);
      context.arc(centerX, centerY, radius, startAngle, endAngle);
      context.closePath();
      context.fillStyle = color;
      context.fill();

      context.strokeStyle = currentPalette.surface;
      context.lineWidth = 3;
      context.stroke();

      context.save();
      context.beginPath();
      context.moveTo(centerX, centerY);
      context.arc(centerX, centerY, radius - 8, startAngle, endAngle);
      context.closePath();
      context.clip();

      const midAngle = startAngle + segmentAngle / 2;
      context.translate(centerX, centerY);
      context.rotate(midAngle);
      context.textAlign = "center";
      context.textBaseline = "middle";

      let displayText = option.text;
      if (displayText.length > 16) {
        displayText = `${displayText.slice(0, 13)}…`;
      }

      const availableWidth = radius * 0.6;
      let fontSize = Math.max(14, Math.min(42, radius / 4));
      context.font = `900 ${fontSize}px 'Roboto', sans-serif`;

      while (
        context.measureText(displayText).width > availableWidth &&
        fontSize > 12
      ) {
        fontSize -= 1;
        context.font = `900 ${fontSize}px 'Roboto', sans-serif`;
      }

      context.shadowColor = "rgba(0, 0, 0, 0.85)";
      context.shadowBlur = 6;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      context.fillStyle = "#FFFFFF";
      context.fillText(displayText, radius * 0.6, 0);
      context.restore();
    });

    context.beginPath();
    context.arc(centerX, centerY, 46, 0, 2 * Math.PI);
    context.fillStyle = currentPalette.surface;
    context.fill();

    context.beginPath();
    context.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    context.fillStyle = currentPalette.colors[0];
    context.fill();

    context.beginPath();
    context.arc(centerX, centerY, 18, 0, 2 * Math.PI);
    context.fillStyle = currentPalette.surface;
    context.fill();

    const pointerX = centerX + radius - 14;
    const pointerY = centerY;
    const pointerSize = Math.max(30, Math.min(52, radius / 8));

    context.beginPath();
    context.moveTo(pointerX - pointerSize + 4, pointerY);
    context.lineTo(pointerX + pointerSize * 0.5, pointerY - pointerSize * 0.5);
    context.lineTo(pointerX + pointerSize * 0.5, pointerY + pointerSize * 0.5);
    context.closePath();
    context.fillStyle = "#FF1744";
    context.shadowColor = "rgba(255, 255, 255, 0.9)";
    context.shadowBlur = 14;
    context.fill();
    context.shadowBlur = 0;
  }, [activeOptions, currentPalette, rotation, segmentAngle, wheelSize]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  useEffect(() => {
    if (!isSpinning || activeOptions.length === 0 || segmentAngle === 0) {
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
  }, [activeOptions.length, isSpinning, playTickSound, rotation, segmentAngle]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      stopChargingAnimation();
      clearPaletteTooltipTimer();
      stopConfetti();
    };
  }, [clearPaletteTooltipTimer, stopChargingAnimation, stopConfetti]);

  useEffect(() => {
    const syncFullscreen = async () => {
      try {
        const fullscreen = await Window.getCurrent().isFullscreen();
        setIsFullscreen(fullscreen);
      } catch {
        setIsFullscreen(false);
      }
    };

    syncFullscreen();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName ?? "";
      const isInputTarget =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        target?.isContentEditable;
      const isInteractiveTarget = isInteractiveElement(target);

      if (event.key === "Escape") {
        if (showSettings) {
          setShowSettings(false);
          return;
        }
        if (showContinue) {
          handleContinue();
          return;
        }
      }

      if (event.key !== "Enter") return;

      if (isInputTarget) {
        if (showSettings) {
          addOption();
        }
        return;
      }

      if (isInteractiveTarget) {
        return;
      }

      if (showSettings) {
        return;
      }

      if (showContinue) {
        handleContinue();
        return;
      }

      if (showRoundComplete) {
        resetGame();
        return;
      }

      if (event.repeat || enterChargingRef.current) return;
      event.preventDefault();
      enterChargingRef.current = true;
      startSpinCharge();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    addOption,
    handleContinue,
    resetGame,
    startSpinCharge,
    showContinue,
    showRoundComplete,
    showSettings,
  ]);

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;

      const target = event.target as HTMLElement | null;
      const isInteractiveTarget = isInteractiveElement(target);

      if (
        isInteractiveTarget ||
        showSettings ||
        showContinue ||
        showRoundComplete ||
        !enterChargingRef.current
      ) {
        return;
      }

      enterChargingRef.current = false;
      releaseSpinCharge();
    };

    window.addEventListener("keyup", onKeyUp);
    return () => window.removeEventListener("keyup", onKeyUp);
  }, [releaseSpinCharge, showContinue, showRoundComplete, showSettings]);

  useEffect(() => {
    const onWindowBlur = () => {
      if (!enterChargingRef.current) return;
      enterChargingRef.current = false;
      releaseSpinCharge();
    };

    window.addEventListener("blur", onWindowBlur);
    return () => window.removeEventListener("blur", onWindowBlur);
  }, [releaseSpinCharge]);

  return (
    <div className="app" style={{ background: currentPalette.background }}>
      <motion.header
        className="top-app-bar"
        initial={shouldReduceMotion ? { opacity: 0 } : { y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={fadeTransition}
      >
        <div className="top-app-bar__inner">
          <div className="top-app-bar__brand">
            <p className="brand-title">{t("app.title")}</p>
            <p className="brand-meta">{currentPaletteLabel}</p>
          </div>

          <div className="top-app-bar__actions">
            <M3IconButton
              icon="language"
              active={false}
              onClick={toggleLanguage}
              title={`${t("language.switch")} (${i18n.language === "en" ? "English" : "Español"})`}
              size="large"
              reducedMotion={shouldReduceMotion}
            >
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  position: "absolute",
                  bottom: "4px",
                  right: "7px",
                  color: "inherit",
                }}
              >
                {i18n.language === "en" ? "EN" : "ES"}
              </span>
            </M3IconButton>

            <M3IconButton
              icon={isMuted ? "volume-off" : "volume-on"}
              active={isMuted}
              onClick={toggleMute}
              title={isMuted ? t("controls.unmute") : t("controls.mute")}
              size="large"
              reducedMotion={shouldReduceMotion}
            />

            <M3IconButton
              icon={turnMode ? "eliminate-active" : "eliminate"}
              active={turnMode}
              onClick={() => setTurnMode((prev) => !prev)}
              title={
                turnMode
                  ? t("controls.disableTurnMode")
                  : t("controls.enableTurnMode")
              }
              reducedMotion={shouldReduceMotion}
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
              reducedMotion={shouldReduceMotion}
            />

            <M3IconButton
              icon="settings"
              active={showSettings}
              onClick={() => setShowSettings((prev) => !prev)}
              title={t("controls.settings")}
              reducedMotion={shouldReduceMotion}
            />
          </div>
        </div>
      </motion.header>

      <main className="main">
        <div className="wheel-section" ref={containerRef}>
          <div className="wheel-layout">
            <div className="wheel-panel">
              <motion.div
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { scale: 0.9, opacity: 0 }
                }
                animate={{ scale: 1, opacity: 1 }}
                transition={springTransition}
              >
                <SpinPowerButton
                  charge={spinCharge}
                  charging={isChargingSpin}
                  disabled={
                    isSpinning ||
                    showContinue ||
                    showRoundComplete ||
                    activeOptions.length === 0
                  }
                  onChargeStart={startSpinCharge}
                  onChargeRelease={releaseSpinCharge}
                  label={t("controls.spin")}
                  hint={t("controls.holdToCharge")}
                  reducedMotion={shouldReduceMotion}
                />
              </motion.div>
            </div>

            <motion.div
              className="wheel-wrapper"
              animate={
                shouldReduceMotion
                  ? {}
                  : isSpinning
                    ? { scale: [1, 1.015, 1] }
                    : {}
              }
              transition={shouldReduceMotion ? undefined : { duration: 0.3 }}
              style={{ willChange: "transform" }}
            >
              <canvas
                ref={canvasRef}
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

            <div className="wheel-panel wheel-panel--info">
              <motion.div
                className="status-card"
                initial={
                  shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }
                }
                animate={{ opacity: 1, x: 0 }}
                transition={fadeTransition}
              >
                <div className="status-row">
                  <span className="status-label">
                    {t("status.remainingLabel")}
                  </span>
                  <strong className="status-value">
                    {activeOptions.length}/{options.length}
                  </strong>
                </div>
                <div className="status-row">
                  <span className="status-label">{t("status.modeLabel")}</span>
                  <strong className="status-value">{modeLabel}</strong>
                </div>
                <p className="status-hint">{t("status.shortcutHint")}</p>
              </motion.div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showSettings && (
            <>
              <motion.button
                type="button"
                className="settings-backdrop"
                aria-label={t("settings.close")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
              />

              <motion.aside
                className="settings-drawer"
                role="dialog"
                aria-modal="true"
                aria-label={t("settings.title")}
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={drawerTransition}
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
                    type="button"
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
                          type="button"
                          key={palette.name}
                          className={`palette-chip ${paletteIndex === index ? "selected" : ""} ${touchTooltipPaletteIndex === index ? "tooltip-visible" : ""}`}
                          onClick={() => {
                            hideTouchPaletteTooltip();
                            setPaletteIndex(index);
                          }}
                          onPointerDown={(event) => {
                            if (event.pointerType !== "touch") return;
                            clearPaletteTooltipTimer();
                            paletteTooltipTimerRef.current = window.setTimeout(
                              () => {
                                setTouchTooltipPaletteIndex(index);
                              },
                              320,
                            );
                          }}
                          onPointerUp={(event) => {
                            if (event.pointerType !== "touch") return;
                            hideTouchPaletteTooltip();
                          }}
                          onPointerCancel={(event) => {
                            if (event.pointerType !== "touch") return;
                            hideTouchPaletteTooltip();
                          }}
                          onPointerLeave={(event) => {
                            if (event.pointerType !== "touch") return;
                            hideTouchPaletteTooltip();
                          }}
                          onBlur={hideTouchPaletteTooltip}
                          aria-label={getPaletteLabel(palette)}
                          data-name={getPaletteLabel(palette)}
                          style={{
                            borderColor:
                              paletteIndex === index
                                ? palette.seedColor
                                : "transparent",
                          }}
                        >
                          <div className="chip-colors">
                            {palette.colors
                              .slice(0, 4)
                              .map((color, colorIndex) => (
                                <div
                                  key={colorIndex}
                                  className="chip-swatch"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                          </div>
                          <span className="sr-only">
                            {getPaletteLabel(palette)}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="add-option">
                    <input
                      type="text"
                      value={newOptionText}
                      onChange={(event) => setNewOptionText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addOption();
                        }
                      }}
                      placeholder={t("settings.newOption")}
                      maxLength={30}
                      className="text-field"
                    />
                    <M3Button
                      variant="filled"
                      onClick={addOption}
                      disabled={!newOptionText.trim()}
                      icon="add"
                      reducedMotion={shouldReduceMotion}
                    >
                      {t("settings.add")}
                    </M3Button>
                  </div>

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
                            onChange={(event) =>
                              updateOptionText(option.id, event.target.value)
                            }
                            className="option-text"
                            maxLength={30}
                          />
                          <button
                            type="button"
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
                  <M3Button
                    variant="tonal"
                    onClick={resetToDefaults}
                    icon="refresh"
                    reducedMotion={shouldReduceMotion}
                  >
                    {t("settings.reset")}
                  </M3Button>
                  <M3Button
                    variant="filled"
                    onClick={resetGame}
                    reducedMotion={shouldReduceMotion}
                  >
                    {t("settings.restart")}
                  </M3Button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showContinue && resultText && (
          <motion.div
            className="result-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
          >
            <motion.div
              className="result-banner"
              role="dialog"
              aria-modal="true"
              aria-label={t("victory.title")}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { scale: 0.8, opacity: 0, y: 24 }
              }
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { scale: 0.8, opacity: 0, y: 24 }
              }
              transition={springTransition}
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
                reducedMotion={shouldReduceMotion}
              >
                {t("victory.continue")}
              </M3Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRoundComplete && (
          <motion.div
            className="game-over-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
          >
            <motion.div
              className="game-over-card"
              role="dialog"
              aria-modal="true"
              aria-label={t("gameOver.title")}
              initial={
                shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }
              }
              animate={{ scale: 1, opacity: 1 }}
              exit={
                shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }
              }
              transition={springTransition}
            >
              <motion.div
                className="trophy-icon"
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        rotate: [0, -15, 15, -15, 15, 0],
                        scale: [1, 1.2, 1],
                      }
                }
                transition={
                  shouldReduceMotion
                    ? undefined
                    : {
                        duration: 1.2,
                        repeat: Infinity,
                        repeatDelay: 1.5,
                      }
                }
              >
                🎉
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
                reducedMotion={shouldReduceMotion}
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

interface M3ButtonProps {
  variant?: "filled" | "tonal" | "outlined";
  size?: "medium" | "large";
  icon?: string;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  reducedMotion?: boolean;
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
  reducedMotion = false,
}: M3ButtonProps) {
  return (
    <motion.button
      type="button"
      className={`m3-button ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{
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
        border:
          variant === "outlined"
            ? "1px solid var(--md-sys-color-outline)"
            : "none",
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
      whileHover={disabled || reducedMotion ? {} : { scale: 1.02 }}
      whileTap={disabled || reducedMotion ? {} : { scale: 0.98 }}
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

interface M3IconButtonProps {
  icon: string;
  active?: boolean;
  onClick?: () => void;
  title: string;
  size?: "medium" | "large";
  children?: React.ReactNode;
  reducedMotion?: boolean;
}

function M3IconButton({
  icon,
  active = false,
  onClick,
  title,
  size = "medium",
  children,
  reducedMotion = false,
}: M3IconButtonProps) {
  const buttonSize = size === "large" ? 52 : 44;

  return (
    <motion.button
      type="button"
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
      whileHover={
        reducedMotion
          ? {}
          : {
              scale: 1.1,
              background: active
                ? defaultTheme.error
                : defaultTheme.surfaceVariant,
            }
      }
      whileTap={reducedMotion ? {} : { scale: 0.95 }}
    >
      <svg width="24" height="24" fill="currentColor">
        <use href={`#icon-${icon}`} />
      </svg>
      {children}
    </motion.button>
  );
}

interface SpinPowerButtonProps {
  charge: number;
  charging: boolean;
  disabled?: boolean;
  onChargeStart: () => void;
  onChargeRelease: () => void;
  label: string;
  hint: string;
  reducedMotion?: boolean;
}

function SpinPowerButton({
  charge,
  charging,
  disabled = false,
  onChargeStart,
  onChargeRelease,
  label,
  hint,
  reducedMotion = false,
}: SpinPowerButtonProps) {
  return (
    <motion.button
      type="button"
      className={`spin-power-button ${charging ? "charging" : ""} ${disabled ? "disabled" : ""}`}
      aria-label={`${label}. ${hint}`}
      aria-disabled={disabled}
      onPointerDown={() => {
        if (!disabled) onChargeStart();
      }}
      onPointerUp={() => {
        if (!disabled) onChargeRelease();
      }}
      onPointerCancel={() => {
        if (!disabled) onChargeRelease();
      }}
      onPointerLeave={() => {
        if (!disabled) onChargeRelease();
      }}
      onKeyDown={(event) => {
        if (disabled) return;
        if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
          event.preventDefault();
          onChargeStart();
        }
      }}
      onKeyUp={(event) => {
        if (disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onChargeRelease();
        }
      }}
      onContextMenu={(event) => event.preventDefault()}
      style={{ ["--spin-charge" as string]: charge } as React.CSSProperties}
      whileHover={reducedMotion ? {} : { scale: 1.02 }}
      whileTap={reducedMotion ? {} : { scale: 0.98 }}
    >
      <span className="spin-power-icon" aria-hidden>
        <svg width="22" height="22" fill="currentColor">
          <use href="#icon-play" />
        </svg>
      </span>
      <span className="spin-power-content">
        <span className="spin-power-label">{label}</span>
        <span className="spin-power-hint">{hint}</span>
      </span>
      <span className="spin-power-percent" aria-hidden>
        {Math.round(charge * 100)}%
      </span>
    </motion.button>
  );
}

export default App;
