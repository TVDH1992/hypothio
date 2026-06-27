import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { FormField } from './ui/FormField';
import { laadSessie, slaSessionOp } from '../lib/profiel';
import type { Sessie } from '../types/profiel';

interface Props {
  onLogin: (sessie: Sessie) => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [naam, setNaam] = useState('');
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [toonWachtwoord, setToonWachtwoord] = useState(false);
  const [fout, setFout] = useState('');

  function handleSubmit() {
    setFout('');
    if (!naam.trim() || !email.trim() || !wachtwoord) {
      setFout('Vul alle velden in.');
      return;
    }
    if (wachtwoord.length < 6) {
      setFout('Wachtwoord moet minimaal 6 tekens zijn.');
      return;
    }

    // Bestaand account? Log in. Nieuw? Registreer automatisch.
    const bestaand = laadSessie();
    const sessie: Sessie = bestaand?.email === email.trim().toLowerCase()
      ? bestaand
      : {
          naam: naam.trim(),
          email: email.trim().toLowerCase(),
          aangemaakt: new Date().toLocaleDateString('nl-NL'),
        };

    slaSessionOp(sessie);
    onLogin(sessie);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1ABC9C] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-bold text-[#0D1F3C]">Hypothio</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pt-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-[#0D1F3C]">Bereken jouw hypotheek</h1>
            <p className="text-gray-400 text-sm">Gratis. Anoniem. Conform Nibud 2026 normen.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <FormField
              label="Jouw naam"
              placeholder="bijv. Jan de Vries"
              value={naam}
              onChange={e => setNaam(e.target.value)}
            />
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
                placeholder="Minimaal 6 tekens"
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
              Aan de slag →
            </Button>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600 leading-relaxed">
              Je gegevens worden uitsluitend lokaal op jouw apparaat opgeslagen. Hypothio verstuurt niets naar externe servers.
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 pb-8">
            Al een account? Vul je e-mailadres in en je wordt automatisch herkend.
          </p>
        </div>
      </main>
    </div>
  );
}
