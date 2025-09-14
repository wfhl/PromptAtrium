import { createContext, useContext, useState, ReactNode } from "react";

interface AdminModeContextType {
  isAdminMode: boolean;
  setIsAdminMode: (value: boolean) => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [isAdminMode, setIsAdminMode] = useState(false);

  return (
    <AdminModeContext.Provider value={{ isAdminMode, setIsAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (context === undefined) {
    // Return a default value if not in provider
    return { isAdminMode: false, setIsAdminMode: () => {} };
  }
  return context;
}