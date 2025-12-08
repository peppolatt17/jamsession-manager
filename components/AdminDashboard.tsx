import React, { useState, useRef } from 'react';
import { ViewState, User, Band, InstrumentType, Game } from '../types';
import { generateNextBand, getUniqueBandName } from '../services/jamLogic';
import { INSTRUMENTS, BAND_NAMES, GAMES } from '../constants';
import { HarmonicRouletteFixed } from './HarmonicRoulette';
import { Users, Edit3, Trash2, Plus, LogOut, RefreshCw, CheckCircle, Music, GripVertical, Clock, X, BarChart2, Dices, Mic, Guitar, Drum, Piano, MoreHorizontal, ChevronLeft, Play, Coffee, MonitorPlay, AlertTriangle, Gamepad2, Hand, Footprints, Maximize2, Download, Upload, Trophy, Star, Moon, Shuffle, ChevronDown, ChevronUp, Calendar, Mail, Phone, Instagram, Facebook, Twitter, ExternalLink, Copy, MessageCircle, LayoutGrid, List } from 'lucide-react';
import { useTabletMode } from '../hooks/useTabletMode';
import { toSocialUrl, normalizeHandle } from '../utils/social';
import { toWhatsAppUrl } from '../utils/phone';
import { getAvatarUrl } from '../utils/avatar';

interface AdminDashboardProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setViewState: (view: ViewState) => void;
  bands: Band[];
  setBands: React.Dispatch<React.SetStateAction<Band[]>>;
  pastBands: Band[];
  setTimerSeconds: React.Dispatch<React.SetStateAction<number>>;
  isTimerRunning: boolean;
}

