import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Check, 
  Volume2, 
  Sparkles,
  Globe2,
  AlertCircle
} from 'lucide-react';

interface VoiceNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyText: (transcribedText: string) => void;
  initialText?: string;
  fieldLabel?: string;
  language: 'ta' | 'en';
  onLanguageChange: (lang: 'ta' | 'en') => void;
}

export function VoiceNoteModal({
  isOpen,
  onClose,
  onApplyText,
  initialText = '',
  fieldLabel = 'Input Field',
  language,
  onLanguageChange,
}: VoiceNoteModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialText);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTranscript(initialText);
      setErrorMessage(null);
      // Auto-start listening on open
      startListening();
    } else {
      stopListening();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    }

    return () => {
      stopListening();
    };
  }, [isOpen, language]);

  const startListening = async () => {
    setErrorMessage(null);

    // 1. Initialize SpeechRecognition API
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. You can type or use the virtual keyboards.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentTranscript += piece + ' ';
          } else {
            currentTranscript += piece;
          }
        }

        if (currentTranscript.trim()) {
          setTranscript((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${currentTranscript.trim()}` : currentTranscript.trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permission in your browser settings.');
        } else if (event.error === 'no-speech') {
          // No speech detected yet, keep listening
        } else {
          setErrorMessage(`Notice: ${event.error || 'Speech error'}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();

      // 2. Also record audio stream via MediaRecorder if available
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (audioBlob.size > 0) {
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
          }
          // Stop media tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
      } catch (mediaErr) {
        console.warn('MediaRecorder notice:', mediaErr);
      }
    } catch (err: any) {
      console.warn('Speech init exception:', err);
      setErrorMessage(err?.message || 'Could not start microphone');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
      mediaRecorderRef.current = null;
    }

    setIsListening(false);
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handlePlayAudio = () => {
    if (!audioUrl) return;
    if (audioElementRef.current) {
      if (isPlayingAudio) {
        audioElementRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioElementRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const handleApply = () => {
    stopListening();
    onApplyText(transcript);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs transition-colors ${
              isListening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Voice Note Capture
              </h3>
              <p className="text-[11px] text-slate-500">
                Dictate for <span className="font-semibold text-slate-700">{fieldLabel}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Language Switcher Bar */}
          <div className="flex items-center justify-between p-2 bg-slate-100 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 ml-1">
              <Globe2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Speech Recognition Language:</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('ta')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'ta'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                தமிழ் (Tamil)
              </button>
            </div>
          </div>

          {/* Big Mic Button & Audio Waveform animation */}
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <button
              type="button"
              onClick={handleToggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-rose-500 hover:bg-rose-600 text-white ring-8 ring-rose-100 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-100'
              }`}
            >
              {isListening ? (
                <Square className="w-8 h-8 fill-current" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            <div className="text-center space-y-1">
              <div className="text-xs font-bold text-slate-800">
                {isListening ? (
                  <span className="text-rose-600 flex items-center gap-1.5 justify-center">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    Listening in {language === 'ta' ? 'தமிழ் (Tamil)' : 'English'}... Speak now!
                  </span>
                ) : (
                  <span className="text-slate-600">Tap microphone to start speaking</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                {language === 'ta' ? 'எடுத்துக்காட்டு: "மண்டபம் முன்பணம் இருபதாயிரம்"' : 'Example: "Catering booking advance ten thousand"'}
              </div>
            </div>

            {/* Audio Waveform Bars Simulation */}
            {isListening && (
              <div className="flex items-center gap-1 pt-1 h-6">
                {[12, 24, 16, 32, 20, 28, 14, 30, 18, 22].map((height, i) => (
                  <div
                    key={i}
                    style={{ height: `${height}px` }}
                    className="w-1 bg-rose-500 rounded-full animate-bounce"
                    style-custom={{ animationDelay: `${i * 70}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Transcript Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Transcribed Text:</span>
              </span>
              {transcript && (
                <button
                  type="button"
                  onClick={() => setTranscript('')}
                  className="text-[11px] text-rose-500 hover:text-rose-700 font-medium"
                >
                  Clear
                </button>
              )}
            </label>

            <textarea
              rows={3}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your spoken words will appear here in real time..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Audio Note Playback preview if recorded */}
          {audioUrl && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>Recorded Voice Note</span>
              </div>
              <button
                type="button"
                onClick={handlePlayAudio}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                {isPlayingAudio ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{isPlayingAudio ? 'Stop' : 'Play'}</span>
              </button>
              <audio
                ref={audioElementRef}
                src={audioUrl}
                onEnded={() => setIsPlayingAudio(false)}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!transcript.trim()}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Field</span>
          </button>
        </div>
      </div>
    </div>
  );
}
