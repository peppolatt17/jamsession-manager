// FORCED_UPDATE_BY_USER_REQUEST_TIMESTAMP_1741084200000
import React, { useState, useEffect } from 'react';
import { HarmonicProgression, HarmonicKey } from '../types';
import { HARMONIC_PROGRESSIONS } from '../constants';
import { getRandomKey, transposeRomanToChord } from '../services/musicTheory';
import { Shuffle, Eye, EyeOff, Music, ArrowRightLeft, Lock, ChevronDown, Play, Pause, RotateCcw } from 'lucide-react';

interface HarmonicRouletteProps {
    onExit: () => void;
    timeLeft?: number;
    setTimeLeft?: React.Dispatch<React.SetStateAction<number>>;
    isRunning?: boolean;
    setIsRunning?: React.Dispatch<React.SetStateAction<boolean>>;
}

type TheoryState = 'VISIBLE' | 'DIMMED' | 'HIDDEN';

export const HarmonicRouletteFixed: React.FC<HarmonicRouletteProps> = ({ 
    onExit, 
    timeLeft, 
    setTimeLeft, 
    isRunning, 
    setIsRunning 
}) => {
    const [progression, setProgression] = useState<HarmonicProgression>(HARMONIC_PROGRESSIONS[0]);
    const [currentKey, setCurrentKey] = useState<HarmonicKey>({ root: 'C', quality: 'Major' });
    const [section, setSection] = useState<'A' | 'B'>('A');
    const [theoryState, setTheoryState] = useState<TheoryState>('VISIBLE');
    const [isShuffling, setIsShuffling] = useState(false);

    // Initial Randomizer
    useEffect(() => {
        handleRandomizeAll();
    }, []);

    const handleRandomizeAll = () => {
        const randomProg = HARMONIC_PROGRESSIONS[Math.floor(Math.random() * HARMONIC_PROGRESSIONS.length)];
        setProgression(randomProg);
        setCurrentKey(getRandomKey(randomProg.tonality));
        setSection('A');
        triggerShuffleAnim();
    };

    const handleShuffleKey = () => {
        setCurrentKey(getRandomKey(progression.tonality));
        triggerShuffleAnim();
    };

    const handleProgressionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedProg = HARMONIC_PROGRESSIONS.find(p => p.id === selectedId);
        if (selectedProg) {
            setProgression(selectedProg);
            setCurrentKey(getRandomKey(selectedProg.tonality));
            setSection('A');
            triggerShuffleAnim();
        }
    };

    const triggerShuffleAnim = () => {
        setIsShuffling(true);
        setTimeout(() => setIsShuffling(false), 500);
    };

    const toggleTheoryState = () => {
        setTheoryState(prev => {
            if (prev === 'VISIBLE') return 'DIMMED';
            if (prev === 'DIMMED') return 'HIDDEN';
            return 'VISIBLE';
        });
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAdjustTime = (delta: number) => {
        if (setTimeLeft) {
            setTimeLeft(prev => Math.max(0, prev + delta));
        }
    };

    const activeBars = section === 'A' ? progression.structure.A : progression.structure.B;
    const barsToDisplay = activeBars || [];

    // Blues Lockout Logic
    const isBlues = progression.id === 'prog_14';
    const isSectionBDisabled = isBlues;

    // --- GRID LAYOUT ENGINE ---
    const totalBars = barsToDisplay.length;
    let gridClass = 'grid-cols-4'; 
    let squareClass = 'aspect-square'; // Default perfect square
    let containerMaxWidth = 'max-w-[95vw]';

    // Extreme Density (e.g. Pachelbel with 8 bars but 2 chords each = 16 items effectively)
    // Or specifically long bar counts like 16 bars
    if (totalBars >= 16) {
        gridClass = 'grid-cols-8';
        squareClass = 'h-24 md:h-28 w-full'; // Force small height
    } else if (totalBars > 8) {
        // High Density (e.g. Blues 12 bars)
        gridClass = 'grid-cols-6';
    } else if (totalBars <= 4) {
        // Low Density (e.g. 4 chords) -> Standard grid behavior
        gridClass = 'grid-cols-2 md:grid-cols-4';
        containerMaxWidth = 'max-w-[80vw]';
    }

    // --- SMART FONT SIZING ENGINE ---
    const getSmartFontSize = (text: string, isSplitContext: boolean) => {
        // Check context: if we are in "Extreme Density" mode, fonts must be small
        if (totalBars >= 16) {
             return 'text-xl md:text-2xl font-bold';
        }

        const len = text.length;
        // Split Bar Context (Half Square)
        if (isSplitContext) {
            if (len >= 6) return 'text-[2.5vw] md:text-[1.8vw]';
            if (len >= 5) return 'text-[3vw] md:text-[2.2vw]';
            if (len >= 4) return 'text-[3.5vw] md:text-[2.8vw]'; 
            return 'text-[4.5vw] md:text-[3.5vw]'; 
        }
        
        // Full Square Context
        // Aggressively reduced based on visual feedback for long chords
        if (len >= 7) return 'text-[5vw] md:text-[3.5vw]'; // e.g. C#m7(b5)
        if (len >= 6) return 'text-[5.5vw] md:text-[4vw]'; // e.g. Dbmaj7
        if (len >= 5) return 'text-[7vw] md:text-[5vw]'; // e.g. G#m7b
        if (len >= 4) return 'text-[8.5vw] md:text-[6.5vw]'; // e.g. C#m7, Ebm7
        
        // Standard 1-3 chars (A, Em, C#m) -> Uniform Size
        // Reduced from 13vw to ensure wider 3-char chords fit comfortably
        return 'text-[10.5vw] md:text-[8vw]';
    };

    // --- RENDERERS ---

    const renderChordContent = (text: string, originalRoman: string, isSplitContext: boolean) => {
        const isSlash = text.includes('/');
        const isDimmed = theoryState === 'DIMMED';
        const isHidden = theoryState === 'HIDDEN';
        
        // Enhanced Blur for Dimmed State
        const visibilityClass = `
            transition-all duration-500 font-black tracking-tighter leading-none select-none
            ${isDimmed ? 'blur-md opacity-30' : 'opacity-100 blur-0'}
            ${isHidden ? 'text-cyan-400' : 'text-white'}
        `;

        // Case 1: Slash Chord (Diagonal Layout)
        if (isSlash) {
            const [root, bass] = text.split('/');
            
            // Helper to get font size based on text length, optimizing for tablets vs desktop
            const getSlashFontSize = (str: string, isSplit: boolean) => {
                const l = str.length;
                if (isSplit) {
                    // Half-square context: keep conservative sizes to avoid diagonal collision
                    if (l >= 4) return 'text-sm md:text-base lg:text-3xl';
                    if (l >= 3) return 'text-base md:text-lg lg:text-4xl';
                    return 'text-lg md:text-xl lg:text-5xl';
                } else {
                    // Full square with slash diagonal: use viewport-based sizes to avoid
                    // large jumps at 1280px (xl breakpoint) that caused overlap.
                    // These values scale smoothly and cap overall size.
                    if (l >= 5) return 'text-[4.4vw] md:text-[3.6vw]';
                    if (l >= 4) return 'text-[5.0vw] md:text-[4.0vw]';
                    if (l >= 3) return 'text-[5.8vw] md:text-[4.6vw]';
                    // Short text (e.g., C, D, Db)
                    return 'text-[6.6vw] md:text-[5.2vw]';
                }
            };

            const slashRootFont = getSlashFontSize(root, isSplitContext);
            const slashBassFont = getSlashFontSize(bass, isSplitContext);

            return (
                <div className="relative w-full h-full overflow-hidden">
                    {/* Top Left: Root - Moved towards corners to prevent diagonal collision */}
                    <div className={`absolute top-3 left-3 md:top-4 md:left-5 lg:top-6 lg:left-8 xl:top-7 xl:left-10 ${visibilityClass} ${slashRootFont}`}>
                        {root}
                    </div>
                    
                    {/* Diagonal Separator */}
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${isDimmed ? 'opacity-10' : 'opacity-40'}`}>
                        <div className="w-[140%] h-[4px] bg-slate-500 -rotate-[35deg] transform origin-center rounded-full"></div>
                    </div>

                    {/* Bottom Right: Bass - Moved towards corners to prevent diagonal collision */}
                    <div className={`absolute bottom-3 right-3 md:bottom-4 md:right-5 lg:bottom-6 lg:right-8 xl:bottom-7 xl:right-10 ${visibilityClass} ${slashBassFont} text-right`}>
                        {bass}
                    </div>

                    {/* Small Roman Label (Bottom Left) */}
                    {theoryState !== 'HIDDEN' && (
                        <div className="absolute bottom-2 left-3 font-bold text-cyan-600 font-mono text-xs md:text-lg opacity-80 z-20 bg-slate-900/80 px-1.5 py-0.5 rounded">
                            {originalRoman}
                        </div>
                    )}
                </div>
            );
        }

        // Case 2: Standard Chord (Centered)
        const smartFont = getSmartFontSize(text, isSplitContext);
        return (
            <div className="relative w-full h-full flex items-center justify-center">
                <div className={`${visibilityClass} ${smartFont} text-center transform scale-y-110`}>
                    {text}
                </div>

                {/* Small Roman Label */}
                {theoryState !== 'HIDDEN' && (
                    <div className="absolute bottom-2 left-0 right-0 text-center font-bold text-cyan-600 font-mono text-xs md:text-lg opacity-80">
                        {originalRoman}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col text-white overflow-hidden font-sans">
            {/* HEADER */}
            <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center shadow-lg z-10 shrink-0 h-20">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* SONG SELECTOR DROPDOWN */}
                    <div className="relative max-w-md w-full">
                        <select 
                            value={progression.id} 
                            onChange={handleProgressionChange}
                            className="w-full appearance-none bg-slate-800 border border-slate-700 text-white font-black text-xl md:text-2xl py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase tracking-tight truncate cursor-pointer hover:bg-slate-700 transition"
                        >
                            {HARMONIC_PROGRESSIONS.map(p => (
                                <option key={p.id} value={p.id} className="text-base font-sans normal-case bg-slate-900">
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                            <ChevronDown className="w-5 h-5" />
                        </div>
                    </div>

                    <span className="hidden md:flex text-slate-400 text-xs md:text-sm font-medium items-center gap-2 truncate border-l border-slate-700 pl-4 h-10">
                        <Music className="w-4 h-4 text-cyan-500" /> {progression.mood}
                    </span>
                </div>
                
                <button 
                    onClick={onExit}
                    className="ml-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 md:px-6 py-2 rounded-lg font-bold transition text-sm md:text-base whitespace-nowrap"
                >
                    ESCI
                </button>
            </div>

            {/* MAIN GRID */}
            <div className="flex-1 p-2 md:p-4 relative flex items-center justify-center overflow-y-auto overflow-x-hidden">
                <div className={`grid ${gridClass} gap-2 md:gap-4 w-full ${containerMaxWidth} auto-rows-fr`}>
                    {barsToDisplay.map((bar, idx) => {
                        const roman1 = bar[0];
                        const chord1 = transposeRomanToChord(roman1, currentKey);
                        
                        const roman2 = bar[1] || null;
                        const chord2 = roman2 ? transposeRomanToChord(roman2, currentKey) : null;

                        // Logic: If HIDDEN, show Roman as main text. If VISIBLE/DIMMED, show Chord as main text.
                        const text1 = theoryState === 'HIDDEN' ? roman1 : chord1;
                        const text2 = theoryState === 'HIDDEN' ? roman2 : chord2;

                        return (
                            <div 
                                key={idx} 
                                className={`${squareClass} bg-slate-900 border-2 border-slate-700 rounded-2xl md:rounded-3xl flex flex-col relative overflow-hidden shadow-2xl transition-all duration-500 ${isShuffling ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}
                            >
                                {/* Bar Number */}
                                <span className="absolute top-2 left-2 text-slate-700 font-mono text-sm md:text-xl font-black z-0 select-none pointer-events-none">
                                    {idx + 1}
                                </span>

                                {bar.length === 1 ? (
                                    // SINGLE CHORD
                                    renderChordContent(text1, roman1, false)
                                ) : (
                                    // SPLIT BAR (2 CHORDS)
                                    <div className="absolute inset-0 flex flex-col">
                                         {/* Top Half */}
                                         <div className="flex-1 border-b border-slate-700 bg-slate-800/20 relative">
                                             {renderChordContent(text1, roman1, true)}
                                         </div>
                                         
                                         {/* Bottom Half */}
                                         <div className="flex-1 bg-slate-900 relative">
                                             {renderChordContent(text2, roman2!, true)}
                                         </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FOOTER CONTROLS */}
            <div className="bg-slate-900 p-2 md:p-4 border-t border-slate-800 flex flex-col md:grid md:grid-cols-3 items-center gap-4 shrink-0">
                
                {/* LEFT GROUP: Timer & Controls (uniform) */}
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto justify-start">
                    {timeLeft !== undefined && setTimeLeft && setIsRunning && (
                        <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                            <div className="text-left pl-2">
                                <span className="block text-[9px] uppercase font-bold text-white tracking-widest">JAM TIMER</span>
                                <div className={`text-3xl md:text-4xl font-black tabular-nums leading-none ${timeLeft < 30 && timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                    {formatTime(timeLeft)}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setIsRunning(!isRunning)} 
                                    className={`p-2 rounded-full text-white transition hover:scale-110 ${isRunning ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'}`}
                                >
                                    {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                </button>
                                <div className="flex flex-col gap-1">
                                    <div className="flex gap-1">
                                        <button onClick={() => handleAdjustTime(60)} className="bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-bold text-white w-8 text-center">+1m</button>
                                        <button onClick={() => handleAdjustTime(30)} className="bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-bold text-white w-8 text-center">+30s</button>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleAdjustTime(-60)} className="bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-bold text-white w-8 text-center">-1m</button>
                                        <button onClick={() => handleAdjustTime(-30)} className="bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-bold text-white w-8 text-center">-30s</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* CENTER GROUP: A/B Toggle */}
                <div className="flex justify-center w-full md:w-auto">
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner w-full md:w-auto">
                        <button 
                            onClick={() => setSection('A')}
                            className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg font-black text-sm md:text-xl transition-all ${section === 'A' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            SEZIONE A
                        </button>
                        <button 
                            onClick={() => !isSectionBDisabled && setSection('B')}
                            disabled={isSectionBDisabled}
                            className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg font-black text-sm md:text-xl transition-all flex items-center justify-center gap-2 ${section === 'B' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'} ${isSectionBDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                            SEZIONE B
                            {isSectionBDisabled && <Lock className="w-3 h-3 md:w-4 md:h-4" />}
                        </button>
                    </div>
                </div>

                {/* RIGHT GROUP: Actions */}
                <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end">
                    
                    {/* KEY CONTROLS */}
                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                        <button 
                            onClick={handleShuffleKey}
                            className="flex flex-col items-center justify-center px-3 py-2 hover:bg-slate-700 rounded-lg transition group"
                            title="Random Key"
                        >
                            <Shuffle className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 mb-1 group-hover:rotate-180 transition-transform duration-500" />
                            <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider">Key</span>
                        </button>

                        <div className="h-6 md:h-8 w-px bg-slate-700 mx-1"></div>

                        <select
                            value={
                              ['C#', 'Db'].includes(currentKey.root) ? 'Db' :
                              ['D#', 'Eb'].includes(currentKey.root) ? 'Eb' :
                              ['F#', 'Gb'].includes(currentKey.root) ? 'F#' :
                              ['G#', 'Ab'].includes(currentKey.root) ? 'Ab' :
                              ['A#', 'Bb'].includes(currentKey.root) ? 'Bb' :
                              currentKey.root
                            }
                            onChange={(e) => {
                                const val = e.target.value;
                                setCurrentKey(prev => ({ ...prev, root: val }));
                                triggerShuffleAnim();
                            }}
                            className="bg-slate-900 text-white text-xs md:text-sm font-bold py-2 px-1 rounded border border-slate-600 focus:outline-none focus:border-cyan-500 w-16 md:w-20 text-center appearance-none cursor-pointer hover:bg-slate-800"
                        >
                             <option value="C">C</option>
                             <option value="Db">C# / Db</option>
                             <option value="D">D</option>
                             <option value="Eb">D# / Eb</option>
                             <option value="E">E</option>
                             <option value="F">F</option>
                             <option value="F#">F# / Gb</option>
                             <option value="G">G</option>
                             <option value="Ab">G# / Ab</option>
                             <option value="A">A</option>
                             <option value="Bb">A# / Bb</option>
                             <option value="B">B</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleRandomizeAll}
                        className="flex-1 md:flex-none flex flex-col items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition group min-w-[60px] md:min-w-[80px]"
                    >
                        <ArrowRightLeft className="w-4 h-4 md:w-5 md:h-5 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider">Brano</span>
                    </button>

                    <button 
                        onClick={toggleTheoryState}
                        className={`flex-2 md:flex-none flex flex-col items-center justify-center px-4 py-2 border rounded-xl transition min-w-[100px] md:min-w-[140px] ${theoryState !== 'VISIBLE' ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                    >
                        {theoryState === 'VISIBLE' && <Eye className="w-4 h-4 md:w-5 md:h-5 text-slate-300 mb-1" />}
                        {theoryState === 'DIMMED' && <EyeOff className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 mb-1" />}
                        {theoryState === 'HIDDEN' && <Lock className="w-4 h-4 md:w-5 md:h-5 text-red-500 mb-1" />}
                        
                        <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-wider ${theoryState !== 'VISIBLE' ? 'text-yellow-500' : 'text-slate-400'}`}>
                            {theoryState === 'VISIBLE' && 'MODO: VISIBILE'}
                            {theoryState === 'DIMMED' && 'MODO: OSCURATO'}
                            {theoryState === 'HIDDEN' && 'MODO: SOLO GRADI'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