// Reusable Icon getter
const getInstrumentIcon = (type: InstrumentType, className: string = "w-5 h-5") => {
  switch (type) {
    case InstrumentType.VOICE: return <Mic className={className} />;
    case InstrumentType.GUITAR: return <Guitar className={className} />;
    case InstrumentType.BASS: return <Guitar className={className} />;
    case InstrumentType.DRUMS: return <Drum className={className} />;
    case InstrumentType.KEYS: return <Piano className={className} />;
    case InstrumentType.OTHER: return <MoreHorizontal className={className} />;
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

// --- NEW MANUAL EDITOR COMPONENT ---
const ManualBandEditor = ({ 
  band, 
  allUsers, 
  onAddMember,
  onSave, 
  onCancel,
  forbiddenUserIds 
}: { 
  band: Band, 
  allUsers: User[], 
  onAddMember: (user: User, role: InstrumentType) => void,
  onSave: () => void, 
  onCancel: () => void,
  forbiddenUserIds: Set<string>
}) => {
  const [selectingRole, setSelectingRole] = useState<InstrumentType | null>(null);

  // Check which single-slot instruments are already occupied in this band
  const occupiedRoles = new Set(band.members.map(m => m.assignedRole));

  const availableUsersForRole = selectingRole ? allUsers.filter(u => {
    // Must contain the instrument
    const hasInstrument = u.instruments.includes(selectingRole);
    // Must be ACTIVE
    const isActive = u.status === 'ACTIVE';
    // Must NOT be already in THIS band
    const notInBand = !band.members.find(m => m.id === u.id);
    // Must NOT be in the PREVIOUS or NEXT band (Cooldown)
    const notInCooldown = !forbiddenUserIds.has(u.id);
    
    return hasInstrument && isActive && notInBand && notInCooldown;
  }) : [];

  const handleUserSelect = (u: User) => {
    if (selectingRole) {
        onAddMember(u, selectingRole);
        setSelectingRole(null); // Go back to buttons
    }
  };

  return (
    <div className="mt-4 bg-slate-900/50 p-4 rounded-lg border border-slate-600 animate-fade-in cursor-default" onDragStart={(e) => e.stopPropagation()} draggable={true}>
      
      {selectingRole ? (
        // --- SELECTION VIEW ---
        <div className="animate-fade-in">
           <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
             <button onClick={() => setSelectingRole(null)} className="flex items-center text-slate-400 hover:text-white text-sm font-bold">
               <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
             </button>
             <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-sm">
                {getInstrumentIcon(selectingRole)}
                Scegli {selectingRole}
             </div>
           </div>

           <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {availableUsersForRole.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Nessun musicista disponibile (o tutti in pausa/band adiacenti).</p>
              ) : (
                availableUsersForRole.map(u => (
                  <div key={u.id} onClick={() => handleUserSelect(u)} className="flex items-center p-2 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer border border-transparent hover:border-indigo-500/50 transition">
                      <img src={getAvatarUrl(u.avatarSeed || u.username)} className="w-8 h-8 rounded-full bg-slate-700 mr-3" alt="av" />
                      <div>
                        <div className="font-bold text-sm text-slate-200">{u.firstName} {u.lastName}</div>
                        <div className="text-[10px] text-slate-500">
                          {u.instruments
                            .map(inst => inst === InstrumentType.OTHER && u.customInstrument ? u.customInstrument : inst)
                            .join(', ')
                          }
                        </div>
                      </div>
                      <Plus className="w-4 h-4 ml-auto text-indigo-400" />
                  </div>
                ))
              )}
           </div>
        </div>
      ) : (
        // --- DASHBOARD VIEW (BUTTONS ONLY) ---
        <div className="space-y-4">
           <div className="flex justify-between items-center mb-2">
             <h4 className="text-sm font-bold text-indigo-300 uppercase">Aggiungi Componente</h4>
           </div>

           <div className="grid grid-cols-3 gap-2">
              {INSTRUMENTS.map(inst => {
                // Logic: Disable if role is occupied AND it's NOT a multi-slot instrument (Voice/Other)
                const isTaken = occupiedRoles.has(inst.type) && 
                                inst.type !== InstrumentType.VOICE && 
                                inst.type !== InstrumentType.OTHER;

                return (
                  <button
                    key={inst.type}
                    onClick={() => !isTaken && setSelectingRole(inst.type)}
                    disabled={isTaken}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition group relative overflow-hidden
                        ${isTaken 
                            ? 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed' 
                            : 'bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-700'
                        }`}
                  >
                      <div className={`mb-1 ${isTaken ? 'text-slate-600' : 'text-slate-400 group-hover:text-white'}`}>
                        {getInstrumentIcon(inst.type, "w-5 h-5")}
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${isTaken ? 'text-slate-600' : 'text-slate-400 group-hover:text-indigo-300'}`}>{inst.label}</span>
                      {isTaken && <div className="absolute inset-0 bg-slate-950/20"></div>}
                  </button>
                );
              })}
           </div>

           <div className="flex gap-3 pt-2 mt-4 border-t border-slate-700">
            <button
              onClick={onSave}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg"
            >
              <CheckCircle className="w-4 h-4" />
              Fatto
            </button>
            <button
              onClick={onCancel}
              className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg text-sm font-bold transition"
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, setUsers, setViewState, bands, setBands, pastBands, setTimerSeconds, isTimerRunning }) => {
  const [activeTab, setActiveTab] = useState<'DB' | 'AUTO' | 'MANUAL' | 'STATS' | 'GAMES'>('DB');
  const [editingBandId, setEditingBandId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [viewingUserDetails, setViewingUserDetails] = useState<User | null>(null);
  const [targetBandSize, setTargetBandSize] = useState<number>(0); // 0 = Random
  const [viewingGame, setViewingGame] = useState<Game | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [dbViewMode, setDbViewMode] = useState<'LIST' | 'GROUPS'>('LIST');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const TRASH_INDEX = -1;
  const [isDragging, setIsDragging] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const isTablet = useTabletMode();
  const [pressedGameId, setPressedGameId] = useState<string | null>(null);

  // --- Actions ---

  const handleExportData = () => {
    const data = {
      users,
      bands,
      pastBands,
      exportDate: new Date().toISOString()
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `jamsession-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.users && Array.isArray(json.users)) {
          if (window.confirm("Attenzione: questo sovrascriverà tutti i dati attuali. Sei sicuro di voler importare il backup?")) {
            setUsers(json.users);
            setBands(json.bands || []);
            localStorage.setItem('jamSessionUsers', JSON.stringify(json.users));
            localStorage.setItem('jamSessionBands', JSON.stringify(json.bands || []));
            localStorage.setItem('jamSessionHistory', JSON.stringify(json.pastBands || []));
            window.location.reload();
          }
        } else {
          alert("File non valido.");
        }
      } catch (err) {
        console.error(err);
        alert("Errore durante la lettura del file.");
      }
  };
    reader.readAsText(file);
    e.target.value = ''; 
  };


  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' };
      }
      return u;
    }));
  };

  const confirmDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setUserToDelete(null);
  };

  const handleAddAutoBand = () => {
    const activeCount = users.filter(u => u.status === 'ACTIVE').length;
    if (activeCount < 3) {
      alert(`Impossibile generare le formazioni. Servono almeno 3 iscritti ATTIVI.`);
      return;
    }
    if (bands.length >= 15) {
      if (!window.confirm('Hai molte band. Vuoi aggiungerne comunque una nuova?')) {
        return;
      }
    }

    const newBand = generateNextBand(users, bands, pastBands, targetBandSize);
    if (newBand) {
      setBands(prev => [...prev, newBand]);
    } else {
      alert("Impossibile creare una band con gli utenti attuali. Controlla che ci siano abbastanza batteristi/bassisti attivi.");
    }
  };

  const handleUpdateBandName = (bandId: string, newName: string) => {
    setBands(prev => prev.map(b => b.id === bandId ? { ...b, name: newName } : b));
  };
  
  const handleShuffleBandName = (bandId: string) => {
    const usedNames = new Set([
        ...bands.map(b => b.name),
        ...pastBands.map(b => b.name)
    ]);
    const uniqueName = getUniqueBandName(usedNames);
    handleUpdateBandName(bandId, uniqueName);
  };

  const handleUpdateDuration = (bandId: string, newDuration: string) => {
    const val = parseFloat(newDuration) || 0;
    setBands(prev => {
        const newBands = prev.map(b => b.id === bandId ? { ...b, durationMinutes: val } : b);
        if (newBands.length > 0 && newBands[0].id === bandId && !isTimerRunning) {
            setTimerSeconds(val * 60);
        }
        return newBands;
    });
  };

  const handleAddManualBand = () => {
    const usedNames = new Set([
        ...bands.map(b => b.name),
        ...pastBands.map(b => b.name)
    ]);
    const uniqueName = getUniqueBandName(usedNames);
    const newBand: Band = {
      id: `manual-${Date.now()}`,
      name: uniqueName,
      members: [],
      isManual: true,
      durationMinutes: 6
    };
    setBands([...bands, newBand]);
    setEditingBandId(newBand.id);
  };

  const handleAddMemberToBand = (bandId: string, user: User, role: InstrumentType) => {
      setBands(prev => prev.map(b => {
          if (b.id === bandId) {
              const newMember = { ...user, assignedRole: role };
              return { ...b, members: [...b.members, newMember] };
          }
          return b;
      }));
  };

  const handleRemoveMemberFromBand = (bandId: string, userId: string) => {
    setBands(prev => prev.map(b => {
        if (b.id === bandId) {
            return { ...b, members: b.members.filter(m => m.id !== userId) };
        }
        return b;
    }));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    if (!isOverTrash) {
       dragOverItem.current = index;
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsOverTrash(false);
    if (dragItem.current === null) return;

    const currentIndex = dragItem.current;
    const destinationIndex = dragOverItem.current;

    dragItem.current = null;
    dragOverItem.current = null;

    if (destinationIndex === TRASH_INDEX) {
      const _bands = [...bands];
      if (editingBandId === _bands[currentIndex].id) {
        setEditingBandId(null);
      }
      _bands.splice(currentIndex, 1);
      setBands(_bands);
      return;
    }

    if (destinationIndex !== null && destinationIndex !== currentIndex) {
      const _bands = [...bands];
      const draggedItemContent = _bands.splice(currentIndex, 1)[0];
      _bands.splice(destinationIndex, 0, draggedItemContent);
      setBands(_bands);
    }
  };

  const handleTrashDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverItem.current = TRASH_INDEX;
    setIsOverTrash(true);
  };

  const handleTrashDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverTrash(false);
  };

  const handleTrashDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const renderRoleBadge = (role: InstrumentType | undefined, customName: string | undefined) => {
      const colors: Record<string, string> = {
          [InstrumentType.VOICE]: 'bg-blue-600 text-white border-blue-500',
          [InstrumentType.GUITAR]: 'bg-orange-600 text-white border-orange-500',
          [InstrumentType.BASS]: 'bg-purple-600 text-white border-purple-500',
          [InstrumentType.DRUMS]: 'bg-red-600 text-white border-red-500',
          [InstrumentType.KEYS]: 'bg-yellow-600 text-white border-yellow-500',
          [InstrumentType.OTHER]: 'bg-gray-600 text-white border-gray-500',
      };
      
      const roleKey = role || InstrumentType.OTHER;
      const displayLabel = (roleKey === InstrumentType.OTHER && customName) ? customName : roleKey;

      return (
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${colors[roleKey] || colors[InstrumentType.OTHER]}`}>
              {displayLabel}
          </span>
      );
  };

  const renderDatabase = () => {
    const playCounts: Record<string, number> = {};
    [...pastBands, ...bands].forEach(b => b.members.forEach(m => {
        playCounts[m.id] = (playCounts[m.id] || 0) + 1;
    }));

    return (
        <div className="space-y-4">
            {dbViewMode === 'LIST' ? (
                <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
                            <tr>
                            <th className="px-6 py-4">Avatar</th>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Stage Name</th>
                            <th className="px-6 py-4">Presenze</th>
                            <th className="px-6 py-4">Strumenti</th>
                            <th className="px-6 py-4 text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {users.map(user => (
                            <tr 
                                key={user.id} 
                                onClick={() => setViewingUserDetails(user)}
                                className={`hover:bg-slate-700/50 transition-colors cursor-pointer ${user.status === 'PAUSED' ? 'opacity-50 grayscale' : ''}`}
                            >
                                <td className="px-6 py-4">
                                <img 
                                    src={getAvatarUrl(user.avatarSeed || user.username)} 
                                    alt="avatar" 
                                    className="w-10 h-10 rounded-full bg-slate-600"
                                />
                                </td>
                                <td className="px-6 py-4 font-medium">
                                {user.firstName} {user.lastName}
                                </td>
                                <td className="px-6 py-4">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleUserStatus(user.id);
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${user.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'}`}
                                >
                                    {user.status === 'ACTIVE' ? <Play className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
                                    {user.status === 'ACTIVE' ? 'ATTIVO' : 'IN PAUSA'}
                                </button>
                                </td>
                                <td className="px-6 py-4 text-indigo-400">@{user.username}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${playCounts[user.id] ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-700 text-slate-400'}`}>
                                        {playCounts[user.id] || 0}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {user.instruments.map(i => (
                                        <span key={i} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                                            {i === InstrumentType.OTHER && user.customInstrument ? user.customInstrument : i}
                                        </span>
                                    ))}
                                </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                {userToDelete === user.id ? (
                                    <div className="flex items-center justify-end gap-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            confirmDeleteUser(user.id);
                                        }}
                                        className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold"
                                    >
                                        Conferma
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUserToDelete(null);
                                        }} 
                                        className="text-slate-400 hover:text-slate-200"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUserToDelete(user.id);
                                        }} 
                                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-full"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {INSTRUMENTS.map(inst => {
                        const groupedUsers = users.filter(u => u.instruments.includes(inst.type));
                        if (groupedUsers.length === 0) return null;

                        return (
                            <div key={inst.type} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col shadow-lg">
                                <div className="bg-slate-900/80 p-4 border-b border-slate-700 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                            {getInstrumentIcon(inst.type)}
                                        </div>
                                        <h3 className="font-bold text-white uppercase tracking-wider">{inst.label}</h3>
                                    </div>
                                    <span className="bg-slate-700 text-white text-xs font-bold px-2 py-1 rounded-full">{groupedUsers.length}</span>
                                </div>
                                <div className="p-2 overflow-y-auto max-h-[300px] custom-scrollbar">
                                    {groupedUsers.map(user => (
                                        <div 
                                            key={user.id} 
                                            onClick={() => setViewingUserDetails(user)}
                                            className="flex items-center p-2 hover:bg-slate-700/50 rounded-lg cursor-pointer group transition-colors"
                                        >
                                            <img 
                                                src={getAvatarUrl(user.avatarSeed || user.username)} 
                                                alt="avatar" 
                                                className="w-8 h-8 rounded-full bg-slate-600 mr-3"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-slate-200 group-hover:text-white truncate">
                                                    {user.firstName} {user.lastName}
                                                </div>
                                                <div className="text-xs text-slate-500">@{user.username}</div>
                                            </div>
                                            {inst.type === InstrumentType.OTHER && user.customInstrument && (
                                                <span className="text-[10px] bg-slate-700 px-2 py-1 rounded text-slate-300 ml-2 whitespace-nowrap">
                                                    {user.customInstrument}
                                                </span>
                                            )}
                                            <div className={`w-2 h-2 rounded-full ml-3 ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
  };

  const renderStats = () => {
    const appearances: Record<string, number> = {};
    const minutesPlayed: Record<string, number> = {};
    const instrumentsPlayed: Record<string, Set<InstrumentType>> = {};

    [...pastBands, ...bands].forEach(b => {
      b.members.forEach(m => {
        appearances[m.id] = (appearances[m.id] || 0) + 1;
        minutesPlayed[m.id] = (minutesPlayed[m.id] || 0) + (b.durationMinutes || 6);
        if (!instrumentsPlayed[m.id]) instrumentsPlayed[m.id] = new Set();
        if (m.assignedRole) instrumentsPlayed[m.id].add(m.assignedRole);
      });
    });
    
    const instrumentTotalCounts: Record<string, number> = {};
    [...pastBands, ...bands].forEach(b => b.members.forEach(m => {
        const role = m.assignedRole || InstrumentType.OTHER;
        instrumentTotalCounts[role] = (instrumentTotalCounts[role] || 0) + 1;
    }));

    const sortedUsers = [...users].sort((a, b) => (appearances[b.id] || 0) - (appearances[a.id] || 0)).slice(0, 5);
    const sortedInstruments = Object.entries(instrumentTotalCounts).sort((a, b) => b[1] - a[1]);
    const totalJams = pastBands.length + bands.length;

    const getTopUser = (metric: Record<string, number>) => {
        const sorted = Object.entries(metric).sort((a, b) => b[1] - a[1]);
        return sorted.length > 0 ? users.find(u => u.id === sorted[0][0]) : null;
    };

    const stakanovista = getTopUser(minutesPlayed);
    
    const uniqueInstCounts: Record<string, number> = {};
    Object.keys(instrumentsPlayed).forEach(uid => {
        uniqueInstCounts[uid] = instrumentsPlayed[uid].size;
    });
    const jolly = getTopUser(uniqueInstCounts);

    const lastBand = pastBands.length > 0 ? pastBands[pastBands.length - 1] : null;
    const nightOwl = lastBand && lastBand.members.length > 0 ? lastBand.members[Math.floor(Math.random() * lastBand.members.length)] : null;


    return (
      <div className="space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Hall of Fame</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
                  <div className="bg-red-500/20 p-3 rounded-full text-red-400">
                      <Clock className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Stakanovista</p>
                      {stakanovista ? (
                          <>
                            <h4 className="font-bold text-white text-lg">{stakanovista.firstName}</h4>
                            <span className="text-xs text-slate-500">{minutesPlayed[stakanovista.id]} min suonati</span>
                          </>
                      ) : <span className="text-slate-600 italic">--</span>}
                  </div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
                  <div className="bg-purple-500/20 p-3 rounded-full text-purple-400">
                      <Star className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Jolly</p>
                      {jolly ? (
                          <>
                            <h4 className="font-bold text-white text-lg">{jolly.firstName}</h4>
                            <span className="text-xs text-slate-500">{uniqueInstCounts[jolly.id]} strumenti diversi</span>
                          </>
                      ) : <span className="text-slate-600 italic">--</span>}
                  </div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
                  <div className="bg-indigo-500/20 p-3 rounded-full text-indigo-400">
                      <Moon className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Night Owl</p>
                      {nightOwl ? (
                          <>
                            <h4 className="font-bold text-white text-lg">{nightOwl.firstName}</h4>
                            <span className="text-xs text-slate-500">Ultimo a scendere</span>
                          </>
                      ) : <span className="text-slate-600 italic">--</span>}
                  </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center"><BarChart2 className="w-5 h-5 mr-2 text-indigo-400" /> Top Players</h3>
            <div className="space-y-3">
                {sortedUsers.map((u, idx) => (
                <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-bold w-4">{idx + 1}.</span>
                        <img src={getAvatarUrl(u.avatarSeed || u.username)} className="w-8 h-8 rounded-full bg-slate-700" alt="av" />
                        <span>{u.firstName} {u.lastName}</span>
                    </div>
                    <span className="font-bold text-indigo-400">{appearances[u.id] || 0} Jam</span>
                </div>
                ))}
            </div>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center"><Music className="w-5 h-5 mr-2 text-pink-400" /> Strumenti più suonati</h3>
            <div className="space-y-3">
                {sortedInstruments.map(([inst, count]) => (
                    <div key={inst} className="flex items-center justify-between">
                    <span className="text-slate-300">{inst}</span>
                    <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500" style={{ width: totalJams > 0 ? `${(count / (totalJams * 4)) * 100}%` : '0%' }}></div>
                        </div>
                        <span className="text-xs font-bold w-6 text-right">{count}</span>
                    </div>
                    </div>
                ))}
            </div>
            </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Calendar className="w-5 h-5 text-emerald-500" /> Storico Formazioni</h3>
            
            <div className="space-y-2">
                {[...pastBands].reverse().map((band, idx) => {
                    const isExpanded = expandedHistoryId === band.id;
                    const startTime = band.endTime ? new Date(new Date(band.endTime).getTime() - ((band.durationMinutes || 6) * 60000)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';

                    return (
                        <div key={band.id} className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/30">
                            <button 
                                onClick={() => setExpandedHistoryId(isExpanded ? null : band.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-500 font-mono text-sm">#{pastBands.length - idx}</span>
                                    <div className="text-left">
                                        <h4 className="font-bold text-white">{band.name}</h4>
                                        <span className="text-xs text-slate-500">{startTime} • {band.durationMinutes} min</span>
                                    </div>
                                </div>
                                {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </button>
                            
                            {isExpanded && (
                                <div className="p-4 border-t border-slate-700 bg-slate-900/50 animate-fade-in">
                                    {band.playedGames && band.playedGames.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {band.playedGames.map((game, gIdx) => (
                                                <span key={gIdx} className="px-2 py-1 bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded text-xs font-bold flex items-center gap-1">
                                                    <Gamepad2 className="w-3 h-3" /> {game}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {band.members.map(m => (
                                            <div key={m.id} className="flex items-center gap-2 text-sm bg-slate-800 p-2 rounded">
                                <img src={getAvatarUrl(m.avatarSeed || m.username)} className="w-6 h-6 rounded-full bg-slate-700" alt="av" />
                                                <span className="text-slate-300">{m.firstName}</span>
                                                {renderRoleBadge(m.assignedRole, m.customInstrument)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {pastBands.length === 0 && <p className="text-slate-500 text-center italic py-4">Nessuna formazione archiviata.</p>}
            </div>
        </div>
      </div>
    );
  }

  const renderBandCard = (band: Band, index: number, allowDrag: boolean, showEditButton: boolean) => {
    const isEditing = editingBandId === band.id;
    const previousBand = index > 0 ? bands[index - 1] : (pastBands.length > 0 ? pastBands[pastBands.length - 1] : null);
    const nextBand = index < bands.length - 1 ? bands[index + 1] : null;

    const forbiddenUserIds = new Set<string>([
        ...(previousBand ? previousBand.members.map(m => m.id) : []),
        ...(nextBand ? nextBand.members.map(m => m.id) : [])
    ]);

    return (
    <div 
      key={band.id} 
      className={`rounded-xl p-4 border shadow-lg flex flex-col relative transition-all group duration-200 bg-slate-800 border-slate-700 ${allowDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging && dragItem.current === index ? 'opacity-50 scale-95' : 'opacity-100'}`}
      draggable={allowDrag}
      onDragStart={(e) => allowDrag && handleDragStart(e, index)}
      onDragEnter={(e) => allowDrag && handleDragEnter(e, index)}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      {band.isManual && (
        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg z-10 shadow-md shadow-indigo-900/40">
          Manuale
        </div>
      )}

      <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2 mt-1">
        <div className="flex items-center flex-1">
           {allowDrag && <div className="mr-2 text-slate-600 group-hover:text-slate-400"><GripVertical className="w-5 h-5" /></div>}
           <div className="flex flex-col w-full">
             <div className="flex justify-between w-full items-center">
                <div className="flex items-center flex-1 mr-2">
                    <input
                        type="text"
                        value={band.name}
                        onChange={(e) => handleUpdateBandName(band.id, e.target.value)}
                        className="bg-transparent text-lg font-bold text-indigo-400 focus:text-indigo-300 outline-none border-b border-transparent focus:border-indigo-500 w-full"
                        placeholder="Nome Band"
                    />
                    <button 
                        onClick={() => handleShuffleBandName(band.id)}
                        className="ml-2 text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-700 transition"
                        title="Cambia nome random"
                    >
                        <Dices className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 whitespace-nowrap pt-1">#{index + 1}</span>
                  {isTablet && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (index <= 0) return;
                          const arr = [...bands];
                          const [item] = arr.splice(index, 1);
                          arr.splice(index - 1, 0, item);
                          setBands(arr);
                        }}
                        className={`p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 ${index <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Sposta su"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (index >= bands.length - 1) return;
                          const arr = [...bands];
                          const [item] = arr.splice(index, 1);
                          arr.splice(index + 1, 0, item);
                          setBands(arr);
                        }}
                        className={`p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 ${index >= bands.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Sposta giù"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const arr = [...bands];
                          if (editingBandId === band.id) setEditingBandId(null);
                          arr.splice(index, 1);
                          setBands(arr);
                        }}
                        className="p-1 rounded text-red-400 hover:text-white hover:bg-red-700"
                        title="Elimina band"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
             </div>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 bg-slate-900/30 p-2 rounded">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-400">Durata:</span>
          <button
            type="button"
            onClick={() => {
              const cur = band.durationMinutes || 6;
              const next = Math.max(0, cur - 0.5);
              handleUpdateDuration(band.id, String(next));
            }}
            className="px-2 py-1 rounded bg-slate-800/70 hover:bg-slate-700 text-white text-xs font-bold"
            title="-0.5 min"
          >
            -
          </button>
          <input 
            type="number" 
            step="0.5"
            value={band.durationMinutes || 6} 
            onChange={(e) => handleUpdateDuration(band.id, e.target.value)}
            className="w-16 bg-transparent border-b border-slate-600 text-center text-sm font-bold focus:border-indigo-500 outline-none"
          />
          <button
            type="button"
            onClick={() => {
              const cur = band.durationMinutes || 6;
              const next = Math.max(0, cur + 0.5);
              handleUpdateDuration(band.id, String(next));
            }}
            className="px-2 py-1 rounded bg-slate-800/70 hover:bg-slate-700 text-white text-xs font-bold"
            title="+0.5 min"
          >
            +
          </button>
          <span className="text-xs text-slate-400">min</span>
      </div>
      
      <div className="space-y-2 flex-1">
        {band.members.length === 0 ? (
          <p className="text-slate-500 text-sm italic py-2 text-center">Nessun membro</p>
        ) : (
          band.members.map(m => (
            <div key={m.id} className={`flex items-center justify-between text-sm bg-slate-900/50 p-2 rounded-lg border ${isEditing ? 'border-indigo-900/50' : 'border-slate-700/50'}`}>
               <div className="flex items-center gap-2">
                                <img src={getAvatarUrl(m.avatarSeed || m.username)} className="w-6 h-6 rounded-full bg-slate-700" alt="av" />
                   <span className="font-bold text-slate-200">{m.firstName} {m.lastName}</span>
               </div>
               <div className="flex items-center gap-2">
                  {renderRoleBadge(m.assignedRole, m.customInstrument)}
                  {isEditing && (
                    <button 
                      onClick={() => handleRemoveMemberFromBand(band.id, m.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded p-0.5"
                      title="Rimuovi"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
               </div>
            </div>
          ))
        )}
      </div>

      {showEditButton && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          {isEditing ? (
            <ManualBandEditor 
              band={band} 
              allUsers={users} 
              onAddMember={(u, r) => handleAddMemberToBand(band.id, u, r)}
              onSave={() => setEditingBandId(null)} 
              onCancel={() => setEditingBandId(null)}
              forbiddenUserIds={forbiddenUserIds}
            />
          ) : (
            <button 
              onClick={() => setEditingBandId(band.id)}
              className="w-full bg-slate-700 hover:bg-indigo-600 hover:text-white text-slate-300 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center"
            >
              <Edit3 className="w-4 h-4 mr-2" /> Modifica
            </button>
          )}
        </div>
      )}
    </div>
  );
  }

  // --- Header Renderer ---
  const renderSectionHeader = (title: string, subtitle: string, rightContent: React.ReactNode) => (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-8 min-h-[120px]">
       <div className="col-span-1 md:col-span-5 flex flex-col justify-center">
          <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
          <p className="text-slate-400 text-sm">{subtitle}</p>
       </div>
       <div className="col-span-1 md:col-span-2 flex justify-center">
       </div>
       <div className="col-span-1 md:col-span-5 flex justify-end items-center">
          {rightContent}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white relative">
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
      
      {viewingGame && (
        viewingGame.id === 'game-harmonic' ? (
             <div className="fixed inset-0 z-[200] bg-slate-900 text-white flex flex-col items-center justify-center animate-fade-in p-8">
                 <button 
                   onClick={() => setViewingGame(null)}
                   className="absolute top-6 right-6 bg-slate-800 hover:bg-slate-700 p-3 rounded-full border border-slate-600 transition"
                 >
                   <X className="w-8 h-8 text-white" />
                 </button>
                 <HarmonicRouletteFixed onExit={() => setViewingGame(null)} />
             </div>
        ) : (
        <div className={`fixed inset-0 z-[200] bg-gradient-to-br ${viewingGame.color} flex flex-col animate-fade-in`}>
            <div className="absolute top-6 right-6 z-50">
              <button 
                onClick={() => setViewingGame(null)}
                className="bg-black/20 text-white hover:bg-white hover:text-black p-3 rounded-full backdrop-blur-md transition border-2 border-white/20 shadow-xl"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white overflow-y-auto">
               <div className="mb-8 p-8 bg-white/20 rounded-full backdrop-blur-md shadow-2xl">
                  {getGameIcon(viewingGame.icon, "w-24 h-24 md:w-32 md:h-32")}
               </div>
               
               <h1 className="text-5xl md:text-8xl font-black mb-8 uppercase tracking-tight drop-shadow-lg leading-none">
                  {viewingGame.title}
               </h1>
               
               <div className="max-w-5xl bg-black/20 p-8 md:p-12 rounded-3xl backdrop-blur-sm border border-white/10 shadow-2xl">
                  <p className="text-2xl md:text-4xl font-medium leading-relaxed">
                     {viewingGame.description}
                  </p>
               </div>
            </div>
        </div>
        )
      )}

      {/* USER DETAILS MODAL */}
      {viewingUserDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
              <div className="bg-slate-900/50 p-6 flex flex-col items-center border-b border-slate-700">
                  <button 
                    onClick={() => setViewingUserDetails(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-full transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  
                  <img 
                    src={getAvatarUrl(viewingUserDetails.avatarSeed || viewingUserDetails.username)} 
                    className="w-24 h-24 rounded-full bg-slate-700 mb-4 shadow-xl border-4 border-slate-600" 
                    alt="avatar" 
                  />
                  <h2 className="text-2xl font-bold text-white">{viewingUserDetails.firstName} {viewingUserDetails.lastName}</h2>
                  <p className="text-indigo-400 font-medium">@{viewingUserDetails.username}</p>
              </div>

              <div className="p-6 space-y-6">
                  {/* Instruments */}
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

                  {/* Contacts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <h4 className="text-xs uppercase font-bold text-slate-500 mb-3 tracking-wider">Contatti</h4>
                          <div className="space-y-3">
                              <div className="flex items-center gap-3 text-slate-300">
                                  <Mail className="w-5 h-5 text-slate-500" />
                                  <div className="flex items-center gap-2">
                                      {viewingUserDetails.email ? (
                                          <>
                                              <a href={`mailto:${viewingUserDetails.email}`} className="text-sm underline decoration-slate-600 hover:decoration-indigo-400 truncate max-w-[120px] md:max-w-[150px]">
                                                  {viewingUserDetails.email}
                                              </a>
                                              <button 
                                                onClick={() => handleCopyEmail(viewingUserDetails.email || '')}
                                                className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-700 transition"
                                                title="Copia email"
                                              >
                                                  {copiedEmail ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                              </button>
                                          </>
                                      ) : (
                                          <span className="text-sm text-slate-600 italic">Non fornita</span>
                                      )}
                                  </div>
                              </div>
                              <div className="flex items-center gap-3 text-slate-300">
                                  <Phone className="w-5 h-5 text-slate-500" />
                                  {viewingUserDetails.phoneNumber ? (
                                      <a 
                                        href={toWhatsAppUrl(viewingUserDetails.phoneNumber || '')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm underline decoration-slate-600 hover:decoration-green-400"
                                        title="Invia messaggio WhatsApp"
                                      >
                                          <span>{viewingUserDetails.phoneNumber}</span>
                                          <MessageCircle className="w-3 h-3 text-green-500" />
                                      </a>
                                  ) : (
                                      <span className="text-sm text-slate-600 italic">Non fornito</span>
                                  )}
                              </div>
                          </div>
                      </div>

                      {/* Socials */}
                      <div>
                          <h4 className="text-xs uppercase font-bold text-slate-500 mb-3 tracking-wider">Social</h4>
                          <div className="space-y-3">
                              {viewingUserDetails.instagram ? (
                                  <a 
                                    href={toSocialUrl('instagram', viewingUserDetails.instagram)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-slate-300 hover:text-pink-400 transition-colors"
                                  >
                                      <Instagram className="w-5 h-5 text-pink-500" />
                                      <span className="text-sm underline decoration-slate-600 hover:decoration-pink-400">
                                          @{normalizeHandle(viewingUserDetails.instagram)}
                                      </span>
                                      <ExternalLink className="w-3 h-3 opacity-50" />
                                  </a>
                              ) : (
                                  <div className="flex items-center gap-3 text-slate-300 opacity-50">
                                      <Instagram className="w-5 h-5 text-slate-500" />
                                      <span className="text-sm text-slate-600 italic">--</span>
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
                                      <span className="text-sm underline decoration-slate-600 hover:decoration-blue-400">
                                          Profilo
                                      </span>
                                      <ExternalLink className="w-3 h-3 opacity-50" />
                                  </a>
                              ) : (
                                  <div className="flex items-center gap-3 text-slate-300 opacity-50">
                                      <Facebook className="w-5 h-5 text-slate-500" />
                                      <span className="text-sm text-slate-600 italic">--</span>
                                  </div>
                              )}

                              {viewingUserDetails.x ? (
                                  <a 
                                    href={toSocialUrl('x', viewingUserDetails.x)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                                  >
                                      <Twitter className="w-5 h-5 text-white" />
                                      <span className="text-sm underline decoration-slate-600 hover:decoration-white">
                                          @{normalizeHandle(viewingUserDetails.x)}
                                      </span>
                                      <ExternalLink className="w-3 h-3 opacity-50" />
                                  </a>
                              ) : (
                                  <div className="flex items-center gap-3 text-slate-300 opacity-50">
                                      <Twitter className="w-5 h-5 text-slate-500" />
                                      <span className="text-sm text-slate-600 italic">--</span>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      )}

      <div className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between md:items-start sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
           <div className="w-3 h-8 bg-indigo-500 rounded-full"></div>
           <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-3 my-auto">
          <div className="flex items-center gap-1 mr-4 border-r border-slate-700 pr-4">
             <button onClick={handleExportData} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition" title="Esporta Dati">
                <Download className="w-4 h-4" />
             </button>
             <button onClick={handleImportClick} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition" title="Importa Dati">
                <Upload className="w-4 h-4" />
             </button>
           </div>

          <button 
            onClick={() => setViewState('PROJECTOR')}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-purple-900/20 transition-all hover:scale-105"
          >
            <MonitorPlay className="w-4 h-4" />
            LIVE MODE
          </button>
          <button onClick={() => setViewState('HOME')} className="flex items-center text-sm text-slate-400 hover:text-white transition px-3 py-2 rounded hover:bg-slate-700"><LogOut className="w-4 h-4 mr-2" /> Esci</button>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="relative flex justify-center mb-8">
          <div className="bg-slate-800 p-1.5 rounded-xl inline-flex shadow-inner border border-slate-700 overflow-x-auto max-w-full">
            <button onClick={() => setActiveTab('DB')} className={`flex items-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'DB' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}><Users className="w-4 h-4 mr-2" /> Iscritti</button>
            <button onClick={() => setActiveTab('MANUAL')} className={`flex items-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'MANUAL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}><Edit3 className="w-4 h-4 mr-2" /> Manuale</button>
            <button onClick={() => setActiveTab('AUTO')} className={`flex items-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'AUTO' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}><RefreshCw className="w-4 h-4 mr-2" /> Randomizer</button>
            <button onClick={() => setActiveTab('GAMES')} className={`flex items-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'GAMES' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}><Gamepad2 className="w-4 h-4 mr-2" /> Giochi</button>
            <button onClick={() => setActiveTab('STATS')} className={`flex items-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'STATS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}><BarChart2 className="w-4 h-4 mr-2" /> Stats</button>
          </div>

          {/* LIST TOGGLE (Desktop: Absolute Right, Mobile: Hidden handled below) */}
          {activeTab === 'DB' && (
            <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2">
                <div className="bg-slate-800 p-1 rounded-lg inline-flex border border-slate-700">
                    <button 
                        onClick={() => setDbViewMode('LIST')}
                        className={`p-2 rounded transition ${dbViewMode === 'LIST' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        title="Vista Elenco"
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setDbViewMode('GROUPS')}
                        className={`p-2 rounded transition ${dbViewMode === 'GROUPS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        title="Raggruppa per Strumento"
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                </div>
            </div>
          )}
        </div>

        {/* LIST TOGGLE (Mobile Only) */}
        {activeTab === 'DB' && (
            <div className="flex justify-end mb-4 md:hidden">
                <div className="bg-slate-800 p-1 rounded-lg inline-flex border border-slate-700">
                    <button 
                        onClick={() => setDbViewMode('LIST')}
                        className={`p-2 rounded transition ${dbViewMode === 'LIST' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setDbViewMode('GROUPS')}
                        className={`p-2 rounded transition ${dbViewMode === 'GROUPS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                </div>
            </div>
        )}

        <div className="animate-fade-in">
          {activeTab === 'DB' && renderDatabase()}
          
          {activeTab === 'STATS' && renderStats()}

          {activeTab === 'GAMES' && (
             <div className="space-y-6 pb-24">
               {renderSectionHeader(
                 "Database Giochi", 
                 "Clicca su un gioco per mostrarlo a tutto schermo (modalità lettura).",
                 null
               )}
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {GAMES.map(game => (
                    <div 
                      key={game.id} 
                      onClick={() => setViewingGame(game)}
                      onPointerDown={() => { if (isTablet) setPressedGameId(game.id); }}
                      onPointerUp={() => { if (isTablet) setPressedGameId(null); }}
                      onPointerLeave={() => { if (isTablet) setPressedGameId(null); }}
                      onPointerCancel={() => { if (isTablet) setPressedGameId(null); }}
                      className={`relative group rounded-xl overflow-hidden border bg-slate-800 shadow-xl cursor-pointer transition-all duration-300 transform ${isTablet ? (pressedGameId === game.id ? 'border-white -translate-y-1' : 'border-slate-700') : 'border-slate-700 hover:border-white hover:-translate-y-1'}`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${game.color} ${isTablet ? (pressedGameId === game.id ? 'opacity-20' : 'opacity-10') : 'opacity-10 group-hover:opacity-20'} transition-opacity`}></div>
                        <div className="p-8 flex flex-col items-center text-center relative z-10">
                            <div className={`mb-6 p-5 bg-slate-900/50 rounded-full text-white border border-slate-600 transition-transform ${isTablet ? (pressedGameId === game.id ? 'scale-110' : '') : 'group-hover:scale-110'}`}>
                                {getGameIcon(game.icon, "w-10 h-10")}
                            </div>
                            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wide">{game.title}</h3>
                            <p className="text-slate-300 leading-relaxed text-lg line-clamp-2">
                                {game.description}
                            </p>
                            <div className={`mt-6 flex items-center text-indigo-400 text-sm font-bold uppercase tracking-wider transition-opacity ${isTablet ? (pressedGameId === game.id ? 'opacity-100' : 'opacity-0') : 'opacity-0 group-hover:opacity-100'}`}>
                                <Maximize2 className="w-4 h-4 mr-2" />
                                Leggi Regole
                            </div>
                        </div>
                    </div>
                  ))}
               </div>
             </div>
          )}

          {activeTab === 'AUTO' && (
            <div className="space-y-6 pb-24">
              {renderSectionHeader(
                "Generatore / Scaletta",
                "Ordina la scaletta. Clicca \"Live Mode\" per avviare lo show.",
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
                    <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase px-2 hidden lg:inline">Membri</span>
                        <div className="flex gap-1">
                                {[0, 3, 4, 5, 6].map(num => (
                                    <button
                                    key={num}
                                    onClick={() => setTargetBandSize(num)}
                                    className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-all ${targetBandSize === num ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                                    title={num === 0 ? "Random" : `${num} membri`}
                                    >
                                        {num === 0 ? 'R' : num}
                                    </button>
                                ))}
                        </div>
                    </div>
                    
                    <button onClick={handleAddAutoBand} className={`flex items-center px-5 py-2.5 font-bold rounded-lg shadow-lg transition transform whitespace-nowrap ${users.length < 3 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 hover:shadow-emerald-500/20'}`}>
                      <Plus className="w-5 h-5 mr-2" /> 
                      <span>Genera</span>
                    </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                  {bands.map((band, idx) => renderBandCard(band, idx, true, true))}
              </div>
              {bands.length === 0 && <div className="text-center py-20"><Music className="w-16 h-16 mx-auto text-slate-700 mb-4" /><p className="text-slate-500 text-lg">Nessuna formazione presente.</p></div>}
            </div>
          )}

          {activeTab === 'MANUAL' && (
            <div className="space-y-6 pb-24">
              {renderSectionHeader(
                "Crea Band Manuale",
                "Crea e modifica band specificando i ruoli.",
                <button onClick={handleAddManualBand} className="flex items-center px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition shadow-lg whitespace-nowrap hover:scale-105 hover:shadow-indigo-500/20">
                  <Plus className="w-5 h-5 mr-2" /> 
                  <span>Crea Band</span>
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                  {bands.map((band, idx) => renderBandCard(band, idx, true, true))}
              </div>
              {bands.length === 0 && <div className="text-center py-12 text-slate-500">Non ci sono band.</div>}
            </div>
          )}
        </div>
      </div>

      {(activeTab === 'MANUAL' || activeTab === 'AUTO') && (
        <div 
          className={`fixed bottom-8 left-0 right-0 mx-auto w-64 h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 z-50 ${isDragging ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-20 opacity-0 pointer-events-none'} ${isOverTrash ? 'bg-red-900/80 border-red-400 scale-110 shadow-[0_0_30px_rgba(220,38,38,0.6)]' : 'bg-slate-800/90 border-slate-500 shadow-2xl backdrop-blur-md'}`}
          onDragOver={handleTrashDragEnter}
          onDragLeave={handleTrashDragLeave}
          onDrop={handleTrashDrop}
        >
           <Trash2 className={`w-10 h-10 mb-2 transition-colors pointer-events-none ${isOverTrash ? 'text-white animate-bounce' : 'text-slate-400'}`}/>
           <span className={`font-bold pointer-events-none ${isOverTrash ? 'text-white' : 'text-slate-400'}`}>{isOverTrash ? 'Rilascia per eliminare!' : 'Trascina qui per eliminare'}</span>
        </div>
      )}
    </div>
  );
};
