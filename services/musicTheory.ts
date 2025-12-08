import { HarmonicKey, HarmonicKeyQuality } from '../types';

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Map degrees (Roman and Numeric) to semitone offsets from root
const DEGREE_OFFSET: Record<string, number> = {
    // Roman
    'I': 0, 'i': 0,
    'bII': 1, 'bii': 1,
    'II': 2, 'ii': 2,
    'bIII': 3, 'biii': 3,
    'III': 4, 'iii': 4,
    'IV': 5, 'iv': 5,
    '#IV': 6, '#iv': 6, 'bV': 6, 'bv': 6,
    'V': 7, 'v': 7,
    'bVI': 8, 'bvi': 8,
    'VI': 9, 'vi': 9,
    'bVII': 10, 'bvii': 10,
    'VII': 11, 'vii': 11,
    // Numeric (for bass lines like /b7)
    '1': 0,
    'b2': 1, '2': 2, '#2': 3,
    'b3': 3, '3': 4,
    '4': 5, '#4': 6, 'b5': 6,
    '5': 7, '#5': 8, 'b6': 8,
    '6': 9, 'bb7': 9,
    'b7': 10, '7': 11, 'maj7': 11
};

// Keys that MUST use flats to be theoretically correct
const KEYS_WITH_FLATS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm'];

export const ALL_KEYS: HarmonicKey[] = [
    { root: 'C', quality: 'Major' }, 
    { root: 'G', quality: 'Major' }, 
    { root: 'D', quality: 'Major' }, 
    { root: 'A', quality: 'Major' }, 
    { root: 'E', quality: 'Major' }, 
    { root: 'B', quality: 'Major' }, 
    { root: 'F#', quality: 'Major' }, 
    { root: 'Db', quality: 'Major' }, 
    { root: 'Ab', quality: 'Major' }, 
    { root: 'Eb', quality: 'Major' }, 
    { root: 'Bb', quality: 'Major' }, 
    { root: 'F', quality: 'Major' },
    
    { root: 'A', quality: 'Minor' },
    { root: 'E', quality: 'Minor' },
    { root: 'B', quality: 'Minor' },
    { root: 'F#', quality: 'Minor' },
    { root: 'C#', quality: 'Minor' },
    { root: 'G#', quality: 'Minor' },
    { root: 'Eb', quality: 'Minor' },
    { root: 'Bb', quality: 'Minor' },
    { root: 'F', quality: 'Minor' },
    { root: 'C', quality: 'Minor' },
    { root: 'G', quality: 'Minor' },
    { root: 'D', quality: 'Minor' },
];

const getRootFromDegree = (degree: string, key: HarmonicKey): string => {
    // 1. Determine Scale
    const useFlats = KEYS_WITH_FLATS.includes(key.root);
    const refScale = useFlats ? NOTES_FLAT : NOTES_SHARP;

    // 2. Find Key Root Index
    // Be robust: Check both arrays in case key.root format mismatches strict array content
    let keyRootIndex = NOTES_SHARP.indexOf(key.root);
    if (keyRootIndex === -1) keyRootIndex = NOTES_FLAT.indexOf(key.root);
    if (keyRootIndex === -1) return "?";

    // 3. Parse Degree (Accidental + Numeral/Number)
    // Regex matches optional accidental (b, #) and then the rest (Roman or Number)
    const regex = /^([b#]?)(.+)$/;
    const match = degree.match(regex);
    if (!match) return degree;

    const accidental = match[1];
    const core = match[2];

    // Lookup offset (case insensitive for Roman)
    let offset = DEGREE_OFFSET[core] ?? DEGREE_OFFSET[core.toUpperCase()];
    
    // If not found, it might be a literal number (e.g. just "7" for b7 implies 7th degree?)
    // But DEGREE_OFFSET covers standard 1-7.
    if (offset === undefined) return degree;

    // Apply accidental from string prefix
    if (accidental === 'b') offset -= 1;
    if (accidental === '#') offset += 1;

    // 4. Calculate Note
    let noteIndex = (keyRootIndex + offset) % 12;
    if (noteIndex < 0) noteIndex += 12;

    return refScale[noteIndex];
};

/**
 * Parses a Roman Numeral string (e.g., "viiø7/V" or "bVImaj7")
 * and calculates the actual Chord Name based on the Key.
 */
export const transposeRomanToChord = (roman: string, key: HarmonicKey): string => {
    // --- 1. HANDLE SLASH CHORDS (Recursion) ---
    if (roman.includes('/')) {
        const [chordPart, bassPart] = roman.split('/');
        
        // Transpose the main chord
        const transposedChord = transposeRomanToChord(chordPart, key);
        
        // Transpose the bass note
        // Bass can be Roman (V) or Numeric (b7)
        // We only want the NOTE name for the bass, no quality.
        let transposedBass = getRootFromDegree(bassPart, key);

        return `${transposedChord}/${transposedBass}`;
    }

    // --- 2. PARSE ROMAN NUMERAL ---
    // Regex: Group 1 (Accidental), Group 2 (Roman), Group 3 (Extension)
    // CRITICAL: VII must come before VI, III before II, etc. to match longest string first
    const regex = /^([b#]?)(VII|vii|III|iii|IV|iv|VI|vi|II|ii|I|i|V|v)(.*)$/i;
    const match = roman.match(regex);

    if (!match) return roman; // Fallback if format is weird

    const fullRomanDegree = match[1] + match[2]; // e.g. "bVI"
    const extension = match[3];

    // Get Root Note
    const rootNote = getRootFromDegree(fullRomanDegree, key);

    // Determine Quality (Minor/Major)
    const numeral = match[2];
    const isMinor = numeral.toLowerCase() === numeral;
    
    let qualitySuffix = '';
    
    if (isMinor) {
        // Add 'm' unless the extension already implies diminished or half-diminished
        // or if it's a major 7th on a minor chord (mM7)
        if (!extension.includes('dim') && !extension.includes('ø') && !extension.startsWith('maj')) {
            qualitySuffix = 'm';
        }
    }

    return `${rootNote}${qualitySuffix}${extension}`;
};

export const getRandomKey = (quality: HarmonicKeyQuality = 'Major'): HarmonicKey => {
    // Filter keys by quality (Major/Minor)
    const candidates = ALL_KEYS.filter(k => k.quality === quality);
    return candidates[Math.floor(Math.random() * candidates.length)];
};