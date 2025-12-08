import React, { useState, useEffect, useRef } from 'react';
import { ViewState, User, Band, InstrumentType } from './types';
import { Home } from './components/Home';
import { Registration } from './components/Registration';
import { AdminDashboard } from './components/AdminDashboard';
import { ProjectorView } from './components/ProjectorView';
// Rimosso generateDemoData: non iniettiamo più utenti demo

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('HOME');
  const [users, setUsers] = useState<User[]>([]);
  // Lifted bands state to App to share between Admin and Projector
  const [bands, setBands] = useState<Band[]>([]);
  // History of completed bands to calculate rotation fairness
  const [pastBands, setPastBands] = useState<Band[]>([]);

  // GLOBAL TIMER STATE
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Refs per autosave stabile
  const usersRef = useRef<User[]>([]);
  const bandsRef = useRef<Band[]>([]);
  const pastBandsRef = useRef<Band[]>([]);
  const viewRef = useRef<ViewState>('HOME');
  const timerRef = useRef<number>(0);
  const hasCheckedRestoreRef = useRef<boolean>(false);

  // Load users and view state from localStorage on mount (senza iniezione di utenti demo)
  useEffect(() => {
    // --- MIGRATION HELPERS ---
    const EN_TO_IT: Record<string, InstrumentType> = {
      VOICE: InstrumentType.VOICE,
      GUITAR: InstrumentType.GUITAR,
      BASS: InstrumentType.BASS,
      DRUMS: InstrumentType.DRUMS,
      KEYS: InstrumentType.KEYS,
      OTHER: InstrumentType.OTHER,
    };

    const migrateUser = (u: any): User => {
      const instruments: InstrumentType[] = Array.isArray(u.instruments)
        ? u.instruments.map((ins: string) => EN_TO_IT[ins] ?? ins)
        : [];
      const assignedRole = u.assignedRole ? (EN_TO_IT[u.assignedRole] ?? u.assignedRole) : undefined;
      return { ...u, instruments, assignedRole } as User;
    };

    const migrateBand = (b: any): Band => {
      const members: User[] = Array.isArray(b.members) ? b.members.map(migrateUser) : [];
      return { ...b, members } as Band;
    };

    // Restore last view for smoother experience after accidental reloads
    const storedView = localStorage.getItem('jamSessionView');
    if (storedView === 'HOME' || storedView === 'REGISTER' || storedView === 'ADMIN' || storedView === 'PROJECTOR') {
      setViewState(storedView as ViewState);
    }

    const storedUsers = localStorage.getItem('jamSessionUsers');
    const storedBands = localStorage.getItem('jamSessionBands');
    const storedHistory = localStorage.getItem('jamSessionHistory');

    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers);
        
        // MIGRATION: convert eventual vecchi Enum in inglese -> valori italiani, senza perdere dati
        const hasOldEnglishData = Array.isArray(parsedUsers) && parsedUsers.some((u: any) => 
            Array.isArray(u.instruments) && (
              u.instruments.includes('GUITAR') || u.instruments.includes('DRUMS') ||
              u.instruments.includes('BASS') || u.instruments.includes('KEYS') ||
              u.instruments.includes('VOICE') || u.instruments.includes('OTHER')
            )
        );

        if (hasOldEnglishData) {
            const migrated = parsedUsers.map(migrateUser);
            setUsers(migrated);
            try { localStorage.setItem('jamSessionUsers', JSON.stringify(migrated)); } catch {}
        } else {
            setUsers(Array.isArray(parsedUsers) ? parsedUsers : []);
        }

      } catch (e) {
        console.error("Failed to parse users", e);
        setUsers([]); // Fallback to empty
      }
    } else {
      // First run: nessun utente iniziale
      setUsers([]);
    }

    if (storedBands) {
      try {
        const loadedBands = JSON.parse(storedBands);
        const needsMigration = JSON.stringify(loadedBands).match(/\b(GUITAR|DRUMS|BASS|KEYS|VOICE|OTHER)\b/);
        const migratedBands: Band[] = needsMigration ? loadedBands.map(migrateBand) : loadedBands;
        setBands(migratedBands);
        try { localStorage.setItem('jamSessionBands', JSON.stringify(migratedBands)); } catch {}
        // Initialize timer with first band if exists and timer is 0
        if (migratedBands.length > 0) {
          setTimerSeconds((migratedBands[0].durationMinutes || 6) * 60);
        }
      } catch (e) { console.error(e); }
    }

    if (storedHistory) {
      try {
        const loadedHistory = JSON.parse(storedHistory);
        const needsMigration = JSON.stringify(loadedHistory).match(/\b(GUITAR|DRUMS|BASS|KEYS|VOICE|OTHER)\b/);
        const migratedHistory: Band[] = needsMigration ? loadedHistory.map(migrateBand) : loadedHistory;
        setPastBands(migratedHistory);
        try { localStorage.setItem('jamSessionHistory', JSON.stringify(migratedHistory)); } catch {}
      } catch (e) { console.error(e); }
    }
  }, []);

  // Persist view state
  useEffect(() => {
    localStorage.setItem('jamSessionView', viewState);
    viewRef.current = viewState;
  }, [viewState]);

  // Save users to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem('jamSessionUsers', JSON.stringify(users));
    usersRef.current = users;
  }, [users]);

  // Save bands to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem('jamSessionBands', JSON.stringify(bands));
    bandsRef.current = bands;
  }, [bands]);

  // Auto-init timer when first band is added (empty -> has bands)
  const prevBandsLength = useRef(0);
  useEffect(() => {
      // If we went from 0 bands to >0 bands, and timer is at 0, initialize it.
      if (prevBandsLength.current === 0 && bands.length > 0) {
          if (timerSeconds === 0 && !isTimerRunning) {
              setTimerSeconds((bands[0].durationMinutes || 6) * 60);
          }
      }
      prevBandsLength.current = bands.length;
  }, [bands, isTimerRunning, timerSeconds]);

  // Save history
  useEffect(() => {
    localStorage.setItem('jamSessionHistory', JSON.stringify(pastBands));
    pastBandsRef.current = pastBands;
  }, [pastBands]);

  // GLOBAL TIMER INTERVAL
  useEffect(() => {
    let interval: number | undefined;
    if (isTimerRunning && timerSeconds > 0) {
      interval = window.setInterval(() => {
        setTimerSeconds(prev => {
            if (prev <= 1) {
                setIsTimerRunning(false);
                return 0;
            }
            return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  // Aggiorna ref del timer
  useEffect(() => {
    timerRef.current = timerSeconds;
  }, [timerSeconds]);

  // AUTOSAVE: snapshot completo ogni 5 minuti + salvataggio su beforeunload
  useEffect(() => {
    const snapshot = () => {
      const data = {
        users: usersRef.current,
        bands: bandsRef.current,
        pastBands: pastBandsRef.current,
        viewState: viewRef.current,
        timerSeconds: timerRef.current,
        exportDate: new Date().toISOString(),
      };
      try {
        localStorage.setItem('jamSessionBackupLast', JSON.stringify(data));
        const historyRaw = localStorage.getItem('jamSessionBackupHistory');
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        history.push(data);
        while (history.length > 12) history.shift(); // ~1h di cronologia (12 x 5min)
        localStorage.setItem('jamSessionBackupHistory', JSON.stringify(history));
      } catch (e) {
        console.error('Autosave backup failed', e);
      }
    };

    const intervalId = window.setInterval(snapshot, 5 * 60 * 1000);
    window.addEventListener('beforeunload', snapshot);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('beforeunload', snapshot);
    };
  }, []);

  // Prompt di ripristino da backup se all'avvio risultano vuoti ma esiste snapshot
  useEffect(() => {
    if (hasCheckedRestoreRef.current) return;
    hasCheckedRestoreRef.current = true;
    try {
      const raw = localStorage.getItem('jamSessionBackupLast');
      if (!raw) return;
      const snap = JSON.parse(raw);
      const hasData = Array.isArray(snap?.users) && snap.users.length > 0;
      const currentEmpty = users.length === 0 && bands.length === 0 && pastBands.length === 0;
      if (hasData && currentEmpty) {
        const ok = window.confirm('Trovato un backup automatico recente. Vuoi ripristinarlo?');
        if (ok) {
          setUsers(snap.users || []);
          setBands(snap.bands || []);
          setPastBands(snap.pastBands || []);
          setViewState(snap.viewState || 'HOME');
          setTimerSeconds(snap.timerSeconds || 0);
        }
      }
    } catch (e) {
      console.error('Failed to load autosave snapshot', e);
    }
  }, [users, bands, pastBands]);

  const handleRegister = (newUser: User) => {
    // Prevent duplicate usernames (case-insensitive)
    setUsers(prev => {
      const exists = prev.some(u => u.username.toLowerCase() === newUser.username.toLowerCase());
      if (exists) {
        alert('Nome utente già utilizzato. Scegli un altro username.');
        return prev; // Do not add
      }
      const updated = [...prev, newUser];
      try {
        localStorage.setItem('jamSessionUsers', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist users instantly', e);
      }
      return updated;
    });
  };

  // Removes the current band (index 0) and archives it to history
  const handleBandComplete = (playedGames: string[] = []) => {
    // 1. Calculate duration for the NEXT band (which will become index 0)
    // We access 'bands' from state closure. If bands has at least 2 items, the second one (index 1) becomes first.
    const nextBand = bands.length > 1 ? bands[1] : null;
    const nextDuration = nextBand ? (nextBand.durationMinutes || 6) * 60 : 0;
    
    // Update Timer immediately for smooth transition
    setTimerSeconds(nextDuration);
    setIsTimerRunning(false);

    setBands(prev => {
        if (prev.length === 0) return prev;
        
        const finishedBand = prev[0];
        
        // Add timestamp to history and record games played
        const archivedBand = {
            ...finishedBand,
            endTime: new Date().toISOString(),
            playedGames: playedGames
        };

        setPastBands(history => [...history, archivedBand]);

        // Remove the first element (current band)
        return prev.slice(1);
    });
  };

  // Allows adding a member to the CURRENTLY playing band
  const handleAddMemberToCurrentBand = (user: User, role: InstrumentType) => {
    setBands(prev => {
      if (prev.length === 0) return prev;
      
      const currentBand = { ...prev[0] };
      
      // Safety check: don't add if already exists
      if (currentBand.members.find(m => m.id === user.id)) return prev;

      // Add member with assigned role
      const newMember = { ...user, assignedRole: role };
      currentBand.members = [...currentBand.members, newMember];

      // Update state: Replace first band with updated one, keep rest
      return [currentBand, ...prev.slice(1)];
    });
  };

  // Allows removing a member from the CURRENTLY playing band
  const handleRemoveMemberFromCurrentBand = (userId: string) => {
    setBands(prev => {
      if (prev.length === 0) return prev;
      
      // Clone the array AND the current band object to ensure React detects the change
      const newBands = [...prev];
      const currentBand = { ...newBands[0] };
      
      // Filter out the member
      currentBand.members = currentBand.members.filter(m => m.id !== userId);

      // Re-assign the updated band to the new array
      newBands[0] = currentBand;

      return newBands;
    });
  };

  const handleUpdateBandName = (bandId: string, newName: string) => {
    setBands(prev => prev.map(b => b.id === bandId ? { ...b, name: newName } : b));
  };

  const renderView = () => {
    switch (viewState) {
      case 'HOME':
        return <Home setViewState={setViewState} />;
      case 'REGISTER':
        return <Registration setViewState={setViewState} onRegister={handleRegister} />;
      case 'ADMIN':
        return <AdminDashboard 
          users={users} 
          setUsers={setUsers} 
          setViewState={setViewState} 
          bands={bands} 
          setBands={setBands}
          pastBands={pastBands} 
          // Timer Control for Editing Sync
          setTimerSeconds={setTimerSeconds}
          isTimerRunning={isTimerRunning}
        />;
      case 'PROJECTOR':
        return <ProjectorView 
          bands={bands}
          pastBands={pastBands}
          allUsers={users}
          setViewState={setViewState} 
          onNextBand={handleBandComplete} 
          onAddMember={handleAddMemberToCurrentBand}
          onRemoveMember={handleRemoveMemberFromCurrentBand}
          onUpdateBandName={handleUpdateBandName}
          // Pass Global Timer Props
          timeLeft={timerSeconds}
          setTimeLeft={setTimerSeconds}
          isRunning={isTimerRunning}
          setIsRunning={setIsTimerRunning}
        />;
      default:
        return <Home setViewState={setViewState} />;
    }
  };

  return (
    <div className="antialiased text-white bg-slate-900">
      {renderView()}
    </div>
  );
};

export default App;
