import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Loader2, CheckCircle, TrendingUp, Calculator, Building2, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { FormField } from './ui/FormField';
import { supabase } from '../lib/supabase';
import type { Sessie } from '../types/profiel';

interface Props {
  onLogin: (sessie: Sessie) => void;
}

const FEATURES = [
  {
    icon: Calculator,
    titel: 'Nauwkeurige berekening',
    sub: 'Conform officiële Nibud 2026 normen en AFM toetsrente — identiek aan erkende hypotheekadviseurs.',
  },
  {
    icon: Building2,
    titel: 'Woning analyseren',
    sub: 'WOZ-waarde opzoeken, marktwaarde schatten en direct biedadvies ontvangen voor elk adres in Nederland.',
  },
  {
    icon: TrendingUp,
    titel: 'Scenario vergelijker',
    sub: 'Vergelijk 10, 15, 20 en 30 jaar rentevast naast elkaar — zie direct wat het doet met je maandlast.',
  },
];

const STAPPEN = [
  { nr: '1', label: 'Vul je situatie in',    sub: 'Inkomen, partner, verplichtingen' },
  { nr: '2', label: 'Berekening in seconden', sub: 'Max hypotheek, maandlasten, NHG-check' },
  { nr: '3', label: 'Vergelijk woningen',     sub: 'Check of een woning in jouw budget past' },
];

