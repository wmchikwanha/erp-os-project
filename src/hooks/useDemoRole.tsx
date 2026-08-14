import { createContext, useContext, useEffect, useState } from 'react';
import type { AppRole } from './useRole';

const KEY = 'stratedge_demo_role';

interface DemoRoleContextType {
  role: AppRole | null;
  setRole: (r: AppRole | null) => void;
}

const DemoRoleContext = createContext<DemoRoleContextType>({ role: null, setRole: () => {} });

export function DemoRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<AppRole | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(KEY) as AppRole | null;
    if (stored) setRoleState(stored);
  }, []);

  const setRole = (r: AppRole | null) => {
    if (r) localStorage.setItem(KEY, r);
    else localStorage.removeItem(KEY);
    setRoleState(r);
  };

  return <DemoRoleContext.Provider value={{ role, setRole }}>{children}</DemoRoleContext.Provider>;
}

export const useDemoRole = () => useContext(DemoRoleContext);
