import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { SituatieData, InkomenData, VerplichtingenData, WoningData, Resultaat } from '../types/wizard';
import type { Sessie } from '../types/profiel';
import { haalActueleRentes, type RenteTabel } from '../lib/rentes';
import { TOETSRENTES } from '../lib/normen';

export type Rol = 'consument' | 'adviseur';

interface WizardContextType {
  stap: number;
  rol: Rol;
  sessie: Sessie;
  actueleRentes: RenteTabel;
  situatie: Partial<SituatieData>;
  inkomen1: Partial<InkomenData>;
  inkomen2: Partial<InkomenData>;
  verplichtingen: Partial<VerplichtingenData>;
  woning: Partial<WoningData>;
  resultaat: Resultaat | null;
  setStap: (s: number) => void;
  setRol: (r: Rol) => void;
  updateSituatie: (d: Partial<SituatieData>) => void;
  updateInkomen1: (d: Partial<InkomenData>) => void;
  updateInkomen2: (d: Partial<InkomenData>) => void;
  updateVerplichtingen: (d: Partial<VerplichtingenData>) => void;
  updateWoning: (d: Partial<WoningData>) => void;
  setResultaat: (r: Resultaat) => void;
  volgende: () => void;
  vorige: () => void;
}

const WizardContext = createContext<WizardContextType | null>(null);

const defaultInkomen: Partial<InkomenData> = {
  frequentie: 'maand',
  heeftVakantiegeld: true,
  heeftDertiendeMaand: false,
  isZZP: false,
};

const defaultVerplichtingen: Partial<VerplichtingenData> = {
  studieschuldStelsel: 'geen',
  bkrMelding: false,
};

const defaultWoning: Partial<WoningData> = {
  energielabel: 'C',
  rentevastePeriode: 10,
  hypotheekvorm: 'annuitair',
  looptijdJaar: 30,
};

export function WizardProvider({ children, sessie }: { children: ReactNode; sessie: Sessie }) {
  const [stap, setStap]                     = useState(0);
  const [situatie, setSituatie]             = useState<Partial<SituatieData>>({});
  const [inkomen1, setInkomen1]             = useState<Partial<InkomenData>>(defaultInkomen);
  const [inkomen2, setInkomen2]             = useState<Partial<InkomenData>>(defaultInkomen);
  const [verplichtingen, setVerplichtingen] = useState<Partial<VerplichtingenData>>(defaultVerplichtingen);
  const [woning, setWoning]                 = useState<Partial<WoningData>>(defaultWoning);
  const [resultaat, setResultaat]           = useState<Resultaat | null>(null);
  const [rol, setRol]                       = useState<Rol>('consument');
  const [actueleRentes, setActueleRentes]   = useState<RenteTabel>(TOETSRENTES);

  useEffect(() => {
    haalActueleRentes().then(setActueleRentes).catch(() => {});
  }, []);

  const volgende = () =>
    setStap(s => {
      const nieuw = s === 3 && !situatie.metPartner ? 5 : Math.min(s + 1, 8);
      history.pushState({ stap: nieuw }, '');
      return nieuw;
    });

  const vorige = () =>
    setStap(s => {
      if (s === 5 && !situatie.metPartner) return 3;
      return Math.max(s - 1, 0);
    });

  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      const stap = e.state?.stap;
      if (typeof stap === 'number') {
        setStap(s => Math.max(s - 1, 0));
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return (
    <WizardContext.Provider value={{
      stap, rol, sessie, situatie, inkomen1, inkomen2, verplichtingen, woning, resultaat, actueleRentes,
      setStap, setRol,
      updateSituatie:      d => setSituatie(s => ({ ...s, ...d })),
      updateInkomen1:      d => setInkomen1(s => ({ ...s, ...d })),
      updateInkomen2:      d => setInkomen2(s => ({ ...s, ...d })),
      updateVerplichtingen:d => setVerplichtingen(s => ({ ...s, ...d })),
      updateWoning:        d => setWoning(s => ({ ...s, ...d })),
      setResultaat,
      volgende,
      vorige,
    }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}
