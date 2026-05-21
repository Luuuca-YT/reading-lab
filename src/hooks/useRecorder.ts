import { useRef, useState, useCallback } from 'react';

interface RecorderState {
  status: 'idle' | 'requesting' | 'recording' | 'paused';
  elapsedMs: number;
  error: string | null;
  maxVolume: number;
  isSilent: boolean;
}

export function useRecorder() {
  const [state, setState] = useState<RecorderState>({
    status: 'idle',
    elapsedMs: 0,
    error: null,
    maxVolume: 0,
    isSilent: true,
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = useCallback(async (): Promise<{ blob: Blob; isSilent: boolean; maxVolume: number } | null> => {
    setState({ status: 'requesting', elapsedMs: 0, error: null, maxVolume: 0, isSilent: true });
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = () => {
        setState((s) => ({ ...s, status: 'idle', error: 'Recording error occurred.' }));
      };

      recorder.start(1000); // emit data every second

      startRef.current = Date.now();
      accumulatedRef.current = 0;
      timerRef.current = setInterval(() => {
        const elapsed = accumulatedRef.current + (Date.now() - startRef.current);
        setState((s) => ({ ...s, elapsedMs: elapsed }));
      }, 100);

      setState({ status: 'recording', elapsedMs: 0, error: null, maxVolume: 0, isSilent: true });

      // Setup Web Audio API volume monitoring
      let maxVal = 0;
      let audioCtx: AudioContext | null = null;
      let analyser: AnalyserNode | null = null;
      let source: MediaStreamAudioSourceNode | null = null;
      let checkVolumeInterval: any = null;

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        checkVolumeInterval = setInterval(() => {
          if (!analyser) return;
          analyser.getByteTimeDomainData(dataArray);
          for (let i = 0; i < bufferLength; i++) {
            const amplitude = Math.abs(dataArray[i] - 128) / 128;
            if (amplitude > maxVal) {
              maxVal = amplitude;
            }
          }
        }, 100);
      } catch (audioErr) {
        console.warn('Failed to initialize Web Audio Analyser:', audioErr);
      }

      // Return a promise that resolves when recording stops
      return new Promise((resolve) => {
        recorder.onstop = () => {
          // Stop volume checking
          if (checkVolumeInterval) clearInterval(checkVolumeInterval);
          if (source) source.disconnect();
          if (audioCtx && audioCtx.state !== 'closed') {
            audioCtx.close();
          }

          // Stop all tracks
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: mimeType });
          
          // Silence threshold: peak amplitude must exceed ~6% to count as speech.
          // This prevents Whisper hallucination from quiet ambient noise or breath.
          const isSilent = maxVal < 0.06;
          console.log(`[useRecorder] Stopped. Peak volume detected: ${maxVal.toFixed(4)} (isSilent = ${isSilent})`);
          
          setState((s) => ({
            ...s,
            maxVolume: maxVal,
            isSilent,
          }));

          resolve({ blob, isSilent, maxVolume: maxVal });
        };
      });
    } catch (err: any) {
      const message =
        err.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow microphone access in your system settings.'
          : err.name === 'NotFoundError'
          ? 'No microphone found. Please connect a microphone and try again.'
          : `Microphone error: ${err.message}`;
      setState({ status: 'idle', elapsedMs: 0, error: message, maxVolume: 0, isSilent: true });
      return null;
    }
  }, []);

  const pause = useCallback(() => {
    if (state.status !== 'recording' || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.pause();
    accumulatedRef.current += Date.now() - startRef.current;
    clearTimer();
    setState((s) => ({ ...s, status: 'paused', elapsedMs: accumulatedRef.current }));
  }, [state.status]);

  const resume = useCallback(() => {
    if (state.status !== 'paused' || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.resume();
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = accumulatedRef.current + (Date.now() - startRef.current);
      setState((s) => ({ ...s, elapsedMs: elapsed }));
    }, 100);
    setState((s) => ({ ...s, status: 'recording' }));
  }, [state.status]);

  const stop = useCallback(() => {
    clearTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    const final =
      state.status === 'paused'
        ? accumulatedRef.current
        : accumulatedRef.current + (Date.now() - startRef.current);
    setState((s) => ({ ...s, status: 'idle', elapsedMs: final }));
  }, [state.status]);

  return { ...state, start, pause, resume, stop };
}

export function formatMs(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
