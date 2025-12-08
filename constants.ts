import { InstrumentType, Game, HarmonicProgression } from './types';

export const INSTRUMENTS = [
  { type: InstrumentType.VOICE, label: 'Voce', icon: 'mic' },
  { type: InstrumentType.GUITAR, label: 'Chitarra', icon: 'guitar' },
  { type: InstrumentType.BASS, label: 'Basso', icon: 'guitar' },
  { type: InstrumentType.DRUMS, label: 'Batteria', icon: 'drum' },
  { type: InstrumentType.KEYS, label: 'Tastiera', icon: 'piano' },
  { type: InstrumentType.OTHER, label: 'Altro', icon: 'more' },
];

export const AVATAR_OPTIONS = [
  { id: 'av-1', seed: 'local:custom1', label: 'Custom 1' },
  { id: 'av-2', seed: 'local:custom2', label: 'Custom 2' },
  { id: 'av-3', seed: 'local:custom3', label: 'Custom 3' },
  { id: 'av-4', seed: 'local:custom4', label: 'Custom 4' },
  { id: 'av-5', seed: 'local:custom5', label: 'Custom 5' },
  { id: 'av-6', seed: 'local:custom6', label: 'Custom 6' },
  { id: 'av-7', seed: 'local:custom7', label: 'Custom 7' },
  { id: 'av-8', seed: 'local:custom8', label: 'Custom 8' },
  { id: 'av-9', seed: 'local:custom9', label: 'Custom 9' },
  { id: 'av-10', seed: 'local:custom10', label: 'Custom 10' },
  { id: 'av-11', seed: 'local:custom11', label: 'Custom 11' },
  { id: 'av-12', seed: 'local:custom12', label: 'Custom 12' },
];

export const BAND_NAMES = [
  "La Corazzata Pentatonica",
  "O Famo in Do?",
  "Supercazzola in Si Bemolle",
  "Ajeje Bandzorf",
  "Non ci resta che Plettrare",
  "Vieni avanti col Solo",
  "Febbre da Palco",
  "Attila Flagello del Jazz",
  "Totò, Peppino e la Melodia",
  "I Ragazzi della 3ª Corda",
  "A Qualcuno Piace Calante",
  "Frankensuon Junior",
  "The Blues Blathers",
  "Scemo & Più Stonato",
  "Monty Plettro",
  "Full Metal Jazz",
  "Ritorno al Ritornello",
  "Pulp Fiction & Tonic",
  "Forrest Funk",
  "Le Iene Ridens",
  "Aspettando il Bassista",
  "Molto Rumore per Nulla",
  "L'Importanza di essere Accordati",
  "Buona la Prima (Magari)",
  "I Soliti Accordi",
  "Accordi e Disaccordi",
  "Il Malato Immaginario del Rock",
  "Tutto quello che avreste voluto sapere sul Jazz",
  "Rumori Fuori Scena",
  "Birra Gratis"
];

export const GAMES: Game[] = [
  {
    id: 'game-hand',
    title: 'UNA MANO SOLA',
    description: 'Tutti i musicisti devono suonare utilizzando esclusivamente una mano (sinistra o destra a scelta).',
    icon: 'hand',
    color: 'from-pink-600 to-rose-600'
  },
  {
    id: 'game-foot',
    title: 'SU UN PIEDE SOLO',
    description: 'Bisogna suonare rimanendo in equilibrio su una gamba sola. Se tocchi terra, smetti di suonare per 5 secondi!',
    icon: 'footprints',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'game-swap',
    title: 'ROULETTE STRUMENTI',
    description: 'Scambio di ruoli! I musicisti devono scambiarsi gli strumenti. Il batterista canta? Il chitarrista al basso? Buona fortuna!',
    icon: 'shuffle',
    color: 'from-violet-600 to-fuchsia-600'
  },
  {
    id: 'game-harmonic',
    title: 'ROULETTE ARMONICA',
    description: 'Generatore di progressioni armoniche in tempo reale. Mettete alla prova il vostro orecchio e la vostra capacità di trasposizione!',
    icon: 'music',
    color: 'from-cyan-600 to-blue-600'
  }
];

