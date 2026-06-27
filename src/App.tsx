import { useState } from 'react';
import { WizardProvider, useWizard } from './context/WizardContext';
import { AppProvider, useApp } from './context/AppContext';
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
import { LoginScreen } from './components/LoginScreen';
import { laadSessie, verwijderSessie } from './lib/profiel';
import type { Sessie } from './types/profiel';

const STAP_LABELS: Record<number, string> = {
  2: 'Situatie', 3: 'Inkomen', 4: 'Inkomen partner',
  5: 'Verplichtingen', 6: 'De woning', 7: 'Berekenen',
};

function AppShell({ onUitloggen }: { onUitloggen: () => void }) {
  const { stap } = useWizard();
  const { tab } = useApp();
  const toonVoortgang = tab === 'berekenen' && stap > 1 && stap < 8;
  const stapLabel = STAP_LABELS[stap];

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1ABC9C] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-[#0D1F3C]">Hypothio</span>
          </div>
          {toonVoortgang && stapLabel && (
            <span className="text-xs text-gray-400">{stapLabel}</span>
          )}
        </div>
      </header>

      {/* Voortgangsbalk wizard */}
      {toonVoortgang && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-[65px] z-30">
          <div className="max-w-xl mx-auto">
            <ProgressBar huidigeStap={stap - 1} totaalStappen={6} />
          </div>
        </div>
      )}

      {/* Content */}
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
      </main>

      <BottomNav />
    </div>
  );
}

export default function App() {
  const [sessie, setSessie] = useState<Sessie | null>(laadSessie);

  function uitloggen() {
    verwijderSessie();
    setSessie(null);
  }

  if (!sessie) {
    return <LoginScreen onLogin={setSessie} />;
  }

  return (
    <AppProvider>
      <WizardProvider sessie={sessie}>
        <AppShell onUitloggen={uitloggen} />
      </WizardProvider>
    </AppProvider>
  );
}
