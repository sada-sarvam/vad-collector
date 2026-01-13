'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Pause, RotateCcw, Check, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
  minDuration?: number;
  maxDuration?: number;
  disabled?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing';

export default function AudioRecorder({
  onRecordingComplete,
  onCancel,
  minDuration = 2,
  maxDuration = 16,
  disabled = false,
}: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Visualize audio
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (state !== 'recording') return;

      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgba(10, 10, 27, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#6BCFCF';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  }, [state]);

  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      // Setup audio visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setState('recorded');

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();
      };

      mediaRecorder.start(100);
      setState('recording');
      startTimeRef.current = Date.now();

      // Start timer
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(elapsed);

        // Auto-stop at max duration
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);

      // Start visualization
      drawWaveform();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Microphone access denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setState('playing');
    }
  };

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState('recorded');
    }
  };

  const reRecord = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setDuration(0);
    setState('idle');
  };

  const submitRecording = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: 'audio/webm',
      });
      onRecordingComplete(audioBlob, duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const isValidDuration = duration >= minDuration && duration <= maxDuration;

  return (
    <div className="w-full space-y-6">
      {/* Waveform Display */}
      <div className="waveform-container h-32 flex items-center justify-center">
        {state === 'recording' ? (
          <canvas
            ref={canvasRef}
            width={600}
            height={100}
            className="w-full h-full"
          />
        ) : state === 'recorded' || state === 'playing' ? (
          <div className="w-full h-full flex items-center justify-center">
            <audio
              ref={audioRef}
              src={audioUrl || undefined}
              onEnded={() => setState('recorded')}
              className="hidden"
            />
            <div className="flex items-center gap-4">
              <span className="text-white/50">Recording ready</span>
              <span className="timer-display text-2xl">{formatTime(duration)}</span>
            </div>
          </div>
        ) : (
          <div className="text-white/30 text-lg">
            Press the button to start recording
          </div>
        )}
      </div>

      {/* Timer */}
      <div className="text-center">
        <span className="timer-display">{formatTime(duration)}</span>
        {state === 'recording' && (
          <div className="mt-2 text-sm text-white/50">
            {duration < minDuration
              ? `Record at least ${minDuration}s`
              : duration > maxDuration - 2
              ? `Stopping in ${Math.ceil(maxDuration - duration)}s`
              : 'Recording...'}
          </div>
        )}
      </div>

      {/* Duration Indicator */}
      {(state === 'recorded' || state === 'playing') && (
        <div className="flex justify-center">
          {isValidDuration ? (
            <span className="label-complete px-4 py-2 rounded-full text-sm font-medium">
              ✓ Valid duration ({formatTime(duration)})
            </span>
          ) : (
            <span className="label-incomplete px-4 py-2 rounded-full text-sm font-medium">
              {duration < minDuration
                ? `Too short (min ${minDuration}s)`
                : `Too long (max ${maxDuration}s)`}
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-center text-red-400 text-sm">{error}</div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              key="record"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <button
                onClick={startRecording}
                disabled={disabled}
                className="record-button flex items-center justify-center"
              >
                <Mic className="w-10 h-10 text-white" />
              </button>
            </motion.div>
          )}

          {state === 'recording' && (
            <motion.div
              key="stop"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <button
                onClick={stopRecording}
                className="record-button recording flex items-center justify-center"
              >
                <Square className="w-10 h-10 text-white" fill="white" />
              </button>
            </motion.div>
          )}

          {(state === 'recorded' || state === 'playing') && (
            <motion.div
              key="controls"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex gap-4"
            >
              {/* Play/Pause */}
              <Button
                variant="secondary"
                size="lg"
                onClick={state === 'playing' ? pausePlayback : playRecording}
                leftIcon={
                  state === 'playing' ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )
                }
              >
                {state === 'playing' ? 'Pause' : 'Play'}
              </Button>

              {/* Re-record */}
              <Button
                variant="ghost"
                size="lg"
                onClick={reRecord}
                leftIcon={<RotateCcw className="w-5 h-5" />}
              >
                Re-record
              </Button>

              {/* Submit */}
              <Button
                variant="primary"
                size="lg"
                onClick={submitRecording}
                disabled={!isValidDuration}
                leftIcon={<Check className="w-5 h-5" />}
              >
                Submit
              </Button>

              {/* Cancel */}
              {onCancel && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={onCancel}
                  leftIcon={<X className="w-5 h-5" />}
                >
                  Cancel
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
