import { createContext, useContext, useState, type ReactNode } from 'react';

export type Tab = 'berekenen' | 'woningen' | 'profiel';

interface AppCtx {
  tab: Tab;
  setTab: (t: Tab) => void;
}

const AppContext = createContext<AppCtx>({ tab: 'berekenen', setTab: () => {} });

export function AppProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>('berekenen');
  return <AppContext.Provider value={{ tab, setTab }}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
