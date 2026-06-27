import { useState, useEffect } from 'react';
import { WizardProvider, useWizard } from './context/WizardContext';
import { AppProvider, useApp } from './context/AppContext';
import { supabase } from './lib/supabase';
import { ProgressBar } from './components/ui/ProgressBar';
import { BottomNav } from './components/nav/BottomNav';
import { Stap1Welkom } from './components/wizard/Stap1Welkom';
import { Stap2Situatie } from './components/wizard/Stap2Situatie';
import { Stap3Inkomen1 } from './components/wizard/Stap3Inkomen1';
import { Stap4Inkomen2 } from './components/wizard/Stap4Inkomen2';
import { Stap5Verplichtingen } from './components/wizard/Stap5Verplichtingen';
import { Stap6Woning } from './components/wizard/Stap6Woning';
import { Stap7Berekenen } from './components/wizard/Stap7Berekenen';
import { Stap8Resultaat } from './components/wizard/Stap8Resultaat';
import { WoningenScreen } from './components/screens/WoningenScreen';
import { ProfielScreen } from './components/screens/ProfielScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { AdminScreen } from './components/screens/AdminScreen';
import { LandingPage } from './components/LandingPage';
import { BevestigingScreen } from './components/BevestigingScreen';
import { verwijderSessie } from './lib/profiel';
import type { Sessie } from './types/profiel';

const STAP_LABELS: Record<number, string> = {
  2: 'Situatie', 3: 'Inkomen', 4: 'Inkomen partner',
  5: 'Verplichtingen', 6: 'De woning', 7: 'Berekenen',
};

function AppShell({ sessie, onUitloggen }: { sessie: Sessie; onUitloggen: () => void }) {
  const { stap } = useWizard();
  const { tab } = useApp();
  const isAdmin = sessie.rol === 'admin';
  const toonVoortgang = tab === 'berekenen' && stap > 1 && stap < 8;
  const stapLabel = STAP_LABELS[stap];

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1ABC9C] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-[#0D1F3C]">Hypothio</span>
          </div>
          <div className="flex items-center gap-3">
            {toonVoortgang && stapLabel && (
              <span className="text-xs text-gray-400">{stapLabel}</span>
            )}
            {tab === 'admin' && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
            )}
          </div>
        </div>
      </header>

      {toonVoortgang && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-[65px] z-30">
          <div className="max-w-xl mx-auto">
            <ProgressBar huidigeStap={stap - 1} totaalStappen={6} />
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto px-4 py-8 pb-28">
        {tab === 'berekenen' && (
          <>
            {stap === 0 && <HomeScreen />}
            {stap === 1 && <Stap1Welkom />}
            {stap === 2 && <Stap2Situatie />}
            {stap === 3 && <Stap3Inkomen1 />}
            {stap === 4 && <Stap4Inkomen2 />}
            {stap === 5 && <Stap5Verplichtingen />}
            {stap === 6 && <Stap6Woning />}
            {stap === 7 && <Stap7Berekenen />}
            {stap === 8 && <Stap8Resultaat />}
          </>
        )}
        {tab === 'woningen' && <WoningenScreen />}
        {tab === 'profiel'  && <ProfielScreen onUitloggen={onUitloggen} />}
        {tab === 'admin' && isAdmin && <AdminScreen />}
      </main>

      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}

export default function App() {
  const [sessie, setSessie]         = useState<Sessie | null>(null);
  const [laden, setLaden]           = useState(true);
  const isBevestiging = window.location.hash.includes('access_token') ||
                        window.location.hash.includes('type=signup');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessie({
          naam: session.user.user_metadata?.naam ?? session.user.email!.split('@')[0],
          email: session.user.email!,
          rol: session.user.user_metadata?.role === 'admin' ? 'admin' : 'gebruiker',
          aangemaakt: new Date(session.user.created_at).toLocaleDateString('nl-NL'),
        });
      }
      setLaden(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessie({
          naam: session.user.user_metadata?.naam ?? session.user.email!.split('@')[0],
          email: session.user.email!,
          rol: session.user.user_metadata?.role === 'admin' ? 'admin' : 'gebruiker',
          aangemaakt: new Date(session.user.created_at).toLocaleDateString('nl-NL'),
        });
      } else {
        setSessie(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function uitloggen() {
    await supabase.auth.signOut();
    verwijderSessie();
    setSessie(null);
  }

  if (laden) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center space-y-3">
          <div className="w-10 h-10 bg-[#1ABC9C] rounded-xl flex items-center justify-center mx-auto">
            <span className="text-white font-bold">H</span>
          </div>
          <p className="text-sm text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  if (isBevestiging && !sessie) {
    return <BevestigingScreen onBevestigd={() => window.location.replace('/')} />;
  }

  if (!sessie) {
    return <LandingPage onLogin={setSessie} />;
  }

  return (
    <AppProvider>
      <WizardProvider sessie={sessie}>
        <AppShell sessie={sessie} onUitloggen={uitloggen} />
      </WizardProvider>
    </AppProvider>
  );
}
