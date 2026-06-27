import { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/Button';
import { FormField } from './ui/FormField';
import { laadSessie, slaSessionOp } from '../lib/profiel';
import type { Sessie } from '../types/profiel';

interface Props {
  onLogin: (sessie: Sessie) => void;
}

type Tab = 'login' | 'registreer';

export function LoginScreen({ onLogin }: Props) {
  const [tab, setTab] = useState<Tab>('login');
  const [naam, setNaam] = useState('Test Gebruiker');
  const [email, setEmail] = useState('test@hypothio.nl');
  const [wachtwoord, setWachtwoord] = useState('test123');
  const [toonWachtwoord, setToonWachtwoord] = useState(false);
  const [fout, setFout] = useState('');

  function handleSubmit() {
    setFout('');
    if (!email.trim() || !wachtwoord) {
      setFout('Vul alle velden in.');
      return;
    }
    if (tab === 'registreer' && !naam.trim()) {
      setFout('Vul je naam in.');
      return;
    }
    if (wachtwoord.length < 6) {
      setFout('Wachtwoord moet minimaal 6 tekens zijn.');
      return;
    }

    if (tab === 'login') {
      const bestaand = laadSessie();
      if (!bestaand || bestaand.email !== email.trim().toLowerCase()) {
        setFout('Geen account gevonden met dit e-mailadres. Registreer eerst.');
        return;
      }
      onLogin(bestaand);
    } else {
      const nieuw: Sessie = {
        naam: naam.trim(),
        email: email.trim().toLowerCase(),
        aangemaakt: new Date().toLocaleDateString('nl-NL'),
      };
      slaSessionOp(nieuw);
      onLogin(nieuw);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1ABC9C] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-bold text-[#0D1F3C]">Hypothio</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pt-12">
        <div className="w-full max-w-md space-y-8">
          {/* Hero tekst */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-[#0D1F3C]">
              {tab === 'login' ? 'Welkom terug' : 'Maak een account'}
            </h1>
            <p className="text-gray-400 text-sm">
              {tab === 'login'
                ? 'Log in om je berekeningen en woningen te bekijken.'
                : 'Bereken je maximale hypotheek en sla woningen op.'}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setTab('login'); setFout(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer
                ${tab === 'login' ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LogIn className="w-4 h-4" /> Inloggen
            </button>
            <button
              type="button"
              onClick={() => { setTab('registreer'); setFout(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer
                ${tab === 'registreer' ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <UserPlus className="w-4 h-4" /> Registreren
            </button>
          </div>

          {/* Formulier */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            {tab === 'registreer' && (
              <FormField
                label="Jouw naam"
                placeholder="bijv. Jan de Vries"
                value={naam}
                onChange={e => setNaam(e.target.value)}
              />
            )}
            <FormField
              label="E-mailadres"
              type="email"
              placeholder="jouw@email.nl"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <div className="relative">
              <FormField
                label="Wachtwoord"
                type={toonWachtwoord ? 'text' : 'password'}
                placeholder={tab === 'registreer' ? 'Minimaal 6 tekens' : '••••••••'}
                value={wachtwoord}
                onChange={e => setWachtwoord(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                type="button"
                onClick={() => setToonWachtwoord(v => !v)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                {toonWachtwoord ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {fout && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{fout}</p>
            )}

            <Button onClick={handleSubmit} className="w-full mt-2">
              {tab === 'login' ? 'Inloggen' : 'Account aanmaken'}
            </Button>
          </div>

          <p className="text-center text-xs text-gray-400 pb-8">
            Dit is een prototype. Je gegevens worden alleen lokaal opgeslagen.
          </p>
        </div>
      </main>
    </div>
  );
}
