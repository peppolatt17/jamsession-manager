export type ViewState = 'HOME' | 'REGISTER' | 'ADMIN' | 'PROJECTOR';

export enum InstrumentType {
  VOICE = 'VOCE',
  GUITAR = 'CHITARRA',
  BASS = 'BASSO',
  DRUMS = 'BATTERIA',
  KEYS = 'TASTIERA',
  OTHER = 'ALTRO'
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  instruments: InstrumentType[];
  customInstrument?: string;
  email?: string;
  phoneNumber?: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  createdAt: number;
  status: 'ACTIVE' | 'PAUSED';
  avatarSeed?: string;
  assignedRole?: InstrumentType;
  endTime?: string; // Used for archived bands member tracking
}

export interface Band {
  id: string;
  name: string;
  members: User[];
  isManual: boolean;
  durationMinutes: number;
  endTime?: string;
  playedGames?: string[];
}

export interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

// --- HARMONIC ROULETTE TYPES ---

export type HarmonicKeyQuality = 'Major' | 'Minor';

export interface HarmonicKey {
    root: string;
    quality: HarmonicKeyQuality;
}

export interface HarmonicProgression {
    id: string;
    name: string;
    mood: string;
    tonality: HarmonicKeyQuality; // 'Major' or 'Minor' context
    structure: {
        A: string[][]; // Array of Bars. Each bar is an array of Roman Numerals (1 or 2 items)
        B: string[][];
    };
}