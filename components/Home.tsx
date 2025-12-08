import React, { useState } from 'react';
import { ViewState } from '../types';

interface HomeProps {
  setViewState: (view: ViewState) => void;
}

export const Home: React.FC<HomeProps> = ({ setViewState }) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const expectedPassword = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'admin123';

  const handleAdminAccess = () => {
    if (adminPassword && adminPassword === expectedPassword) {
      setShowAdminModal(false);
      setAdminPassword('');
      setViewState('ADMIN');
    } else {
      alert('PIN Admin non valido.');
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      
      <div className="animate-fade-in-up">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-16 tracking-tight">
          BENVENUTO
        </h1>

        <button
          onClick={() => setViewState('REGISTER')}
          className="group relative inline-flex items-center justify-center px-8 py-5 text-lg font-bold text-white transition-all duration-200 bg-indigo-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-500 hover:scale-105 shadow-lg shadow-indigo-500/50"
        >
          <span>Clicca qui per iscriverti a Jamm A Jam</span>
          <svg 
            className="w-6 h-6 ml-3 transition-transform duration-200 group-hover:translate-x-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          <div className="absolute -inset-3 rounded-full bg-indigo-400 opacity-20 group-hover:opacity-40 blur-lg transition-opacity duration-200" />
        </button>

        <div className="mt-6">
          <button
            onClick={() => setShowAdminModal(true)}
            className="text-sm text-slate-300 underline underline-offset-4 hover:text-white"
          >
            Accedi come Admin
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-slate-500 text-sm">
        Jam Session Manager &copy; {new Date().getFullYear()}
      </div>

      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">Accesso Admin</h3>
            <p className="text-slate-400 text-sm mb-4">Inserisci il PIN per accedere alla dashboard amministratore.</p>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="PIN Admin"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAdminModal(false)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition"
              >
                Annulla
              </button>
              <button
                onClick={handleAdminAccess}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition"
              >
                Accedi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
