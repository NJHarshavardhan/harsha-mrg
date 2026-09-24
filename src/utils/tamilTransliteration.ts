/**
 * Tamil Transliteration & Phonetic Dictionary Utility
 * Provides Tanglish to Tamil mapping and phonetic conversions
 */

// Common Tamil Wedding & Expense keywords dictionary
export const TAMIL_EXPENSE_KEYWORDS: Record<string, string> = {
  // Expense terms
  'mandapam': 'மண்டபம்',
  'hall': 'மண்டபம்',
  'marriage hall': 'திருமண மண்டபம்',
  'catering': 'கேட்டரிங்',
  'sappadu': 'சாப்பாடு',
  'food': 'உணவு',
  'samayal': 'சமையல்',
  'sweets': 'இனிப்புகள்',
  'alankaram': 'அலங்காரம்',
  'decoration': 'அலங்காரம்',
  'decor': 'அலங்காரம்',
  'pookkal': 'பூக்கள்',
  'poo': 'பூ',
  'flowers': 'பூக்கள்',
  'maala': 'மாலை',
  'garland': 'மாலை',
  'photo': 'புகைப்படம்',
  'photography': 'புகைப்படம்',
  'video': 'வீடியோ',
  'cameraman': 'கேமராமேன்',
  'thangam': 'தங்கம்',
  'gold': 'தங்கம்',
  'nagai': 'நகை',
  'jewelry': 'நகை',
  'jewellery': 'நகை',
  'velli': 'வெள்ளி',
  'silver': 'வெள்ளி',
  'pattu': 'பட்டு',
  'pudavai': 'புடவை',
  'saree': 'புடவை',
  'vesti': 'வேஷ்டி',
  'clothes': 'ஆடைகள்',
  'thuni': 'துணி',
  'dress': 'ஆடை',
  'vandi': 'வண்டி',
  'car': 'கார்',
  'vadagai': 'வாடகை',
  'travel': 'பயணம்',
  'rent': 'வாடகை',
  'hotel': 'விடுதி',
  'room': 'அறை',
  'advance': 'முன்பணம்',
  'advans': 'முன்பணம்',
  'munpanam': 'முன்பணம்',
  'meethi': 'மீதி தொகை',
  'balance': 'மீதி தொகை',
  'panam': 'பணம்',
  'kaasu': 'காசு',
  'rokam': 'ரொக்கம்',
  'cash': 'ரொக்கம்',
  'parisu': 'பரிசு',
  'gift': 'பரிசு',
  'thaamboolam': 'தாம்பூலம்',
  'pooja': 'பூஜை',
  'mangal': 'மங்கலம்',
  'nathaswaram': 'நாதஸ்வரம்',
  'melam': 'மேளம்',
  'music': 'இசை',
  'dj': 'இசை அமைப்பு',
  'kalyanam': 'கல்யாணம்',
  'thirumanam': 'திருமணம்',
  'nichayathartham': 'நிச்சயதார்த்தம்',
  'reception': 'வரவேற்பு',
  'sangeet': 'சங்கீத்',
  'mehendi': 'மருதாணி',
  'haldi': 'மஞ்சள் நீர்',
};

// Vowels (உயிர் எழுத்துக்கள்)
export const TAMIL_VOWELS = [
  'அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ', 'ஃ'
];

// Consonants (மெய் எழுத்துக்கள் - basic form without pulli for UI display)
export const TAMIL_CONSONANTS = [
  { letter: 'க', name: 'ka' },
  { letter: 'ங', name: 'nga' },
  { letter: 'ச', name: 'sa' },
  { letter: 'ஞ', name: 'nya' },
  { letter: 'ட', name: 'ta' },
  { letter: 'ண', name: 'nna' },
  { letter: 'த', name: 'tha' },
  { letter: 'ந', name: 'na' },
  { letter: 'ப', name: 'pa' },
  { letter: 'ம', name: 'ma' },
  { letter: 'ய', name: 'ya' },
  { letter: 'ர', name: 'ra' },
  { letter: 'ல', name: 'la' },
  { letter: 'வ', name: 'va' },
  { letter: 'ழ', name: 'zha' },
  { letter: 'ள', name: 'lla' },
  { letter: 'ற', name: 'rra' },
  { letter: 'ன', name: 'nna2' },
];

// Grantha letters (வடமொழி எழுத்துக்கள்)
export const TAMIL_GRANTHA = [
  { letter: 'ஜ', name: 'ja' },
  { letter: 'ஷ', name: 'sha' },
  { letter: 'ஸ', name: 'sa' },
  { letter: 'ஹ', name: 'ha' },
  { letter: 'க்ஷ', name: 'ksha' },
  { letter: 'ஶ்ரீ', name: 'sri' },
];

// Diacritics / Matras (உயிர்மெய் குறியீடுகள்)
export const TAMIL_DIACRITICS = [
  { char: '்', label: '் (புள்ளி)' },
  { char: 'ா', label: 'ா (நெடில்)' },
  { char: 'ி', label: 'ி (இ)' },
  { char: 'ீ', label: 'ீ (ஈ)' },
  { char: 'ு', label: 'ு (உ)' },
  { char: 'ூ', label: 'ூ (ஊ)' },
  { char: 'ெ', label: 'ெ (எ)' },
  { char: 'ே', label: 'ே (ஏ)' },
  { char: 'ை', label: 'ை (ஐ)' },
  { char: 'ொ', label: 'ொ (ஒ)' },
  { char: 'ோ', label: 'ோ (ஓ)' },
  { char: 'ௌ', label: 'ௌ (ஔ)' },
];

// Tamil Numerals
export const TAMIL_NUMERALS = [
  { tamil: '௧', arabic: '1' },
  { tamil: '௨', arabic: '2' },
  { tamil: '௩', arabic: '3' },
  { tamil: '௪', arabic: '4' },
  { tamil: '௫', arabic: '5' },
  { tamil: '௬', arabic: '6' },
  { tamil: '௭', arabic: '7' },
  { tamil: '௮', arabic: '8' },
  { tamil: '௯', arabic: '9' },
  { tamil: '௦', arabic: '0' },
];

/**
 * Phonetically transliterates Tanglish text to Tamil
 */
export function transliterateToTamil(input: string): string {
  if (!input) return '';
  const lower = input.toLowerCase().trim();

  // 1. Direct dictionary match
  if (TAMIL_EXPENSE_KEYWORDS[lower]) {
    return TAMIL_EXPENSE_KEYWORDS[lower];
  }

  // Check each word in multi-word string
  const words = input.split(/(\s+)/);
  const convertedWords = words.map(w => {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
    if (TAMIL_EXPENSE_KEYWORDS[cleanWord]) {
      return TAMIL_EXPENSE_KEYWORDS[cleanWord];
    }
    return w;
  });

  return convertedWords.join('');
}
