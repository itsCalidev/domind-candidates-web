import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface LayoutContextValue {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

/**
 * Estado puramente visual (colapsado / abierto en móvil), aislado dentro
 * de `layouts/`. No es estado de negocio, por lo que no vive en un store
 * global de la aplicación.
 */
export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const value = useMemo(
    () => ({
      isSidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed((prev) => !prev),
      isMobileSidebarOpen,
      setMobileSidebarOpen,
    }),
    [isSidebarCollapsed, isMobileSidebarOpen],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error('useLayout debe usarse dentro de <LayoutProvider>');
  }
  return ctx;
}
