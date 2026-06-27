import { Calculator, Building2, User } from 'lucide-react';
import { useApp, type Tab } from '../../context/AppContext';
import { useWizard } from '../../context/WizardContext';

const ITEMS: { tab: Tab; label: string; Icon: typeof Calculator }[] = [
  { tab: 'berekenen', label: 'Berekenen', Icon: Calculator },
  { tab: 'woningen',  label: 'Woningen',  Icon: Building2  },
  { tab: 'profiel',   label: 'Profiel',   Icon: User       },
];

export function BottomNav() {
  const { tab, setTab } = useApp();
  const { setStap } = useWizard();

  function navigeer(t: Tab) {
    setTab(t);
    if (t === 'berekenen') setStap(0);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="max-w-xl mx-auto flex">
        {ITEMS.map(({ tab: t, label, Icon }) => {
          const actief = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => navigeer(t)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition cursor-pointer"
            >
              <Icon className={`w-5 h-5 transition-colors ${actief ? 'text-[#1ABC9C]' : 'text-gray-400'}`} />
              <span className={`text-[10px] font-medium transition-colors ${actief ? 'text-[#1ABC9C]' : 'text-gray-400'}`}>
                {label}
              </span>
              {actief && <span className="absolute bottom-0 w-8 h-0.5 bg-[#1ABC9C] rounded-t-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