export function LandingPage({ onLogin }: Props) {
  const [naam, setNaam]             = useState('');
  const [email, setEmail]           = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [toonWw, setToonWw]         = useState(false);
  const [laden, setLaden]           = useState(false);
  const [fout, setFout]             = useState('');
  const [isLogin, setIsLogin]       = useState(false);
  const [toonForm, setToonForm]     = useState(false);

  async function handleSubmit() {
    setFout('');
    if (!email.trim() || !wachtwoord) { setFout('Vul alle velden in.'); return; }
    if (!isLogin && !naam.trim())     { setFout('Vul je naam in.'); return; }
    if (wachtwoord.length < 6)        { setFout('Wachtwoord minimaal 6 tekens.'); return; }

    setLaden(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: wachtwoord });
        if (error) { setFout('Verkeerd e-mailadres of wachtwoord.'); return; }
        onLogin({
          naam: data.user.user_metadata?.naam ?? email.split('@')[0],
          email: data.user.email!,
          aangemaakt: new Date(data.user.created_at).toLocaleDateString('nl-NL'),
        });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: wachtwoord,
          options: { data: { naam: naam.trim() } },
        });
        if (error) { setFout(error.message); return; }
        if (data.user) {
          onLogin({ naam: naam.trim(), email: data.user.email!, aangemaakt: new Date().toLocaleDateString('nl-NL') });
        } else {
          setFout('Check je e-mail om je account te bevestigen.');
        }
      }
    } finally {
      setLaden(false);
    }
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1ABC9C] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-[#0D1F3C]">Hypothio</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { setIsLogin(true); setToonForm(true); }}
              className="text-sm text-gray-500 hover:text-[#0D1F3C] transition cursor-pointer">
              Inloggen
            </button>
            <Button onClick={() => { setIsLogin(false); setToonForm(true); }} size="sm">
              Gratis starten
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0D1F3C] via-[#0D1F3C] to-[#1a3a5c] text-white">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#1ABC9C] rounded-full filter blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#1ABC9C] rounded-full filter blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-[#1ABC9C]/10 border border-[#1ABC9C]/20 rounded-full px-4 py-1.5 mb-8">
            <ShieldCheck className="w-4 h-4 text-[#1ABC9C]" />
            <span className="text-xs text-[#1ABC9C] font-medium">Conform Nibud 2026 & AFM richtlijnen</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Hoeveel hypotheek<br />
            <span className="text-[#1ABC9C]">kun jij krijgen?</span>
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto mb-10 leading-relaxed">
            Bereken in 3 minuten je maximale hypotheek, vergelijk scenario's en analyseer woningen op basis van officiële normen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => { setIsLogin(false); setToonForm(true); }}
              className="bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white border-0 text-base px-8">
              Gratis berekening starten →
            </Button>
            <button type="button" onClick={() => { setIsLogin(true); setToonForm(true); }}
              className="px-8 py-3 rounded-xl border border-white/20 text-white/80 hover:bg-white/5 transition text-base cursor-pointer">
              Al een account? Log in
            </button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-white/40">
            <span>✓ Gratis</span>
            <span>✓ Geen spam</span>
            <span>✓ Data blijft lokaal</span>
          </div>
        </div>
        <div className="flex justify-center pb-8">
          <ChevronDown className="w-5 h-5 text-white/30 animate-bounce" />
        </div>
      </section>

      {/* Trust balk */}
      <section className="bg-gray-50 border-y border-gray-100 py-5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            {[
              ['🏛️', 'Nibud 2026 normtabel'],
              ['📋', 'AFM toetsrente conform regeling'],
              ['🏠', 'NHG grens €435.000'],
              ['🔒', 'Data lokaal opgeslagen'],
            ].map(([emoji, label]) => (
              <div key={label} className="flex items-center gap-2">
                <span>{emoji}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-[#0D1F3C]">Alles wat je nodig hebt</h2>
          <p className="text-gray-400 mt-3">Van berekening tot biedadvies — in één platform.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, titel, sub }) => (
            <div key={titel} className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-[#1ABC9C]/30 hover:shadow-sm transition">
              <div className="w-12 h-12 bg-[#1ABC9C]/10 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-[#1ABC9C]" />
              </div>
              <h3 className="font-semibold text-[#0D1F3C] mb-2">{titel}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hoe werkt het */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0D1F3C]">Hoe werkt het?</h2>
            <p className="text-gray-400 mt-3">Berekening in 3 minuten.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STAPPEN.map(s => (
              <div key={s.nr} className="text-center">
                <div className="w-14 h-14 bg-[#0D1F3C] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-lg font-bold">{s.nr}</span>
                </div>
                <h3 className="font-semibold text-[#0D1F3C] mb-1">{s.label}</h3>
                <p className="text-sm text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA sectie */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-br from-[#0D1F3C] to-[#1a3a5c] rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Klaar om te beginnen?</h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            Maak gratis een account en bereken in 3 minuten hoeveel hypotheek jij kunt krijgen.
          </p>
          <Button size="lg" onClick={() => { setIsLogin(false); setToonForm(true); }}
            className="bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 border-0 text-base px-10">
            Gratis starten →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#1ABC9C] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">H</span>
            </div>
            <span className="font-medium text-[#0D1F3C]">Hypothio</span>
          </div>
          <p>Indicatieve berekening — geen financieel advies. Neem contact op met een erkend hypotheekadviseur.</p>
        </div>
      </footer>

      {/* Login / Register modal */}
      {toonForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setToonForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0D1F3C]">
                {isLogin ? 'Inloggen' : 'Account aanmaken'}
              </h2>
              <button type="button" onClick={() => setToonForm(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer text-xl leading-none">✕</button>
            </div>

            <div className="flex bg-gray-100 rounded-xl p-1">
              <button type="button" onClick={() => { setIsLogin(false); setFout(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer
                  ${!isLogin ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-gray-500'}`}>
                Registreren
              </button>
              <button type="button" onClick={() => { setIsLogin(true); setFout(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer
                  ${isLogin ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-gray-500'}`}>
                Inloggen
              </button>
            </div>

            {!isLogin && (
              <FormField label="Naam" placeholder="Jan de Vries" value={naam} onChange={e => setNaam(e.target.value)} />
            )}
            <FormField label="E-mailadres" type="email" placeholder="jouw@email.nl" value={email} onChange={e => setEmail(e.target.value)} />
            <div className="relative">
              <FormField label="Wachtwoord" type={toonWw ? 'text' : 'password'} placeholder="Minimaal 6 tekens"
                value={wachtwoord} onChange={e => setWachtwoord(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSubmit()} />
              <button type="button" onClick={() => setToonWw(v => !v)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 cursor-pointer">
                {toonWw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {fout && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{fout}</p>}

            <Button onClick={handleSubmit} disabled={laden} className="w-full">
              {laden
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Even geduld...</>
                : isLogin ? 'Inloggen' : 'Account aanmaken →'}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Je gegevens worden veilig opgeslagen via Supabase Auth.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
