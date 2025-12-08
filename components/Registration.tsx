import React, { useState, useRef } from 'react';
import { ViewState, User, InstrumentType } from '../types';
import { INSTRUMENTS, AVATAR_OPTIONS } from '../constants';
import { getAvatarUrl } from '../utils/avatar';
import { Mic, Guitar, Drum, Piano, MoreHorizontal, ArrowLeft, Check, Mail, Phone, Instagram, Facebook, Twitter, AlertTriangle, X } from 'lucide-react';

interface RegistrationProps {
  setViewState: (view: ViewState) => void;
  onRegister: (user: User) => void;
}

export const Registration: React.FC<RegistrationProps> = ({ setViewState, onRegister }) => {
  // Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  
  // Avatar
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState<string>(AVATAR_OPTIONS[0].seed);
  const [pressedAvatarId, setPressedAvatarId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [overlayCenter, setOverlayCenter] = useState<{ x: number; y: number } | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);

  // Instruments (Multi-select)
  const [selectedInstruments, setSelectedInstruments] = useState<InstrumentType[]>([]);
  const [customInstrument, setCustomInstrument] = useState('');

  // Contacts
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [x, setX] = useState('');

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Utils
  const capitalizeInitial = (value: string) => {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const toggleInstrument = (type: InstrumentType) => {
    setSelectedInstruments(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!firstName || !lastName || !username) {
      alert('Per favore compila nome, cognome e nome utente.');
      return;
    }

    if (selectedInstruments.length === 0) {
      alert('Per favore seleziona almeno uno strumento.');
      return;
    }

    if (selectedInstruments.includes(InstrumentType.OTHER) && !customInstrument) {
      alert('Per favore specifica lo strumento in "Altro".');
      return;
    }

    // If validation passes, show confirmation modal
    setShowConfirmModal(true);
  };

  const finalizeRegistration = () => {
    const newUser: User = {
      id: Date.now().toString(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      instruments: selectedInstruments,
      customInstrument: selectedInstruments.includes(InstrumentType.OTHER) ? customInstrument.trim().toUpperCase() : undefined,
      email: email.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      instagram: instagram.trim() || undefined,
      facebook: facebook.trim() || undefined,
      x: x.trim() || undefined,
      createdAt: Date.now(),
      status: 'ACTIVE',
      avatarSeed: selectedAvatarSeed
    };

    onRegister(newUser);
    setShowConfirmModal(false);
    setViewState('HOME');
    alert('Iscrizione completata con successo!');
  };

  const getIcon = (type: InstrumentType) => {
    switch (type) {
      case InstrumentType.VOICE: return <Mic className="w-6 h-6" />;
      case InstrumentType.GUITAR: return <Guitar className="w-6 h-6" />;
      case InstrumentType.BASS: return <Guitar className="w-6 h-6" />;
      case InstrumentType.DRUMS: return <Drum className="w-6 h-6" />;
      case InstrumentType.KEYS: return <Piano className="w-6 h-6" />;
      case InstrumentType.OTHER: return <MoreHorizontal className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center relative">
      <div className="w-full max-w-2xl bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700 my-8">
        
        <button 
          onClick={() => setViewState('HOME')}
          className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Torna alla Home
        </button>

        <h2 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
          Iscriviti alla Jam
        </h2>

        <form onSubmit={handleInitialSubmit} className="space-y-8">
          
          {/* Sezione Avatar */}
          <div className="space-y-4">
             <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2">Scegli il tuo Avatar</h3>
             <div ref={gridRef} className="grid grid-cols-4 md:grid-cols-6 gap-3 relative">
              {AVATAR_OPTIONS.map((opt) => (
                 <div 
                   key={opt.id}
                   onPointerDown={(e) => { 
                     setSelectedAvatarSeed(opt.seed);
                     const gridEl = gridRef.current;
                     const targetEl = e.currentTarget as HTMLDivElement;
                     if (gridEl) {
                       const gridRect = gridEl.getBoundingClientRect();
                       const targetRect = targetEl.getBoundingClientRect();
                       const cx = targetRect.left - gridRect.left + targetRect.width / 2;
                       const cy = targetRect.top - gridRect.top + targetRect.height / 2;
                       setOverlayCenter({ x: cx, y: cy });
                     }
                     if (longPressTimeoutRef.current) {
                       clearTimeout(longPressTimeoutRef.current);
                     }
                     longPressTimeoutRef.current = window.setTimeout(() => {
                       setPressedAvatarId(opt.id);
                     }, 350);
                   }}
                   onPointerUp={() => {
                     if (longPressTimeoutRef.current) {
                       clearTimeout(longPressTimeoutRef.current);
                       longPressTimeoutRef.current = null;
                     }
                     setPressedAvatarId(null);
                   }}
                   onPointerLeave={() => {
                     if (longPressTimeoutRef.current) {
                       clearTimeout(longPressTimeoutRef.current);
                       longPressTimeoutRef.current = null;
                     }
                     setPressedAvatarId(null);
                   }}
                   onPointerCancel={() => {
                     if (longPressTimeoutRef.current) {
                       clearTimeout(longPressTimeoutRef.current);
                       longPressTimeoutRef.current = null;
                     }
                     setPressedAvatarId(null);
                   }}
                   onTouchStart={(e) => { 
                     setSelectedAvatarSeed(opt.seed);
                     const gridEl = gridRef.current;
                     const targetEl = e.currentTarget as HTMLDivElement;
                     if (gridEl) {
                       const gridRect = gridEl.getBoundingClientRect();
                       const targetRect = targetEl.getBoundingClientRect();
                       const cx = targetRect.left - gridRect.left + targetRect.width / 2;
                       const cy = targetRect.top - gridRect.top + targetRect.height / 2;
                       setOverlayCenter({ x: cx, y: cy });
                     }
                     if (longPressTimeoutRef.current) {
                       clearTimeout(longPressTimeoutRef.current);
                     }
                     longPressTimeoutRef.current = window.setTimeout(() => {
                       setPressedAvatarId(opt.id);
                     }, 350);
                   }}
                   onTouchEnd={() => {
                     if (longPressTimeoutRef.current) {
                       clearTimeout(longPressTimeoutRef.current);
                       longPressTimeoutRef.current = null;
                     }
                     setPressedAvatarId(null);
                   }}
                   className={`cursor-pointer rounded-full p-1 border-2 transition-transform duration-200 ease-out ${
                      pressedAvatarId === opt.id
                        ? 'scale-[2.25] z-30 border-indigo-500 bg-indigo-500/20'
                         : selectedAvatarSeed === opt.seed
                           ? 'border-indigo-500 bg-indigo-500/20 scale-[1.25]'
                           : 'border-transparent hover:bg-slate-700'
                     }${pressedAvatarId && pressedAvatarId !== opt.id ? ' filter blur-[2px] opacity-60' : ''}`}
                 >
                    <img 
                      src={getAvatarUrl(opt.seed)}
                      onError={(e) => {
                        e.currentTarget.src = getAvatarUrl('Felix');
                      }}
                      alt={opt.label} 
                      className="w-full h-auto rounded-full bg-slate-700 will-change-transform"
                    />
                 </div>
               ))}
               {pressedAvatarId && overlayCenter && (
                 <div 
                   className="absolute inset-0 pointer-events-none backdrop-blur-[4px]"
                   style={{
                     WebkitMaskImage: `radial-gradient(circle at ${overlayCenter.x}px ${overlayCenter.y}px, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 55px, rgba(0,0,0,0.15) 100px, rgba(0,0,0,0.35) 180px, rgba(0,0,0,0.6) 260px)`,
                     maskImage: `radial-gradient(circle at ${overlayCenter.x}px ${overlayCenter.y}px, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 55px, rgba(0,0,0,0.15) 100px, rgba(0,0,0,0.35) 180px, rgba(0,0,0,0.6) 260px)`,
                   }}
                 />
               )}
              </div>
          </div>

          {/* Sezione Dati Personali */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2">Dati Personali</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(capitalizeInitial(e.target.value))}
                  autoCapitalize="words"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Mario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Cognome *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(capitalizeInitial(e.target.value))}
                  autoCapitalize="words"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Rossi"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nome Utente (Stage Name) *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Rocker99"
              />
            </div>
          </div>

          {/* Sezione Strumenti */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2">Strumenti *</h3>
            <p className="text-sm text-slate-400">Seleziona uno o più strumenti che vuoi suonare.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INSTRUMENTS.map((inst) => {
                const isSelected = selectedInstruments.includes(inst.type);
                return (
                  <button
                    key={inst.type}
                    type="button"
                    onClick={() => toggleInstrument(inst.type)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/30 scale-[1.02]'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    <span className={`mb-2 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                      {getIcon(inst.type)}
                    </span>
                    <span className="text-sm font-medium">{inst.label}</span>
                  </button>
                );
              })}
            </div>
            
            {selectedInstruments.includes(InstrumentType.OTHER) && (
              <div className="animate-fade-in mt-4">
                <label className="block text-sm font-medium text-slate-400 mb-1">Specifica Strumento "Altro"</label>
                <input
                  type="text"
                  value={customInstrument}
                  onChange={(e) => setCustomInstrument(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Es. Sax, Violino, Triangolo..."
                />
              </div>
            )}
          </div>

          {/* Sezione Contatti */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2">Contatti (Opzionali)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                  <Mail className="w-4 h-4 mr-2" /> Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="nome@esempio.com"
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                  <Phone className="w-4 h-4 mr-2" /> Telefono
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="+39 333 ..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                  <Instagram className="w-4 h-4 mr-2" /> Instagram
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                  <Facebook className="w-4 h-4 mr-2" /> Facebook
                </label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Profile link/name"
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                  <Twitter className="w-4 h-4 mr-2" /> X
                </label>
                <input
                  type="text"
                  value={x}
                  onChange={(e) => setX(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="@handle"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center mt-8"
          >
            <span>Conferma Iscrizione</span>
            <Check className="w-5 h-5 ml-2" />
          </button>
        </form>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
              <button 
                 onClick={() => setShowConfirmModal(false)}
                 className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                 <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center text-center">
                 <div className="bg-yellow-500/20 p-3 rounded-full mb-4">
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">Confermi i dati?</h3>
                 <p className="text-slate-400 mb-6 text-sm">Controlla che sia tutto corretto. Se confermi, verrai inserito in lista per suonare!</p>

                 <div className="w-full bg-slate-900/50 p-4 rounded-lg mb-6 border border-slate-700 text-left space-y-2">
                    <div className="flex justify-between">
                        <span className="text-slate-500 text-sm">Nome:</span>
                        <span className="text-white font-bold">{firstName} {lastName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500 text-sm">Stage Name:</span>
                        <span className="text-white font-bold text-indigo-400">@{username}</span>
                    </div>
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 text-sm whitespace-nowrap mr-2">Strumenti:</span>
                        <div className="text-right flex flex-wrap justify-end gap-1">
                            {selectedInstruments.map(i => (
                                <span 
                                  key={i} 
                                  className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-white"
                                >
                                  {i === InstrumentType.OTHER && customInstrument ? customInstrument : i}
                                </span>
                            ))}
                        </div>
                    </div>
                 </div>

                 <div className="flex w-full gap-3">
                    <button 
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition"
                    >
                      Modifica
                    </button>
                    <button 
                      onClick={finalizeRegistration}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-lg shadow-lg transition transform hover:scale-105"
                    >
                      Sì, Confermo
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
