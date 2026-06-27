import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { FormField } from './ui/FormField';
import { supabase } from '../lib/supabase';
import type { Sessie } from '../types/profiel';

interface Props {
  onLogin: (sessie: Sessie) => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [naam, setNaam]               = useState('');
  const [email, setEmail]             = useState('');
  const [wachtwoord, setWachtwoord]   = useState('');
  const [toonWw, setToonWw]           = useState(false);
  const [laden, setLaden]             = useState(false);
  const [fout, setFout]               = useState('');
  const [isLogin, setIsLogin]         = useState(false);

  async function handleSubmit() {
    setFout('');
    if (!email.trim() || !wachtwoord) { setFout('Vul alle velden in.'); return; }
    if (!isLogin && !naam.trim())     { setFout('Vul je naam in.');      return; }
    if (wachtwoord.length < 6)        { setFout('Wachtwoord minimaal 6 tekens.'); return; }

    setLaden(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: wachtwoord });
        if (error) { setFout('Verkeerd e-mailadres of wachtwoord.'); return; }
        const user = data.user;
        onLogin({
          naam: user.user_metadata?.naam ?? email.split('@')[0],
          email: user.email!,
          aangemaakt: new Date(user.created_at).toLocaleDateString('nl-NL'),
        });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: wachtwoord,
          options: { data: { naam: naam.trim() } },
        });
        if (error) { setFout(error.message); return; }
        // Als e-mailbevestiging uitstaat, is user direct beschikbaar
        if (data.user) {
          onLogin({
            naam: naam.trim(),
            email: data.user.email!,
            aangemaakt: new Date().toLocaleDateString('nl-NL'),
          });
        } else {
          setFout('Check je e-mail om je account te bevestigen.');
        }
      }
    } finally {
      setLaden(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          <div className="w-8 h-8 bg-[#8B35C0] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-bold text-[#0D1F3C]">Hypothio</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pt-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-[#0D1F3C]">
              {isLogin ? 'Welkom terug' : 'Bereken jouw hypotheek'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isLogin ? 'Log in om verder te gaan.' : 'Gratis. Conform Nibud 2026 normen.'}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button type="button" onClick={() => { setIsLogin(false); setFout(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer
                ${!isLogin ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-gray-500'}`}>
              Registreren
            </button>
            <button type="button" onClick={() => { setIsLogin(true); setFout(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer
                ${isLogin ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-gray-500'}`}>
              Inloggen
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            {!isLogin && (
              <FormField label="Jouw naam" placeholder="bijv. Jan de Vries"
                value={naam} onChange={e => setNaam(e.target.value)} />
            )}
            <FormField label="E-mailadres" type="email" placeholder="jouw@email.nl"
              value={email} onChange={e => setEmail(e.target.value)} />
            <div className="relative">
              <FormField
                label="Wachtwoord"
                type={toonWw ? 'text' : 'password'}
                placeholder="Minimaal 6 tekens"
                value={wachtwoord}
                onChange={e => setWachtwoord(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSubmit()}
              />
              <button type="button" onClick={() => setToonWw(v => !v)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition cursor-pointer">
                {toonWw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {fout && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{fout}</p>}

            <Button onClick={handleSubmit} disabled={laden} className="w-full mt-2">
              {laden
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Even geduld...</>
                : isLogin ? 'Inloggen' : 'Account aanmaken →'}
            </Button>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600 leading-relaxed">
              Je wachtwoord wordt veilig versleuteld opgeslagen via Supabase Auth. Hypothio deelt nooit gegevens met derden.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
