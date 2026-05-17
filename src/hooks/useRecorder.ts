import { useRef, useState, useCallback } from 'react';

interface RecorderState {
  status: 'idle' | 'requesting' | 'recording' | 'paused';
  elapsedMs: number;
  error: string | null;
}

export function useRecorder() {
  const [state, setState] = useState<RecorderState>({
    status: 'idle',
    elapsedMs: 0,
    error: null,
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

  const start = useCallback(async (): Promise<Blob | null> => {
    setState({ status: 'requesting', elapsedMs: 0, error: null });
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

      setState({ status: 'recording', elapsedMs: 0, error: null });

      // Return a promise that resolves when recording stops
      return new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          // Stop all tracks
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: mimeType });
          resolve(blob);
        };
      });
    } catch (err: any) {
      const message =
        err.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow microphone access in your system settings.'
          : err.name === 'NotFoundError'
          ? 'No microphone found. Please connect a microphone and try again.'
          : `Microphone error: ${err.message}`;
      setState({ status: 'idle', elapsedMs: 0, error: message });
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
    setState({ status: 'idle', elapsedMs: final, error: null });
  }, [state.status]);

  return { ...state, start, pause, resume, stop };
}

export function formatMs(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
