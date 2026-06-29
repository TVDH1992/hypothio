import { useState, useEffect, lazy, Suspense } from 'react';
import { WizardProvider, useWizard } from './context/WizardContext';
import { AppProvider, useApp } from './context/AppContext';
import { supabase } from './lib/supabase';
import { ProgressBar } from './components/ui/ProgressBar';
import { BottomNav } from './components/nav/BottomNav';
import { verwijderSessie } from './lib/profiel';
import type { Sessie } from './types/profiel';

const Stap1Welkom       = lazy(() => import('./components/wizard/Stap1Welkom').then(m => ({ default: m.Stap1Welkom })));
const Stap2Situatie     = lazy(() => import('./components/wizard/Stap2Situatie').then(m => ({ default: m.Stap2Situatie })));
const Stap3Inkomen1     = lazy(() => import('./components/wizard/Stap3Inkomen1').then(m => ({ default: m.Stap3Inkomen1 })));
const Stap4Inkomen2     = lazy(() => import('./components/wizard/Stap4Inkomen2').then(m => ({ default: m.Stap4Inkomen2 })));
const Stap5Verplichtingen = lazy(() => import('./components/wizard/Stap5Verplichtingen').then(m => ({ default: m.Stap5Verplichtingen })));
const Stap6Woning       = lazy(() => import('./components/wizard/Stap6Woning').then(m => ({ default: m.Stap6Woning })));
const Stap7Berekenen    = lazy(() => import('./components/wizard/Stap7Berekenen').then(m => ({ default: m.Stap7Berekenen })));
const Stap8Resultaat    = lazy(() => import('./components/wizard/Stap8Resultaat').then(m => ({ default: m.Stap8Resultaat })));
const HomeScreen        = lazy(() => import('./components/screens/HomeScreen').then(m => ({ default: m.HomeScreen })));
const WoningenScreen    = lazy(() => import('./components/screens/WoningenScreen').then(m => ({ default: m.WoningenScreen })));
const ProfielScreen     = lazy(() => import('./components/screens/ProfielScreen').then(m => ({ default: m.ProfielScreen })));
const AdminScreen       = lazy(() => import('./components/screens/AdminScreen').then(m => ({ default: m.AdminScreen })));
const LandingPage       = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const BevestigingScreen = lazy(() => import('./components/BevestigingScreen').then(m => ({ default: m.BevestigingScreen })));

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
            <div className="w-8 h-8 bg-[#99248F] rounded-lg flex items-center justify-center">
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

      <main className="max-w-xl mx-auto px-4 py-8" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}>
        <Suspense fallback={<div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[#99248F] border-t-transparent rounded-full animate-spin" /></div>}>
          {tab === 'berekenen' && (
            <div key={stap} className="animate-stap">
              {stap === 0 && <HomeScreen />}
              {stap === 1 && <Stap1Welkom />}
              {stap === 2 && <Stap2Situatie />}
              {stap === 3 && <Stap3Inkomen1 />}
              {stap === 4 && <Stap4Inkomen2 />}
              {stap === 5 && <Stap5Verplichtingen />}
              {stap === 6 && <Stap6Woning />}
              {stap === 7 && <Stap7Berekenen />}
              {stap === 8 && <Stap8Resultaat />}
            </div>
          )}
          {tab === 'woningen' && <WoningenScreen />}
          {tab === 'profiel'  && <ProfielScreen onUitloggen={onUitloggen} />}
          {tab === 'admin' && isAdmin && <AdminScreen />}
        </Suspense>
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
          <div className="w-10 h-10 bg-[#99248F] rounded-xl flex items-center justify-center mx-auto">
            <span className="text-white font-bold">H</span>
          </div>
          <p className="text-sm text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  if (isBevestiging && !sessie) {
    return (
      <Suspense fallback={null}>
        <BevestigingScreen onBevestigd={() => window.location.replace('/')} />
      </Suspense>
    );
  }

  if (!sessie) {
    return (
      <Suspense fallback={null}>
        <LandingPage onLogin={setSessie} />
      </Suspense>
    );
  }

  return (
    <AppProvider>
      <WizardProvider sessie={sessie}>
        <AppShell sessie={sessie} onUitloggen={uitloggen} />
      </WizardProvider>
    </AppProvider>
  );
}
