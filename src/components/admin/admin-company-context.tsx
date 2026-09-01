"use client";

import { createContext, useContext } from "react";

const AdminCompanyContext = createContext<string | null>(null);

export function AdminCompanyProvider({
  companyId,
  children,
}: {
  companyId: string;
  children: React.ReactNode;
}) {
  return (
    <AdminCompanyContext.Provider value={companyId}>
      {children}
    </AdminCompanyContext.Provider>
  );
}

export function useAdminCompanyId() {
  const companyId = useContext(AdminCompanyContext);
  if (!companyId) {
    throw new Error("useAdminCompanyId must be used within AdminCompanyProvider");
  }
  return companyId;
}
