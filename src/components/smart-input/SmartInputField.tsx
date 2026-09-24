import React, { useState } from 'react';
import { 
  Keyboard, 
  PenTool, 
  Mic, 
  Globe2, 
  X,
  Maximize2,
  Image as ImageIcon
} from 'lucide-react';
import { TamilVirtualKeyboard } from './TamilVirtualKeyboard';
import { EnglishVirtualKeyboard } from './EnglishVirtualKeyboard';
import { HandwritingCanvasModal } from './HandwritingCanvasModal';
import { VoiceNoteModal } from './VoiceNoteModal';

interface SmartInputFieldProps {
  id?: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'number';
  isTextarea?: boolean;
  rows?: number;
  prefix?: string;
  step?: string;
  min?: string;
  className?: string;
  handwrittenImage?: string;
  onHandwrittenChange?: (dataUrl: string | undefined) => void;
}

export function SmartInputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  isTextarea = false,
  rows = 2,
  prefix,
  step,
  min,
  className = '',
  handwrittenImage,
  onHandwrittenChange,
}: SmartInputFieldProps) {
  // Input modes & language state
  const [language, setLanguage] = useState<'ta' | 'en'>('ta'); // Default to Tamil as requested
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showHandwriting, setShowHandwriting] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showEnlargedHandwriting, setShowEnlargedHandwriting] = useState(false);

  // Local fallback if parent didn't provide onHandwrittenChange
  const [localHandwriting, setLocalHandwriting] = useState<string | undefined>(handwrittenImage);

  const currentHandwrittenImage = handwrittenImage !== undefined ? handwrittenImage : localHandwriting;

  const setHandwritten = (val: string | undefined) => {
    if (onHandwrittenChange) {
      onHandwrittenChange(val);
    }
    setLocalHandwriting(val);
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'ta' ? 'en' : 'ta'));
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label & Multi-Input Toolbar */}
      <div className="flex items-center justify-between">
        <label 
          htmlFor={id} 
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>

        {/* Input Accessory Toolbar: 3 Types (Language Keyboards, Handwritten, Voice Note) */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {/* 1. Language Toggle: English <-> Tamil */}
          <button
            type="button"
            onClick={toggleLanguage}
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              language === 'ta'
                ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                : 'bg-blue-600 text-white shadow-2xs hover:bg-blue-700'
            }`}
            title="Switch Language: English / தமிழ் (Switches Keyboard and Voice Language)"
          >
            <Globe2 className="w-3 h-3" />
            <span>{language === 'ta' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* 2. Keyboard Toggle (Adapts to selected language: Tamil or English) */}
          <button
            type="button"
            onClick={() => setShowKeyboard((prev) => !prev)}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
              showKeyboard 
                ? 'bg-slate-900 text-white shadow-2xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
            title={language === 'ta' ? 'Open/Close Tamil Virtual Keyboard' : 'Open/Close English Quick Keyboard'}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {language === 'ta' ? 'தமிழ் விசைப்பலகை' : 'Keys'}
            </span>
          </button>

          {/* 3. Handwritten Drawing Pad Toggle */}
          <button
            type="button"
            onClick={() => setShowHandwriting(true)}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
              currentHandwrittenImage 
                ? 'bg-indigo-100 text-indigo-800 font-semibold' 
                : 'text-slate-600 hover:text-indigo-600 hover:bg-white'
            }`}
            title="Handwritten Drawing Pad (Draw with finger, stylus, mouse and store what you write)"
          >
            <PenTool className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Handwrite</span>
            {currentHandwrittenImage && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            )}
          </button>

          {/* 4. Voice Note Dictation Toggle */}
          <button
            type="button"
            onClick={() => setShowVoice(true)}
            className="px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-600 hover:text-rose-600 hover:bg-white transition-all flex items-center gap-1 cursor-pointer"
            title={`Voice Note Dictation in ${language === 'ta' ? 'Tamil (தமிழ்)' : 'English'}`}
          >
            <Mic className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Voice</span>
          </button>
        </div>
      </div>

      {/* Main Input Element */}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm pointer-events-none select-none">
            {prefix}
          </span>
        )}

        {isTextarea ? (
          <textarea
            id={id}
            rows={rows}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${
              prefix ? 'pl-8' : ''
            }`}
          />
        ) : (
          <input
            id={id}
            type={type}
            required={required}
            step={step}
            min={min}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
              prefix ? 'pl-8 font-mono' : ''
            }`}
          />
        )}
      </div>

      {/* Stored Handwritten Image Preview Card (When user drew on canvas) */}
      {currentHandwrittenImage && (
        <div className="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Thumbnail Preview */}
            <div 
              onClick={() => setShowEnlargedHandwriting(true)}
              className="w-14 h-10 bg-white p-1 rounded-lg border border-indigo-200 shadow-2xs flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors shrink-0 group relative"
              title="Click to view full handwritten drawing"
            >
              <img 
                src={currentHandwrittenImage} 
                alt="Handwritten note" 
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                <Maximize2 className="w-3 h-3 text-indigo-700" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <PenTool className="w-3 h-3 text-indigo-600 shrink-0" />
                <span className="truncate">Stored Handwritten Note</span>
              </div>
              <p className="text-[10px] text-indigo-700 truncate">
                Saved & stored directly on this record
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowHandwriting(true)}
              className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              title="Redraw or edit handwriting"
            >
              Redraw
            </button>
            <button
              type="button"
              onClick={() => setHandwritten(undefined)}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Remove stored handwriting"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Enlarged Handwriting Lightbox */}
      {showEnlargedHandwriting && currentHandwrittenImage && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowEnlargedHandwriting(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 max-w-md w-full space-y-3 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <PenTool className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Stored Handwritten Note</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowEnlargedHandwriting(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center shadow-inner">
              <img 
                src={currentHandwrittenImage} 
                alt="Enlarged handwritten note" 
                className="max-h-56 max-w-full object-contain drop-shadow-xs"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowEnlargedHandwriting(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Virtual Keyboard (Tamil or English based on selected language) */}
      {showKeyboard && (
        <div className="pt-2 animate-in fade-in zoom-in-95 duration-100">
          {language === 'ta' ? (
            <TamilVirtualKeyboard
              value={value}
              onChange={onChange}
              onClose={() => setShowKeyboard(false)}
              title={`Tamil Keyboard (${label})`}
            />
          ) : (
            <EnglishVirtualKeyboard
              value={value}
              onChange={onChange}
              onClose={() => setShowKeyboard(false)}
              title={`English Keyboard (${label})`}
              isNumeric={type === 'number'}
            />
          )}
        </div>
      )}

      {/* Handwritten Modal Canvas */}
      {showHandwriting && (
        <HandwritingCanvasModal
          isOpen={showHandwriting}
          onClose={() => setShowHandwriting(false)}
          onApply={(recognized, drawingDataUrl) => {
            if (recognized) {
              onChange(recognized);
            }
            if (drawingDataUrl) {
              setHandwritten(drawingDataUrl);
            }
          }}
          initialText={value}
          initialDrawing={currentHandwrittenImage}
          fieldLabel={label}
          isNumericOnly={type === 'number'}
        />
      )}

      {/* Voice Note Capture Modal */}
      {showVoice && (
        <VoiceNoteModal
          isOpen={showVoice}
          onClose={() => setShowVoice(false)}
          onApplyText={(spokenText) => {
            onChange(value ? `${value} ${spokenText}` : spokenText);
          }}
          initialText={value}
          fieldLabel={label}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}
    </div>
  );
}
