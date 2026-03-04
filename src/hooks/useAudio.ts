import { useState, useCallback, useEffect, useRef } from "react";

const AUDIO_MUTE_KEY = "wheelMuted";
const MIN_TICK_INTERVAL_SECONDS = 0.028;

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const lastTickTimeRef = useRef(0);

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUDIO_MUTE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const initializeAudioGraph = useCallback((audioContext: AudioContext) => {
    if (masterGainRef.current && compressorRef.current) {
      return;
    }

    const masterGain = audioContext.createGain();
    const compressor = audioContext.createDynamicsCompressor();

    masterGain.gain.value = 0.95;
    compressor.threshold.value = -8;
    compressor.knee.value = 14;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.002;
    compressor.release.value = 0.15;

    masterGain.connect(compressor);
    compressor.connect(audioContext.destination);

    masterGainRef.current = masterGain;
    compressorRef.current = compressor;
  }, []);

  const getAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      initializeAudioGraph(audioContextRef.current);
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, [initializeAudioGraph]);

  const playTickSound = useCallback(async () => {
    if (isMuted) return;

    const audioContext = await getAudioContext();
    const now = audioContext.currentTime;

    if (now - lastTickTimeRef.current < MIN_TICK_INTERVAL_SECONDS) {
      return;
    }
    lastTickTimeRef.current = now;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(masterGainRef.current ?? audioContext.destination);

    oscillator.frequency.value = 910;
    oscillator.type = "triangle";

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    oscillator.start(now);
    oscillator.stop(now + 0.035);
  }, [getAudioContext, isMuted]);

  const playVictorySound = useCallback(async () => {
    if (isMuted) return;

    const audioContext = await getAudioContext();
    const now = audioContext.currentTime;
    const frequencies = [523.25, 659.25, 783.99, 1046.5, 1318.51];

    frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(masterGainRef.current ?? audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      const start = now + index * 0.08;
      gainNode.gain.setValueAtTime(0, start);
      gainNode.gain.linearRampToValueAtTime(0.2, start + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.001, start + 0.26);

      oscillator.start(start);
      oscillator.stop(start + 0.26);
    });
  }, [getAudioContext, isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((previous) => !previous);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(AUDIO_MUTE_KEY, String(isMuted));
    } catch {
      // Ignore write failures (private mode / storage disabled)
    }
  }, [isMuted]);

  useEffect(() => {
    const initAudio = () => {
      getAudioContext().catch(console.error);
    };

    window.addEventListener("pointerdown", initAudio, { once: true });
    window.addEventListener("keydown", initAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", initAudio);
      window.removeEventListener("keydown", initAudio);

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      masterGainRef.current = null;
      compressorRef.current = null;
      lastTickTimeRef.current = 0;
    };
  }, [getAudioContext]);

  return {
    playTickSound,
    playVictorySound,
    toggleMute,
    isMuted,
  };
}
