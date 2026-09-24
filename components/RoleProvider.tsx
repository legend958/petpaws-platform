"use client";

// Demo-role state shared across all screens. This is plain React Context
// (built into React) — not a state-management library.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getStoredRole, storeRole, type DemoRole } from "@/lib/client";

const RoleContext = createContext<{ role: DemoRole; setRole: (r: DemoRole) => void }>({
  role: "guest",
  setRole: () => {},
});

export function DemoRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<DemoRole>("guest");

  useEffect(() => {
    setRoleState(getStoredRole());
  }, []);

  const setRole = (next: DemoRole) => {
    storeRole(next);
    setRoleState(next);
  };

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useDemoRole() {
  return useContext(RoleContext);
}