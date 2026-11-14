"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { RoleProvider } from "@/components/layout/role-context";
import type { RoleView } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<RoleView>("identity_engineer");

  return (
    <RoleProvider role={role} setRole={setRole}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </RoleProvider>
  );
}
