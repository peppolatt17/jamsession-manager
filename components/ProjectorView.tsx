// FORCED_UPDATE_BY_USER_REQUEST_TIMESTAMP_1741084200000
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, User, Band, InstrumentType, Game } from '../types';
import { getAvatarUrl } from '../utils/avatar';
import { toWhatsAppUrl } from '../utils/phone';
import { GAMES } from '../constants';
import { HarmonicRouletteFixed } from './HarmonicRoulette';
import { ArrowLeft, Play, Pause, RotateCcw, SkipForward, Check, X as XIcon, Plus, UserPlus, Search, Edit3, Trash2, Gamepad2, Hand, Footprints, Info, PlayCircle, Clock, Timer, Maximize2, Minimize2, Shuffle, Loader, Music, Mic, Guitar, Drum, Piano, MoreHorizontal, Mail, Phone, Instagram, Facebook, Twitter, ExternalLink, MessageCircle } from 'lucide-react';
import { toSocialUrl, normalizeHandle } from '../utils/social';
import { useTabletMode } from '../hooks/useTabletMode';

interface ProjectorViewProps {
  bands: Band[];
  pastBands: Band[];
  allUsers: User[];
  setViewState: (view: ViewState) => void;
  onNextBand: (playedGames: string[]) => void;
  onAddMember: (user: User, role: InstrumentType) => void;
  onRemoveMember: (userId: string) => void;
  onUpdateBandName: (bandId: string, newName: string) => void;
  // Global Timer Props
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({ 
    bands, 
    pastBands,
    allUsers, 
    setViewState, 
    onNextBand, 
    onAddMember, 
    onRemoveMember, 
    onUpdateBandName,
    timeLeft,
    setTimeLeft,
    isRunning,
    setIsRunning
}) => {
  const currentBand = bands.length > 0 ? bands[0] : null;
  const nextBand = bands.length > 1 ? bands[1] : null;
  const isTablet = useTabletMode();
  // Determine a shared font size for the next band list so long names don't wrap
  const nextNameMaxLen = nextBand ? Math.max(
    ...nextBand.members.map(m => `${m.firstName} ${m.lastName}`.length)
  ) : 0;
  const nextListFontClass = nextNameMaxLen >= 22
    ? 'text-base'
    : nextNameMaxLen >= 16
      ? 'text-lg'
      : 'text-xl';
  
  // Local UI State (Not needing persistence across views)
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [confirmNext, setConfirmNext] = useState(false);

  // Transition State for Slot Machine Effect
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMembers, setTransitionMembers] = useState<User[]>([]);

  // Session Games Tracking
  const [sessionGames, setSessionGames] = useState<string[]>([]);

  // Add Member Modal State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<User | null>(null);

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Edit Timer State
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [tempTimerString, setTempTimerString] = useState('');
  const timerInputRef = useRef<HTMLInputElement>(null);

  // Viewer for full user details (same modal style as AdminDashboard)
  const [viewingUserDetails, setViewingUserDetails] = useState<User | null>(null);

  // GAMES STATE
  const [isGamesMenuOpen, setIsGamesMenuOpen] = useState(false);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [gameMode, setGameMode] = useState<'EXPLAIN' | 'PLAYING' | null>(null); 
  const [isTimerFullscreen, setIsTimerFullscreen] = useState(false);
  
  // GLOBAL TIMER FULLSCREEN STATE
  const [isGlobalTimerFullscreen, setIsGlobalTimerFullscreen] = useState(false);

  // Game Timer State
  const [gameTimeLeft, setGameTimeLeft] = useState<number>(60); // Default 60s
  const [selectedDurationOption, setSelectedDurationOption] = useState<number>(60);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [isGameTimeUp, setIsGameTimeUp] = useState(false);
  
  // Game Member Overrides (for Shuffles)
  const [memberOverrides, setMemberOverrides] = useState<User[] | null>(null);
  const [isRoleShufflingAnimation, setIsRoleShufflingAnimation] = useState(false);

  // Ref to track mounting for alarm suppression
  const isMounted = useRef(false);

  // Reset Overrides and Games when band changes
  useEffect(() => {
    setMemberOverrides(null);
    setSessionGames([]); // Reset tracked games for new band
  }, [currentBand?.id]);

  // Monitor Global Timer for "Time Up" event (Local UI notification)
  useEffect(() => {
    // Prevent immediate alarm on mount if timer is 0 (likely uninitialized state transition)
    if (!isMounted.current) {
        isMounted.current = true;
        if (timeLeft === 0) return;
    }

    if (timeLeft === 0 && !isRunning && currentBand) {
        setIsTimeUp(true);
    } else {
        setIsTimeUp(false);
    }
  }, [timeLeft, isRunning, currentBand]);