export const HARMONIC_PROGRESSIONS: HarmonicProgression[] = [
    {
        id: 'prog_01',
        name: 'The Axis of Awesome',
        mood: 'Pop Standard / Epic',
        tonality: 'Major',
        structure: {
            A: [['I'], ['V'], ['vi'], ['IV']],
            B: [['vi'], ['IV'], ['V'], ['V7']]
        }
    },
    {
        id: 'prog_02',
        name: 'The Sensitive',
        mood: 'Pop Moderno / Emotional',
        tonality: 'Major',
        structure: {
            A: [['vi'], ['IV'], ['I'], ['V']],
            B: [['I'], ['V'], ['vi'], ['IV']]
        }
    },
    {
        id: 'prog_03',
        name: 'The Doo-Wop',
        mood: 'Anni 50 / Nostalgia',
        tonality: 'Major',
        structure: {
            A: [['I'], ['vi'], ['IV'], ['V']],
            B: [['IV'], ['iv'], ['I'], ['I7']]
        }
    },
    {
        id: 'prog_05',
        name: 'Anthemic Rock',
        mood: 'Mixolydian / Arena Rock',
        tonality: 'Major',
        structure: {
            A: [['I'], ['bVII'], ['IV'], ['IV']],
            B: [['IV'], ['V'], ['vi'], ['V']]
        }
    },
    {
        id: 'prog_06',
        name: 'The Power Trip',
        mood: 'Epica / Cinematografica',
        tonality: 'Major',
        structure: {
            A: [['I'], ['bIII'], ['IV'], ['bIII']],
            B: [['IV'], ['V'], ['I'], ['I7']]
        }
    },
    {
        id: 'prog_07',
        name: 'Andalusian Cadence',
        mood: 'Flamenco / Dire Straits',
        tonality: 'Minor',
        structure: {
            A: [['i'], ['bVII'], ['bVI'], ['V7']],
            B: [['bIII'], ['bVII'], ['i'], ['bVII']]
        }
    },
    {
        id: 'prog_08',
        name: 'Royal Road',
        mood: 'J-Pop / Anime',
        tonality: 'Major',
        structure: {
            A: [['IVmaj7'], ['V7'], ['iii7'], ['vi7']],
            B: [['Imaj7'], ['vi7'], ['ii7'], ['V7']]
        }
    },
    {
        id: 'prog_09',
        name: 'The Tearjerker',
        mood: 'Basso Discendente / Ballad',
        tonality: 'Major',
        structure: {
            A: [['I'], ['I7/b7'], ['IV'], ['iv']],
            B: [['vi'], ['iii'], ['IV'], ['V']]
        }
    },
    {
        id: 'prog_10',
        name: 'Classic Jazz',
        mood: 'II-V-I Standard',
        tonality: 'Major',
        structure: {
            A: [['ii7'], ['V7'], ['Imaj7'], ['Imaj7']],
            B: [['III7'], ['VI7'], ['II7'], ['V7']]
        }
    },
    {
        id: 'prog_12',
        name: 'Neo-Soul Vibe',
        mood: 'Pedale al Basso / Chill',
        tonality: 'Major',
        structure: {
            A: [['I'], ['IV/I'], ['V/I'], ['I']],
            B: [['vi9'], ['ii9'], ['V13'], ['Imaj9']]
        }
    },
    {
        id: 'prog_13',
        name: 'Epic Adventure',
        mood: 'Folk / Fantasy',
        tonality: 'Minor',
        structure: {
            A: [['i'], ['III'], ['iv'], ['v']],
            B: [['bIII'], ['bVII'], ['i'], ['bVI']]
        }
    },
    {
        id: 'prog_14',
        name: '12-Bar Blues',
        mood: 'Traditional Blues',
        tonality: 'Major',
        structure: {
            A: [['I7'], ['IV7'], ['I7'], ['I7'], ['IV7'], ['IV7'], ['I7'], ['I7'], ['V7'], ['IV7'], ['I7'], ['V7']],
            B: [['IV7'], ['I7'], ['bVI7'], ['V7']]
        }
    },
    {
        id: 'prog_15',
        name: 'Jazz Minor',
        mood: 'Noir / Moody',
        tonality: 'Minor',
        structure: {
            A: [['i'], ['VI'], ['iiø7'], ['V7alt']],
            B: [['bIIImaj7'], ['iv7'], ['bVII7'], ['bIIImaj7']]
        }
    }
];
