import React, { useState } from 'react';
import { 
  TAMIL_VOWELS, 
  TAMIL_CONSONANTS, 
  TAMIL_GRANTHA, 
  TAMIL_DIACRITICS,
  TAMIL_NUMERALS,
  TAMIL_EXPENSE_KEYWORDS,
  transliterateToTamil 
} from '../../utils/tamilTransliteration';
import { Delete, Space, X, Wand2 } from 'lucide-react';

interface TamilVirtualKeyboardProps {
  value: string;
  onChange: (newValue: string) => void;
  onClose: () => void;
  title?: string;
}

export function TamilVirtualKeyboard({
  value,
  onChange,
  onClose,
  title = 'Tamil Keyboard (தமிழ் விசைப்பலகை)',
}: TamilVirtualKeyboardProps) {
  const [tanglishInput, setTanglishInput] = useState('');
  const [activeTab, setActiveTab] = useState<'letters' | 'diacritics' | 'quick-words' | 'tanglish'>('letters');

  const handleInsertChar = (char: string) => {
    onChange(value + char);
  };

  const handleBackspace = () => {
    if (value.length > 0) {
      // Handles multi-byte Tamil characters safely with Array.from
      const chars = Array.from(value);
      chars.pop();
      onChange(chars.join(''));
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const handleTransliterateTanglish = () => {
    if (!tanglishInput.trim()) return;
    const converted = transliterateToTamil(tanglishInput.trim());
    onChange(value ? `${value} ${converted}` : converted);
    setTanglishInput('');
  };

  const quickKeywords = Object.entries(TAMIL_EXPENSE_KEYWORDS).slice(0, 18);

  return (
    <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-3 sm:p-4 max-w-xl w-full mx-auto select-none animate-in fade-in zoom-in-95 duration-150">
      {/* Keyboard Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 tracking-wide">
            {title}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-semibold">
            தமிழ் Active
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Keyboard"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('letters')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'letters'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
          }`}
        >
          எழுத்துக்கள் (Letters)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diacritics')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'diacritics'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
          }`}
        >
          குறியீடுகள் (Matras)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quick-words')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'quick-words'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
          }`}
        >
          செலவு சொற்கள் (Quick Words)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tanglish')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
            activeTab === 'tanglish'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
          }`}
        >
          <Wand2 className="w-3 h-3 text-indigo-400" />
          <span>Tanglish to தமிழ்</span>
        </button>
      </div>

      {/* Main Keys View */}
      {activeTab === 'letters' && (
        <div className="space-y-2.5">
          {/* Vowels (உயிர் எழுத்துக்கள்) */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              உயிர் எழுத்துக்கள் (Vowels)
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-13 gap-1">
              {TAMIL_VOWELS.map((vowel) => (
                <button
                  type="button"
                  key={vowel}
                  onClick={() => handleInsertChar(vowel)}
                  className="h-8 sm:h-9 bg-slate-800 hover:bg-emerald-600 active:scale-95 text-slate-100 hover:text-white rounded-lg text-sm sm:text-base font-medium flex items-center justify-center border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer"
                >
                  {vowel}
                </button>
              ))}
            </div>
          </div>

          {/* Consonants (மெய் எழுத்துக்கள்) */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              மெய் எழுத்துக்கள் (Consonants)
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-1">
              {TAMIL_CONSONANTS.map((c) => (
                <button
                  type="button"
                  key={c.letter}
                  onClick={() => handleInsertChar(c.letter)}
                  className="h-8 sm:h-9 bg-slate-800 hover:bg-emerald-600 active:scale-95 text-slate-100 hover:text-white rounded-lg text-sm sm:text-base font-medium flex items-center justify-center border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer"
                >
                  {c.letter}
                </button>
              ))}
              {TAMIL_GRANTHA.map((g) => (
                <button
                  type="button"
                  key={g.letter}
                  onClick={() => handleInsertChar(g.letter)}
                  className="h-8 sm:h-9 bg-slate-800/80 hover:bg-indigo-600 active:scale-95 text-indigo-200 hover:text-white rounded-lg text-sm sm:text-base font-medium flex items-center justify-center border border-indigo-900/60 hover:border-indigo-500 transition-all cursor-pointer"
                  title={g.name}
                >
                  {g.letter}
                </button>
              ))}
            </div>
          </div>

          {/* Key Diacritics row directly accessible */}
          <div className="flex flex-wrap items-center gap-1 pt-1">
            <span className="text-[10px] text-slate-400 font-semibold mr-1">சேர்க்க:</span>
            {TAMIL_DIACRITICS.slice(0, 8).map((d) => (
              <button
                type="button"
                key={d.char}
                onClick={() => handleInsertChar(d.char)}
                className="px-2 py-1 bg-slate-750 hover:bg-emerald-700 active:scale-95 text-emerald-300 hover:text-white rounded-md text-xs font-bold border border-slate-700 transition-all cursor-pointer"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Diacritics Tab */}
      {activeTab === 'diacritics' && (
        <div className="space-y-3">
          <div className="text-[11px] text-slate-400">
            எழுத்தின் பின்னால் சேர்க்க வேண்டிய உயிர்மெய் குறியீடுகள் (Modifiers):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TAMIL_DIACRITICS.map((d) => (
              <button
                type="button"
                key={d.char}
                onClick={() => handleInsertChar(d.char)}
                className="py-2.5 px-3 bg-slate-800 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-medium flex items-center justify-between border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer"
              >
                <span className="text-base font-bold text-emerald-400">{d.char}</span>
                <span className="text-slate-300 text-[11px]">{d.label}</span>
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            தமிழ் எண்கள் (Tamil Numerals):
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {TAMIL_NUMERALS.map((num) => (
              <button
                type="button"
                key={num.tamil}
                onClick={() => handleInsertChar(num.tamil)}
                className="py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-center border border-slate-700 transition-all cursor-pointer"
                title={`Tamil ${num.arabic}`}
              >
                <div className="text-sm font-bold text-amber-400">{num.tamil}</div>
                <div className="text-[9px] text-slate-500">{num.arabic}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Words Tab */}
      {activeTab === 'quick-words' && (
        <div className="space-y-2.5">
          <div className="text-[11px] text-slate-400">
            பொதுவான திருமண மற்றும் செலவு சொற்கள் (One-Tap Add):
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {quickKeywords.map(([tanglish, tamilWord]) => (
              <button
                type="button"
                key={tanglish}
                onClick={() => handleInsertChar(value ? ` ${tamilWord}` : tamilWord)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span className="font-semibold text-emerald-300">{tamilWord}</span>
                <span className="text-[10px] text-slate-400">({tanglish})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tanglish Phonetic Live Converter Tab */}
      {activeTab === 'tanglish' && (
        <div className="space-y-3">
          <div className="text-[11px] text-slate-400">
            ஆங்கிலத்தில் தட்டச்சு செய்யவும் (Tanglish), பின்னர் தானாக தமிழில் மாற்றவும்:
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tanglishInput}
              onChange={(e) => setTanglishInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTransliterateTanglish();
                }
              }}
              placeholder="e.g. sappadu, alankaram, advance, nagai..."
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <button
              type="button"
              onClick={handleTransliterateTanglish}
              disabled={!tanglishInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>தமிழில் மாற்று</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-400">
            எடுத்துக்காட்டுகள்: <code className="text-indigo-300">mandapam</code> → மண்டபம் | <code className="text-indigo-300">catering</code> → கேட்டரிங் | <code className="text-indigo-300">advance</code> → முன்பணம்
          </div>
        </div>
      )}

      {/* Bottom Common Action Bar: Space, Backspace, Clear, Done */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            அழி (Clear)
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            title="Backspace"
          >
            <Delete className="w-3.5 h-3.5" />
            <span>நீக்கு</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleInsertChar(' ')}
          className="flex-1 max-w-xs py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
        >
          <Space className="w-3.5 h-3.5" />
          <span>இடைவெளி (Space)</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
        >
          முடிந்தது (Done)
        </button>
      </div>
    </div>
  );
}
