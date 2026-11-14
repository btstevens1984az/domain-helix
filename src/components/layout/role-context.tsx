"use client";

import { createContext, useContext } from "react";
import type { RoleView } from "@/types";

const RoleContext = createContext<{
  role: RoleView;
  setRole: (role: RoleView) => void;
}>({
  role: "identity_engineer",
  setRole: () => undefined,
});

export function RoleProvider({
  role,
  setRole,
  children,
}: {
  role: RoleView;
  setRole: (role: RoleView) => void;
  children: React.ReactNode;
}) {
  return (
    <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
