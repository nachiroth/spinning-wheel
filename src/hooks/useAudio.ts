/**
 * Audio Hook for Material Design 3 Spinning Wheel
 * Uses Web Audio API for synthesized sound effects
 * All sounds generated programmatically - no external files needed
 */

import { useState, useCallback, useEffect } from "react";

export function useAudio() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  /**
   * Initialize or get AudioContext
   * Must be called on user interaction
   */
  const getAudioContext = useCallback(() => {
    if (!audioContext) {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      setAudioContext(ctx);
      return ctx;
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(console.error);
    }

    return audioContext;
  }, [audioContext]);

  /**
   * Play tick sound - soft click for segment transitions
   */
  const playTickSound = useCallback(() => {
    if (isMuted || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }, [isMuted, audioContext]);

  /**
   * Play victory fanfare - ascending celebration sound
   */
  const playVictorySound = useCallback(() => {
    if (isMuted || !audioContext) return;

    const now = audioContext.currentTime;
    const frequencies = [523.25, 659.25, 783.99, 1046.5, 1318.51];

    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = freq;
      oscillator.type = "sine";

      const startTime = now + index * 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }, [isMuted, audioContext]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      console.log("[Audio] Muted:", newValue);
      return newValue;
    });
  }, []);

  /**
   * Initialize audio on first user interaction
   */
  useEffect(() => {
    const initAudio = () => {
      getAudioContext();
    };

    document.addEventListener("click", initAudio, { once: true });
    document.addEventListener("keydown", initAudio, { once: true });

    return () => {
      document.removeEventListener("click", initAudio);
      document.removeEventListener("keydown", initAudio);

      if (audioContext) {
        audioContext.close();
      }
    };
  }, [getAudioContext, audioContext]);

  return {
    playTickSound,
    playVictorySound,
    toggleMute,
    isMuted,
  };
}