  // Sync temp name when band changes
  useEffect(() => {
    if (currentBand) {
        setTempName(currentBand.name);
    }
  }, [currentBand?.id]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
        nameInputRef.current.focus();
    }
  }, [isEditingName]);

  // Focus timer input
  useEffect(() => {
    if (isEditingTimer && timerInputRef.current) {
        timerInputRef.current.focus();
    }
  }, [isEditingTimer]);

  // GAME TIMER LOGIC (Still Local)
  useEffect(() => {
    let interval: number | undefined;
    if (gameMode === 'PLAYING' && isGameRunning && gameTimeLeft > 0) {
      interval = window.setInterval(() => {
        setGameTimeLeft(prev => {
            if (prev <= 1) {
                setIsGameRunning(false);
                setIsGameTimeUp(true);
                return 0;
            }
            return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameMode, isGameRunning, gameTimeLeft]);

  // SLOT MACHINE EFFECT LOGIC (NEXT BAND)
  useEffect(() => {
    let interval: number | undefined;
    let timeout: number | undefined;

    if (isTransitioning) {
        // Find pool of names to cycle
        const pool = allUsers.length > 0 ? allUsers : [
            { id: '1', firstName: 'Mario', lastName: 'Rossi', instruments: [], status: 'ACTIVE', createdAt: 0, username: 'mario' },
            { id: '2', firstName: 'Luigi', lastName: 'Verdi', instruments: [], status: 'ACTIVE', createdAt: 0, username: 'luigi' }
        ];

        // Start cycling names rapidly
        interval = window.setInterval(() => {
            const fakeMembers = Array(nextBand?.members.length || 3).fill(null).map(() => {
                const randomUser = pool[Math.floor(Math.random() * pool.length)];
                return randomUser;
            });
            // We cast to User[] because we know the structure matches
            setTransitionMembers(fakeMembers as User[]);
        }, 100);

        // Stop after 2 seconds and reveal actual band
        timeout = window.setTimeout(() => {
            clearInterval(interval);
            setIsTransitioning(false);
            setConfirmNext(false);
            onNextBand(sessionGames); // Trigger actual state change in App with games history
        }, 2500);
    }

    return () => {
        clearInterval(interval);
        clearTimeout(timeout);
    };
  }, [isTransitioning, nextBand, allUsers, onNextBand, sessionGames]);

  // ROLE SHUFFLE ANIMATION LOGIC
  useEffect(() => {
      let interval: number | undefined;
      let timeout: number | undefined;

      if (isRoleShufflingAnimation && currentBand) {
          interval = window.setInterval(() => {
             // Fake shuffle for visual effect
             const members = [...currentBand.members];
             // Simple random fake assignment just for visual chaos
             const possibleRoles = [InstrumentType.DRUMS, InstrumentType.BASS, InstrumentType.GUITAR, InstrumentType.KEYS, InstrumentType.VOICE, InstrumentType.OTHER];
             const fakeShuffled = members.map(m => ({
                 ...m,
                 assignedRole: possibleRoles[Math.floor(Math.random() * possibleRoles.length)]
             }));
             setMemberOverrides(fakeShuffled);
          }, 100);

          timeout = window.setTimeout(() => {
              clearInterval(interval);
              // Perform ACTUAL Shuffle
              const members = [...currentBand.members];
              const roles = members.map(m => m.assignedRole || InstrumentType.OTHER);
              
              // Shuffle roles array
              for (let i = roles.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [roles[i], roles[j]] = [roles[j], roles[i]];
              }
    
              const finalShuffled = members.map((m, idx) => ({
                  ...m,
                  assignedRole: roles[idx]
              }));
              
              setMemberOverrides(finalShuffled);
              setIsRoleShufflingAnimation(false);
          }, 2000);
      }

      return () => {
          clearInterval(interval);
          clearTimeout(timeout);
      };
  }, [isRoleShufflingAnimation, currentBand]);


  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAdjustTime = (deltaSeconds: number) => {
      setTimeLeft(prev => Math.max(0, prev + deltaSeconds));
      // Implicitly dismiss alarm if we add time
      setIsTimeUp(false); 
  };

  const handleDismissAlarm = () => {
    setIsTimeUp(false);
  };

  const handleNextBandClick = () => {
    setConfirmNext(true);
  };
  
  const confirmNextBand = () => {
      // No animation, directly switch to next band
      setConfirmNext(false);
      onNextBand(sessionGames);
  };

  const cancelNextBand = () => {
      setConfirmNext(false);
  };

  const handleAddMemberConfirm = (role: InstrumentType) => {
    if (selectedUserToAdd) {
        onAddMember(selectedUserToAdd, role);
        setIsAddMemberOpen(false);
        setSelectedUserToAdd(null);
        setSearchTerm('');
    }
  };

  const handleRemoveMemberClick = (userId: string) => {
      onRemoveMember(userId);
  };

  const handleSaveName = () => {
      if (currentBand && tempName.trim()) {
          onUpdateBandName(currentBand.id, tempName.trim());
      }
      setIsEditingName(false);
  };

  const handleKeyDownName = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSaveName();
      if (e.key === 'Escape') {
          setTempName(currentBand?.name || '');
          setIsEditingName(false);
      }
  };

  const parseTimerInput = (str: string): number => {
    if (str.includes(':')) {
        const parts = str.split(':');
        const m = parseInt(parts[0]) || 0;
        const s = parseInt(parts[1]) || 0;
        return m * 60 + s;
    }
    return (parseFloat(str) || 0) * 60;
  };

  const handleSaveTimer = () => {
      const seconds = parseTimerInput(tempTimerString);
      setTimeLeft(Math.max(0, seconds));
      setIsEditingTimer(false);
      setIsTimeUp(false);
  };

  const handleKeyDownTimer = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSaveTimer();
      if (e.key === 'Escape') setIsEditingTimer(false);
  };

  const handleSelectGame = (game: Game) => {
    setActiveGame(game);
    // Special handling for harmonic roulette, it has its own UI
    if (game.id === 'game-harmonic') {
        // Just set active game, the render loop will catch it
    } else {
        setSelectedDurationOption(60); 
        setGameMode('EXPLAIN');
    }
    setIsTimerFullscreen(false);
    setIsGamesMenuOpen(false);
    setIsGameTimeUp(false);
  };

  const handleStartGame = () => {
      setGameTimeLeft(selectedDurationOption);
      setIsGameRunning(true);
      setGameMode('PLAYING');
      if (!isRunning && timeLeft > 0) {
          setIsRunning(true);
      }
      
      // Track that this game was played
      if (activeGame && !sessionGames.includes(activeGame.title)) {
          setSessionGames(prev => [...prev, activeGame.title]);
      }
  };

  const handleShuffleRoles = () => {
      if (!currentBand) return;

      // Close modal immediately
      setIsGamesMenuOpen(false);
      setGameMode(null);
      
      // Track Game
      if (activeGame && !sessionGames.includes(activeGame.title)) {
        setSessionGames(prev => [...prev, activeGame.title]);
      }
      setActiveGame(null);
      
      // Start Animation on Main Screen
      setIsRoleShufflingAnimation(true);
  };

  // Reusable Instrument Icon getter (mirrors AdminDashboard)
  const getInstrumentIcon = (type: InstrumentType, className: string = "w-5 h-5") => {
    switch (type) {
      case InstrumentType.VOICE: return <Mic className={className} />;
      case InstrumentType.GUITAR: return <Guitar className={className} />;
      case InstrumentType.BASS: return <Guitar className={className} />;
      case InstrumentType.DRUMS: return <Drum className={className} />;
      case InstrumentType.KEYS: return <Piano className={className} />;
      case InstrumentType.OTHER: return <MoreHorizontal className={className} />;
      default: return <MoreHorizontal className={className} />;
    }
  };

  const getGameIcon = (iconName: string, className: string) => {
      switch(iconName) {
          case 'hand': return <Hand className={className} />;
          case 'footprints': return <Footprints className={className} />;
          case 'shuffle': return <Shuffle className={className} />;
          case 'music': return <Music className={className} />;
          default: return <Gamepad2 className={className} />;
      }
  };

  const renderRoleBadge = (role: InstrumentType | undefined, customName: string | undefined) => {
    const colors: Record<string, string> = {
        [InstrumentType.VOICE]: 'bg-blue-600 border-blue-400 text-white',
        [InstrumentType.GUITAR]: 'bg-orange-600 border-orange-400 text-white',
        [InstrumentType.BASS]: 'bg-purple-600 border-purple-400 text-white',
        [InstrumentType.DRUMS]: 'bg-red-600 border-red-400 text-white',
        [InstrumentType.KEYS]: 'bg-yellow-600 border-yellow-400 text-white',
        [InstrumentType.OTHER]: 'bg-gray-600 border-gray-400 text-white',
    };
    
    const roleKey = role || InstrumentType.OTHER;
    const displayLabel = (roleKey === InstrumentType.OTHER && customName) ? customName : roleKey;

    return (
        <span className={`inline-block px-3 py-1 rounded-full text-sm md:text-base font-bold uppercase tracking-wide border-2 shadow-lg ${colors[roleKey] || colors[InstrumentType.OTHER]}`}>
            {displayLabel}
        </span>
    );
  };


  // (rollback) rimosso JamInfoInline: manteniamo il footer standard

  if (!currentBand) {
      return (
          <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
              <h1 className="text-4xl font-bold text-slate-500 mb-8">IN ATTESA DI FORMAZIONI...</h1>
              <button onClick={() => setViewState('ADMIN')} className="bg-slate-800 px-6 py-3 rounded-lg hover:bg-slate-700 transition">Torna all'Admin</button>
          </div>
      )
  }

  // --- HARMONIC ROULETTE MODE ---
  if (activeGame && activeGame.id === 'game-harmonic') {
      return (
          <HarmonicRouletteFixed 
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            onExit={() => {
              setActiveGame(null);
              // Track game only if closed successfully (or on exit)
              if (!sessionGames.includes(activeGame.title)) {
                  setSessionGames(prev => [...prev, activeGame.title]);
              }
          }} />
      );
  }

  // --- STANDARD GAME MODE ---
  if (activeGame && gameMode) {
      const isPlaying = gameMode === 'PLAYING';

      if (isPlaying && isTimerFullscreen) {
          return (
            <div className={`fixed inset-0 z-[200] bg-gradient-to-br ${activeGame.color} flex flex-col h-[100dvh]`}>
                <div className="absolute top-6 right-6 flex gap-4 z-50">
                    <button 
                        onClick={() => setIsTimerFullscreen(false)}
                        className="bg-black/20 text-white hover:bg-white hover:text-black font-bold p-3 rounded-full backdrop-blur-md transition border-2 border-white/20"
                        title="Riduci a icona"
                    >
                        <Minimize2 className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={() => { setGameMode(null); setActiveGame(null); setIsGameRunning(false); }}
                        className="bg-black/20 text-white hover:bg-white hover:text-black font-bold p-3 rounded-full backdrop-blur-md transition border-2 border-white/20"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className={`flex-1 flex flex-col items-center justify-center text-center text-white relative`}>
                    <div className="flex items-center gap-3 mb-8 bg-black/20 px-8 py-3 rounded-full backdrop-blur-md absolute top-8 left-1/2 transform -translate-x-1/2">
                        {getGameIcon(activeGame.icon, "w-8 h-8")}
                        <span className="text-2xl font-bold uppercase tracking-widest">{activeGame.title}</span>
                    </div>

                    <div className="relative flex items-center justify-center">
                        {isGameTimeUp ? (
                            <div className="animate-pulse flex flex-col items-center">
                                <h1 className="text-[20vw] font-black leading-none drop-shadow-2xl">STOP!</h1>
                            </div>
                        ) : (
                            <div className="text-[30vw] font-black leading-none tabular-nums drop-shadow-2xl tracking-tighter text-center">
                                {formatTime(gameTimeLeft)}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-4 relative z-[60]">
                        {!isGameTimeUp && (
                            <>
                                <button 
                                    onClick={() => setGameTimeLeft(prev => Math.max(0, prev - 30))} 
                                    className="bg-white/20 hover:bg-white/40 text-white px-6 py-2 rounded-xl font-bold backdrop-blur-md transition text-xl"
                                >
                                    -30s
                                </button>
                                <button 
                                    onClick={() => setIsGameRunning(!isGameRunning)} 
                                    className="bg-white text-black p-6 rounded-full hover:scale-110 transition shadow-xl"
                                >
                                    {isGameRunning ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10" />}
                                </button>
                                <button 
                                    onClick={() => setGameTimeLeft(prev => prev + 30)} 
                                    className="bg-white/20 hover:bg-white/40 text-white px-6 py-2 rounded-xl font-bold backdrop-blur-md transition text-xl"
                                >
                                    +30s
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Timer e controlli a sinistra in basso */}
                <div className={`absolute bottom-0 left-0 ${isTablet ? 'p-4' : 'p-6'} ${isTablet && activeGame ? 'z-10' : 'z-50'}`}>
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
                </div>

                {/* Nome band a destra in basso */}
                <div className={`absolute bottom-0 right-0 ${isTablet ? 'p-4' : 'p-6'} text-right opacity-90 hidden md:block ${isTablet && activeGame ? 'z-10' : 'z-50'}`}>
                    <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{currentBand?.name}</span>
                </div>
            </div>
          );
      }

      return (
        <div className={`fixed inset-0 z-[200] bg-gradient-to-br ${activeGame.color} flex flex-col`}>
            <div className="absolute top-4 right-4 flex gap-4 z-50">
                 <button 
                    onClick={() => { setGameMode(null); setActiveGame(null); setIsGameRunning(false); }}
                    className="bg-black/20 text-white font-bold px-6 py-3 rounded-full hover:bg-black/40 transition border border-white/10"
                >
                    CHIUDI GIOCO
                </button>
            </div>

            <div className={`flex-1 flex flex-col p-8 text-center text-white animate-fade-in`}>
                <div className="mb-6 self-center p-6 bg-white/20 rounded-full backdrop-blur-md shadow-2xl">
                    {getGameIcon(activeGame.icon, "w-24 h-24 md:w-32 md:h-32")}
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 uppercase tracking-tight drop-shadow-lg leading-none self-center">{activeGame.title}</h1>
                <p className={`text-xl md:text-3xl font-medium max-w-5xl leading-relaxed bg-black/20 p-6 md:p-8 rounded-2xl backdrop-blur-sm border border-white/10 self-center flex-1 overflow-y-auto`}>
                    {activeGame.description}
                </p>

                {!isPlaying ? (
                    <div className={`bg-black/30 p-8 rounded-3xl backdrop-blur-md min-w-[300px] md:min-w-[500px] shadow-2xl border border-white/10 transition-all duration-500 self-center mt-auto w-full max-w-md`}>
                        <div className="animate-fade-in">
                            {activeGame.id === 'game-swap' ? (
                                // --- SPECIAL UI FOR SWAP GAME ---
                                <div className="flex justify-center">
                                    <button 
                                        onClick={handleShuffleRoles}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-12 py-8 rounded-2xl text-2xl shadow-2xl transition transform hover:scale-105 flex items-center justify-center w-full"
                                    >
                                        <Shuffle className="w-8 h-8 mr-4" />
                                        SCAMBIA RUOLI!
                                    </button>
                                </div>
                            ) : (
                                // --- STANDARD UI FOR OTHER GAMES ---
                                <>
                                    <h3 className="text-xl font-bold uppercase tracking-widest mb-6 opacity-80">Seleziona Durata</h3>
                                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                                        {[30, 60, 120, 180].map(sec => (
                                            <button
                                                key={sec}
                                                onClick={() => setSelectedDurationOption(sec)}
                                                className={`px-5 py-3 rounded-xl font-bold text-xl transition-all ${selectedDurationOption === sec ? 'bg-white text-black scale-110 shadow-xl' : 'bg-black/40 text-white hover:bg-black/60'}`}
                                            >
                                                {sec >= 60 ? `${sec/60}m` : `${sec}s`}
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={handleStartGame}
                                        className="w-full bg-white text-black font-black px-12 py-5 rounded-xl text-3xl shadow-2xl transition flex items-center justify-center"
                                    >
                                        <PlayCircle className="w-8 h-8 mr-3" />
                                        GIOCA
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`bg-black/30 ${isTablet ? 'p-6' : 'p-8'} rounded-3xl backdrop-blur-md min-w-[300px] md:min-w-[500px] shadow-2xl border border-white/10 self-center mt-auto w-full max-w-md`}>
                        <div className="flex flex-col items-center">
                             <div className="flex items-center justify-between w-full mb-4 px-2">
                                 <span className="text-sm font-bold uppercase tracking-widest opacity-60">Tempo Rimanente</span>
                                 <button 
                                    onClick={() => setIsTimerFullscreen(true)}
                                    className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                                    title="Tutto Schermo"
                                 >
                                     <Maximize2 className="w-5 h-5" />
                                 </button>
                             </div>
                             
                             {isGameTimeUp ? (
                                <div className="text-6xl md:text-8xl font-black mb-6 animate-pulse text-white">STOP!</div>
                             ) : (
                                <div className={`${isTablet ? 'text-6xl md:text-8xl' : 'text-7xl md:text-9xl'} font-black tabular-nums tracking-tighter leading-none mb-6 text-white drop-shadow-xl`}>
                                    {formatTime(gameTimeLeft)}
                                </div>
                             )}

                             <div className="flex gap-4 w-full justify-center relative z-[60]">
                                 {!isGameTimeUp && (
                                     <button 
                                        onClick={() => setIsGameRunning(!isGameRunning)} 
                                        className="bg-white text-black p-4 rounded-full hover:scale-110 transition shadow-xl"
                                     >
                                        {isGameRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                                     </button>
                                 )}
                                 <button onClick={() => setGameTimeLeft(prev => prev + 30)} className="bg-white/20 hover:bg-white/40 text-white px-5 py-2 rounded-xl font-bold backdrop-blur-md transition">+30s</button>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Timer e controlli a sinistra in basso */}
            <div className={`absolute bottom-0 left-0 ${isTablet ? 'p-4' : 'p-6'} ${isTablet && activeGame ? 'z-10' : 'z-50'}`}>
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
            </div>

            {/* Nome band a destra in basso */}
            <div className={`absolute bottom-0 right-0 ${isTablet ? 'p-4' : 'p-6'} text-right opacity-90 hidden md:block ${isTablet && activeGame ? 'z-10' : 'z-50'}`}>
                <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{currentBand?.name}</span>
            </div>
        </div>
      );
  }

  // 1. STATE: TIME IS UP
  if (isTimeUp && !isAddMemberOpen) {
    return (
      <div 
        onClick={handleDismissAlarm}
        className="fixed inset-0 z-[100] bg-red-600 flex flex-col items-center justify-center cursor-pointer animate-[pulse_0.5s_ease-in-out_infinite]"
      >
          <h1 className="text-[25vw] font-black text-black leading-none select-none">BASTA!</h1>
          <p className="text-black font-bold text-2xl mt-4 bg-white/20 px-6 py-2 rounded-full">Clicca ovunque per fermare</p>
      </div>
    );
  }

  // 2. STATE: URGENT (< 30s)
  if (timeLeft > 0 && timeLeft <= 30 && !isAddMemberOpen && !isGamesMenuOpen && !isGlobalTimerFullscreen) {
     return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
             <button 
                onClick={() => setViewState('ADMIN')} 
                className="absolute top-4 left-4 z-[101] flex items-center text-slate-400 hover:text-white bg-slate-800 px-4 py-2 rounded-lg"
             >
                <ArrowLeft className="w-5 h-5 mr-2" /> Admin
             </button>
             <div className="absolute top-4 right-4 z-[101] flex gap-2">
                <button onClick={() => handleAdjustTime(-30)} className="bg-slate-800 text-white px-3 py-1 rounded font-bold">-30s</button>
                <button onClick={() => handleAdjustTime(30)} className="bg-slate-800 text-white px-3 py-1 rounded font-bold">+30s</button>
             </div>

             <div className="flex flex-col items-center">
                 <div className="text-[35vw] font-black text-red-600 leading-none tracking-tighter tabular-nums animate-pulse">
                     {timeLeft}
                 </div>
                 <h2 className="text-white text-4xl font-bold uppercase tracking-widest mt-4">Chiudere!</h2>
             </div>
        </div>
     );
  }

  // 2.5 STATE: GLOBAL TIMER FULLSCREEN
  if (isGlobalTimerFullscreen) {
      return (
          <div className="fixed inset-0 z-[200] bg-slate-950 w-full h-[100dvh] flex flex-col items-center justify-center text-white relative overflow-hidden">
              
              {/* Band Name (Top Left) */}
              {currentBand && (
                  <div className="absolute top-6 left-6 z-[201]">
                      <div className="bg-white/10 backdrop-blur-md px-4 md:px-6 py-2 md:py-3 rounded-xl border border-white/20">
                          <span className="text-lg md:text-2xl font-bold text-white">{currentBand.name}</span>
                      </div>
                  </div>
              )}

              {/* Controls (Top Right) */}
              <div className="absolute top-6 right-6 flex gap-2 md:gap-4 z-[201] items-center">
                  <button onClick={() => handleAdjustTime(-60)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 md:px-4 md:py-2 rounded-xl font-bold backdrop-blur-md transition text-sm md:text-base">-1m</button>
                  <button onClick={() => handleAdjustTime(-30)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 md:px-4 md:py-2 rounded-xl font-bold backdrop-blur-md transition text-sm md:text-base">-30s</button>
                  <button onClick={() => handleAdjustTime(30)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 md:px-4 md:py-2 rounded-xl font-bold backdrop-blur-md transition text-sm md:text-base">+30s</button>
                  <button onClick={() => handleAdjustTime(60)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 md:px-4 md:py-2 rounded-xl font-bold backdrop-blur-md transition text-sm md:text-base">+1m</button>
                  <button 
                      onClick={() => setIsGlobalTimerFullscreen(false)}
                      className="bg-white/10 hover:bg-white/20 text-white p-2 md:p-3 rounded-full backdrop-blur-md transition"
                  >
                      <Minimize2 className="w-5 h-5 md:w-8 md:h-8" />
                  </button>
              </div>

              {/* Main Content Container (Centers Timer and Play Button Vertically) */}
              <div className="flex flex-col items-center justify-center gap-8 md:gap-16 w-full pt-16 md:pt-24">
                  <div 
                      className={`text-[35vw] font-black tabular-nums tracking-tighter leading-none select-none drop-shadow-2xl text-center ${timeLeft < 60 ? (timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-yellow-400') : 'text-white'}`}
                  >
                      {formatTime(timeLeft)}
                  </div>
                  
                  {/* Play/Pause Control (Centered below timer, within flex flow to prevent overlap) */}
                  <div className="z-[201] -mt-6 md:-mt-12 flex items-center justify-center gap-3 md:gap-4">
                       {!isRunning ? (
                           <button onClick={() => setIsRunning(true)} className="bg-green-600 hover:bg-green-500 text-white p-6 md:p-8 rounded-full shadow-2xl transition hover:scale-110">
                               <Play className="w-12 h-12 md:w-20 md:h-20 fill-current" />
                           </button>
                       ) : (
                           <button onClick={() => setIsRunning(false)} className="bg-yellow-600 hover:bg-yellow-500 text-white p-6 md:p-8 rounded-full shadow-2xl transition hover:scale-110">
                               <Pause className="w-12 h-12 md:w-20 md:h-20 fill-current" />
                           </button>
                       )}
                       
                       <button 
                           onClick={() => { setIsRunning(false); setTimeLeft(Math.floor((currentBand?.durationMinutes || 6) * 60)); setIsTimeUp(false); }} 
                           className="bg-slate-700 hover:bg-slate-600 text-white p-6 md:p-8 rounded-full shadow-2xl transition hover:scale-110"
                           title="Reset Timer"
                       >
                           <RotateCcw className="w-12 h-12 md:w-20 md:h-20" />
                       </button>
                       
                       <div className="w-px h-16 md:h-24 bg-slate-700"></div>
                       
                       {!confirmNext ? (
                           <button 
                               onClick={handleNextBandClick}
                               className="bg-indigo-600 hover:bg-indigo-500 text-white p-6 md:p-8 rounded-full shadow-2xl transition hover:scale-110"
                               title="Prossima Band"
                           >
                               <SkipForward className="w-12 h-12 md:w-20 md:h-20" />
                           </button>
                       ) : (
                           <div className="flex gap-2 animate-fade-in">
                               <button 
                                   onClick={confirmNextBand}
                                   className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 md:px-6 md:py-4 rounded-2xl shadow-2xl transition hover:scale-105 flex flex-col items-center justify-center font-bold text-xs"
                                   title="Conferma"
                               >
                                   <Check className="w-5 h-5 md:w-6 md:h-6 mb-1" />
                                   CONFERMA
                               </button>
                               <button 
                                   onClick={cancelNextBand}
                                   className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-3 md:px-4 md:py-4 rounded-2xl shadow-2xl transition hover:scale-105 flex flex-col items-center justify-center font-bold text-xs"
                                   title="Annulla"
                               >
                                   <XIcon className="w-5 h-5 md:w-6 md:h-6 mb-1" />
                               </button>
                           </div>
                       )}
                  </div>
              </div>
          </div>
      );
  }

  // 3. STATE: NORMAL
  // Determine which members list to show (Standard or Overridden by Game)
  const displayMembers = memberOverrides || currentBand.members;

  return (
    <div key={currentBand.id} className="min-h-screen relative flex flex-col overflow-hidden bg-black transition-colors duration-200">
      
      {/* Top Controls */}
      <button 
        onClick={() => setViewState('ADMIN')} 
        className="absolute top-1 left-3 md:top-2 md:left-6 z-50 flex items-center text-slate-400 hover:text-white bg-black/60 hover:bg-black/90 px-3 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur transition-all text-xs md:text-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" /> Admin
      </button>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button 
            onClick={() => setIsGamesMenuOpen(true)}
            className={`flex items-center gap-2 px-3 py-1 rounded backdrop-blur transition-colors font-bold mr-4 ${activeGame ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white animate-pulse' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'}`}
          >
              <Gamepad2 className="w-4 h-4" />
              GIOCHI
          </button>

          <button onClick={() => handleAdjustTime(-60)} className="bg-slate-800/80 hover:bg-slate-700 text-white px-3 py-1 rounded backdrop-blur transition-colors font-bold">-1m</button>
          <button onClick={() => handleAdjustTime(-30)} className="bg-slate-800/80 hover:bg-slate-700 text-white px-3 py-1 rounded backdrop-blur transition-colors font-bold">-30s</button>
          <button onClick={() => handleAdjustTime(30)} className="bg-slate-800/80 hover:bg-slate-700 text-white px-3 py-1 rounded backdrop-blur transition-colors font-bold">+30s</button>
          <button onClick={() => handleAdjustTime(60)} className="bg-slate-800/80 hover:bg-slate-700 text-white px-3 py-1 rounded backdrop-blur transition-colors font-bold">+1m</button>
      </div>

      {/* USER DETAILS MODAL (reuse AdminDashboard style) */}
      {viewingUserDetails && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
              <div className="bg-slate-900/50 p-6 flex flex-col items-center border-b border-slate-700">
                  <button 
                    onClick={() => setViewingUserDetails(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-full transition"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                  
                  <img 
                    src={getAvatarUrl(viewingUserDetails.avatarSeed || viewingUserDetails.username)} 
                    className="w-24 h-24 rounded-full bg-slate-700 mb-4 shadow-xl border-4 border-slate-600" 
                    alt="avatar" 
                  />
                  <h2 className="text-2xl font-bold text-white">{viewingUserDetails.firstName} {viewingUserDetails.lastName}</h2>
                  <p className="text-indigo-400 font-medium">@{viewingUserDetails.username}</p>
              </div>

              <div className="p-6 space-y-4">
                  <div>
                      <h4 className="text-xs uppercase font-bold text-slate-500 mb-3 tracking-wider">Strumenti</h4>
                      <div className="flex flex-wrap gap-2">
                          {viewingUserDetails.instruments.map(inst => (
                              <div key={inst} className="flex items-center gap-2 bg-slate-700 px-3 py-1.5 rounded-lg text-white font-medium text-sm">
                                  {getInstrumentIcon(inst, "w-4 h-4 text-indigo-400")}
                                  <span>{inst === InstrumentType.OTHER && viewingUserDetails.customInstrument ? viewingUserDetails.customInstrument : inst}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-200">
                      {/* Colonna sinistra: Contatti */}
                      <div className="space-y-3">
                          <div className="font-bold text-slate-400 text-xs uppercase tracking-wider">Contatti</div>
                          <div className="flex items-center gap-3 text-slate-300">
                              <Mail className="w-5 h-5 text-slate-500" />
                              {viewingUserDetails.email ? (
                                  <a href={`mailto:${viewingUserDetails.email}`} className="underline decoration-slate-600 hover:decoration-indigo-400 truncate max-w-[160px]">
                                      {viewingUserDetails.email}
                                  </a>
                              ) : (
                                  <span className="text-slate-500 italic">--</span>
                              )}
                          </div>
                          <div className="flex items-center gap-3 text-slate-300">
                              <Phone className="w-5 h-5 text-slate-500" />
                              {viewingUserDetails.phoneNumber ? (
                                  <a 
                                    href={toWhatsAppUrl(viewingUserDetails.phoneNumber || '')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 underline decoration-slate-600 hover:decoration-green-400"
                                    title="Invia messaggio WhatsApp"
                                  >
                                      <span>{viewingUserDetails.phoneNumber}</span>
                                      <MessageCircle className="w-3 h-3 text-green-500" />
                                  </a>
                              ) : (
                                  <span className="text-slate-500 italic">--</span>
                              )}
                          </div>
                      </div>

                      {/* Colonna destra: Social */}
                      <div className="space-y-3">
                          <div className="font-bold text-slate-400 text-xs uppercase tracking-wider">Social</div>
                          {viewingUserDetails.instagram ? (
                              <a 
                                href={toSocialUrl('instagram', viewingUserDetails.instagram)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-slate-300 hover:text-pink-400 transition-colors"
                              >
                                  <Instagram className="w-5 h-5 text-pink-500" />
                                  <span className="underline decoration-slate-600 hover:decoration-pink-400">@{normalizeHandle(viewingUserDetails.instagram)}</span>
                                  <ExternalLink className="w-3 h-3 opacity-50" />
                              </a>
                          ) : (
                              <div className="flex items-center gap-3 text-slate-300">
                                  <Instagram className="w-5 h-5 text-slate-500" />
                                  <span className="text-slate-500 italic">--</span>
                              </div>
                          )}
                          {viewingUserDetails.facebook ? (
                              <a 
                                href={toSocialUrl('facebook', viewingUserDetails.facebook)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-slate-300 hover:text-blue-400 transition-colors"
                              >
                                  <Facebook className="w-5 h-5 text-blue-500" />
                                  <span className="underline decoration-slate-600 hover:decoration-blue-400">Profilo</span>
                                  <ExternalLink className="w-3 h-3 opacity-50" />
                              </a>
                          ) : (
                              <div className="flex items-center gap-3 text-slate-300">
                                  <Facebook className="w-5 h-5 text-slate-500" />
                                  <span className="text-slate-500 italic">--</span>
                              </div>
                          )}
                          {viewingUserDetails.x ? (
                              <a 
                                href={toSocialUrl('x', viewingUserDetails.x)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                              >
                                  <Twitter className="w-5 h-5" />
                                  <span className="underline decoration-slate-600 hover:decoration-slate-300">@{normalizeHandle(viewingUserDetails.x)}</span>
                                  <ExternalLink className="w-3 h-3 opacity-50" />
                              </a>
                          ) : (
                              <div className="flex items-center gap-3 text-slate-300">
                                  <Twitter className="w-5 h-5 text-slate-500" />
                                  <span className="text-slate-500 italic">--</span>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:flex-row h-screen">
         
         {/* LEFT: CURRENT BAND (70%) */}
         <div className="flex-[3] flex flex-col justify-center p-8 md:p-12 relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-800 via-black to-black -z-10"></div>
            
            {/* SLOT MACHINE TRANSITION OVERLAY (Absolute over Left Panel) */}
            {isTransitioning && (
                <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
                    <h2 className="text-4xl font-bold text-indigo-400 mb-8 uppercase tracking-widest animate-pulse">Prossima Band...</h2>
                    <div className="space-y-4 text-center">
                        {transitionMembers.map((m, idx) => (
                            <div key={idx} className="text-3xl md:text-5xl font-black text-white animate-bounce" style={{ animationDelay: `${idx * 0.1}s` }}>
                                {m.firstName} {m.lastName}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={`relative z-10 ${isTablet ? 'mt-6' : 'mt-16'} md:mt-0 ${isTablet ? 'mb-4' : 'mb-8'}`}>
                <div className="flex items-center justify-between max-w-5xl mb-4">
                  <div className="inline-block bg-red-600 text-white font-black text-xl px-4 py-1 rounded shadow-lg shadow-red-600/50 animate-pulse">
                      IN SCENA
                  </div>
                </div>

                {isEditingName ? (
                    <div className="flex items-center gap-4">
                        <input
                            ref={nameInputRef}
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={handleKeyDownName}
                            onBlur={handleSaveName}
                            className={`${isTablet ? 'text-5xl' : 'text-5xl md:text-7xl lg:text-8xl'} font-black text-white bg-transparent border-b-2 border-indigo-500 outline-none w-full shadow-none p-0 tracking-tight`}
                        />
                        <button onClick={handleSaveName} className="bg-green-600 p-3 rounded-full hover:bg-green-500">
                            <Check className="w-8 h-8 text-white" />
                        </button>
                    </div>
                ) : (
                    <div className="group flex items-center gap-4">
                        <h1 
                            className={`${isTablet ? 'text-5xl' : 'text-5xl md:text-7xl lg:text-8xl'} font-black text-white tracking-tight drop-shadow-2xl cursor-pointer hover:text-indigo-200 transition-colors`}
                            onClick={() => { setTempName(currentBand.name); setIsEditingName(true); }}
                        >
                            {currentBand.name}
                        </h1>
                        <button 
                            onClick={() => { setTempName(currentBand.name); setIsEditingName(true); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white p-2"
                        >
                            <Edit3 className="w-8 h-8" />
                        </button>
                    </div>
                )}
            </div>

            {/* Members Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isTablet ? 'gap-4' : 'gap-6'} max-w-5xl relative z-10`}>
                {displayMembers.map(m => (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => setViewingUserDetails(m)}
                        className="relative group flex items-center w-full text-left bg-slate-900/60 border border-slate-700/50 p-4 rounded-2xl backdrop-blur-sm shadow-2xl transform transition hover:scale-105 cursor-pointer"
                    >
                        <img 
                          src={getAvatarUrl(m.avatarSeed || m.username)} 
                          className={`${isTablet ? 'w-14 h-14 md:w-16 md:h-16' : 'w-16 h-16 md:w-20 md:h-20'} rounded-full bg-slate-700 border-4 border-slate-800 shadow-lg mr-6`} 
                          alt="avatar" 
                        />
                        <div className="flex flex-col items-start min-w-0">
                            <span className={`${isTablet ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'} font-bold text-white mb-2 truncate w-full`}>
                                {m.firstName} {m.lastName}
                            </span>
                            {renderRoleBadge(m.assignedRole, m.customInstrument)}
                        </div>
                        
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveMemberClick(m.id);
                            }}
                            className={`absolute -top-3 -right-3 z-50 bg-red-600 hover:bg-red-500 text-white p-2 rounded-full transition-all duration-200 shadow-lg transform hover:scale-110 border-2 border-slate-900 ${isTablet ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            title="Rimuovi musicista"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </button>
                ))}
                
                {/* ADD MEMBER BUTTON */}
                <button 
                    onClick={() => setIsAddMemberOpen(true)}
                    className="flex items-center justify-center bg-slate-900/30 border-2 border-dashed border-slate-600 p-4 rounded-2xl hover:bg-slate-800/50 hover:border-indigo-500 hover:text-indigo-400 transition-all group min-h-[120px]"
                >
                    <div className="flex flex-col items-center">
                        <Plus className="w-10 h-10 mb-2 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition" />
                        <span className="font-bold text-slate-500 group-hover:text-indigo-400">AGGIUNGI</span>
                    </div>
                </button>
            </div>

            {/* TIMER */}
            <div className={`mt-auto ${isTablet ? 'pt-6' : 'pt-12'} flex items-center gap-8 relative z-10`}>
                 
                 {isEditingTimer ? (
                     <div className="flex items-center gap-2">
                        <input
                            ref={timerInputRef}
                            value={tempTimerString}
                            onChange={(e) => setTempTimerString(e.target.value)}
                            onKeyDown={handleKeyDownTimer}
                            onBlur={handleSaveTimer}
                            placeholder="MM:SS"
                            className={`${isTablet ? 'text-7xl md:text-8xl' : 'text-8xl md:text-9xl'} font-black bg-transparent text-white border-b-2 border-indigo-500 outline-none w-80 md:w-96`}
                        />
                        <button onClick={handleSaveTimer} className="bg-green-600 p-4 rounded-full hover:bg-green-500">
                           <Check className="w-8 h-8 text-white" />
                        </button>
                     </div>
                 ) : (
                    <div 
                        onClick={() => { setTempTimerString(formatTime(timeLeft)); setIsEditingTimer(true); }}
                        className={`${isTablet ? 'text-7xl md:text-8xl' : 'text-8xl md:text-9xl'} font-black tabular-nums tracking-tighter transition-colors text-slate-200 cursor-pointer hover:text-indigo-200`}
                        title="Clicca per modificare il tempo"
                    >
                        {formatTime(timeLeft)}
                    </div>
                 )}

                 <div className="flex gap-4 items-center">
                     {/* FULLSCREEN TRIGGER */}
                     <button 
                        onClick={() => setIsGlobalTimerFullscreen(true)}
                        className="text-slate-500 hover:text-white p-4 rounded-full hover:bg-slate-800 transition"
                        title="Schermo Intero"
                     >
                         <Maximize2 className="w-8 h-8" />
                     </button>

                     <div className="w-px h-16 bg-slate-700 mx-2"></div>

                     {!isRunning ? (
                         <button onClick={() => setIsRunning(true)} className="bg-green-600 hover:bg-green-500 text-white p-6 rounded-full shadow-2xl transition hover:scale-110">
                             <Play className="w-10 h-10 fill-current" />
                         </button>
                     ) : (
                         <button onClick={() => setIsRunning(false)} className="bg-yellow-600 hover:bg-yellow-500 text-white p-6 rounded-full shadow-2xl transition hover:scale-110">
                             <Pause className="w-10 h-10 fill-current" />
                         </button>
                     )}
                     <button 
                        onClick={() => { setIsRunning(false); setTimeLeft(Math.floor((currentBand.durationMinutes || 6) * 60)); setIsTimeUp(false); }} 
                        className="bg-slate-700 hover:bg-slate-600 text-white p-6 rounded-full shadow-2xl transition hover:scale-110"
                        title="Reset Timer"
                     >
                         <RotateCcw className="w-10 h-10" />
                     </button>
                     
                     <div className="w-px h-20 bg-slate-700 mx-2"></div>
                     
                     {!confirmNext ? (
                        <button 
                            onClick={handleNextBandClick}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white p-6 rounded-full shadow-2xl transition hover:scale-110"
                            title="Prossima Band"
                        >
                            <SkipForward className="w-10 h-10" />
                        </button>
                     ) : (
                        <div className="flex gap-2 animate-fade-in">
                            <button 
                                onClick={confirmNextBand}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl transition hover:scale-105 flex flex-col items-center justify-center font-bold text-xs"
                                title="Conferma"
                            >
                                <Check className="w-6 h-6 mb-1" />
                                CONFERMA
                            </button>
                             <button 
                                onClick={cancelNextBand}
                                className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-4 rounded-2xl shadow-2xl transition hover:scale-105 flex flex-col items-center justify-center font-bold text-xs"
                                title="Annulla"
                            >
                                <XIcon className="w-6 h-6 mb-1" />
                            </button>
                        </div>
                     )}
                 </div>
            </div>
         </div>

         {/* RIGHT: NEXT BAND (30%) */}
         <div className="hidden md:flex flex-1 bg-slate-900 border-l border-slate-800 p-8 flex-col justify-center">
            <h2 className="text-slate-500 font-bold text-2xl uppercase tracking-widest mb-8 border-b border-slate-700 pb-4">Prossima Band</h2>
            
            {nextBand ? (
                <div className="opacity-60">
                    <h3 className="text-4xl font-bold text-white mb-6">{nextBand.name}</h3>
                    <ul className="space-y-3">
                        {nextBand.members.map(m => (
                            <li key={m.id} className={`flex items-center ${nextListFontClass} text-slate-300 whitespace-nowrap`}>
                                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-4"></span>
                                <span className="font-semibold mr-2">{m.firstName} {m.lastName}</span>
                                <span className="text-slate-500 text-xs uppercase">({m.assignedRole || '?'})</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="text-slate-600 text-xl italic">
                    Nessuna altra band in scaletta.
                </div>
            )}
         </div>
      </div>

      {isGamesMenuOpen && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-slate-800 rounded-2xl border border-slate-600 w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                      <h2 className="text-2xl font-bold text-white flex items-center">
                          <Gamepad2 className="w-6 h-6 mr-2 text-purple-400" /> DATABASE GIOCHI
                      </h2>
                      <button onClick={() => setIsGamesMenuOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700">
                          <XIcon className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
                      {GAMES.map(game => (
                          <div 
                            key={game.id} 
                            onClick={() => handleSelectGame(game)}
                            className={`relative group cursor-pointer rounded-xl overflow-hidden border border-slate-700 hover:border-white transition-all duration-300 transform hover:-translate-y-1 shadow-lg`}
                          >
                              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                              <div className="p-5 flex flex-col items-center text-center relative z-10">
                                  <div className="mb-3 p-3 bg-white/10 rounded-full text-white">
                                      {getGameIcon(game.icon, "w-10 h-10")}
                                  </div>
                                  <h3 className="text-lg font-bold text-white mb-1">{game.title}</h3>
                                  <p className="text-xs text-slate-300 line-clamp-2">{game.description}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {isAddMemberOpen && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-slate-800 rounded-2xl border border-slate-600 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                      <h2 className="text-xl font-bold text-white flex items-center">
                          <UserPlus className="w-5 h-5 mr-2 text-indigo-400" /> Aggiungi Musicista Live
                      </h2>
                      <button onClick={() => { setIsAddMemberOpen(false); setSelectedUserToAdd(null); }} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700">
                          <XIcon className="w-6 h-6" />
                      </button>
                  </div>

                  <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                      <div className="relative">
                          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                          <input 
                              type="text" 
                              placeholder="Cerca per nome o strumento..." 
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                      {!selectedUserToAdd ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {allUsers
                                  .filter(u => {
                                      const inCurrent = currentBand.members.some(m => m.id === u.id);
                                      const inNext = nextBand ? nextBand.members.some(m => m.id === u.id) : false;
                                      
                                      // COOLDOWN CHECK: Check if they were in the previous band (pastBands)
                                      const lastPlayedBand = pastBands.length > 0 ? pastBands[pastBands.length - 1] : null;
                                      const inCooldown = lastPlayedBand ? lastPlayedBand.members.some(m => m.id === u.id) : false;

                                      return !inCurrent && !inNext && !inCooldown;
                                  })
                                  .filter(u => 
                                      u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                      u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      u.instruments.some(i => i.toLowerCase().includes(searchTerm.toLowerCase()))
                                  )
                                  .map(u => (
                                      <div 
                                          key={u.id} 
                                          onClick={() => setSelectedUserToAdd(u)}
                                          className="flex items-center p-3 rounded-lg hover:bg-indigo-600/20 hover:border-indigo-500 border border-transparent cursor-pointer transition-all group"
                                      >
                    <img src={getAvatarUrl(u.avatarSeed || u.username)} className="w-10 h-10 rounded-full bg-slate-700 mr-3" alt="av" />
                                          <div className="flex-1">
                                              <h4 className="font-bold text-slate-200 group-hover:text-white">{u.firstName} {u.lastName}</h4>
                                              <p className="text-xs text-slate-400">{u.instruments.join(', ')}</p>
                                          </div>
                                          <Plus className="w-5 h-5 text-slate-500 group-hover:text-indigo-400" />
                                      </div>
                                  ))
                              }
                              {allUsers.filter(u => {
                                      const inCurrent = currentBand.members.some(m => m.id === u.id);
                                      const inNext = nextBand ? nextBand.members.some(m => m.id === u.id) : false;
                                      const lastPlayedBand = pastBands.length > 0 ? pastBands[pastBands.length - 1] : null;
                                      const inCooldown = lastPlayedBand ? lastPlayedBand.members.some(m => m.id === u.id) : false;
                                      return !inCurrent && !inNext && !inCooldown;
                                  }).length === 0 && (
                                  <div className="col-span-2 text-center py-8 text-slate-500">Tutti i musicisti disponibili sono sul palco, in scaletta o in pausa!</div>
                              )}
                          </div>
                      ) : (
                          <div className="p-4 flex flex-col items-center">
            <img src={getAvatarUrl(selectedUserToAdd.avatarSeed || selectedUserToAdd.username)} className="w-24 h-24 rounded-full bg-slate-700 mb-4 shadow-xl border-4 border-indigo-500" alt="av" />
                              <h3 className="text-2xl font-bold text-white mb-6">Come suona {selectedUserToAdd.firstName}?</h3>
                              
                              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                                  {selectedUserToAdd.instruments.map(inst => (
                                      <button 
                                          key={inst}
                                          onClick={() => handleAddMemberConfirm(inst)}
                                          className="bg-slate-700 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:scale-105"
                                      >
                                          {inst === InstrumentType.OTHER && selectedUserToAdd.customInstrument ? selectedUserToAdd.customInstrument : inst}
                                      </button>
                                  ))}
                              </div>
                              <button onClick={() => setSelectedUserToAdd(null)} className="mt-8 text-slate-400 hover:text-white underline">Scegli un altro</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
