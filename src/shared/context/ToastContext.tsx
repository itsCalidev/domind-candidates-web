import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';

export type ToastSeverity = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  message: string;
  severity: ToastSeverity;
  key: number;
}

interface ToastContextValue {
  showToast: (message: string, severity?: ToastSeverity) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Notificaciones globales tipo Snackbar. Estado 100% en memoria
 * (useState) — deliberadamente sin sessionStorage/localStorage: al
 * recargar la página (F5) el árbol de React se reconstruye desde cero
 * y la notificación desaparece sin volver a mostrarse, tal como se pidió.
 *
 * Vive en shared/ (no en features/auth ni en ninguna feature) porque
 * cualquier parte de la app puede necesitar mostrar feedback — se monta
 * una sola vez en App.tsx, envolviendo toda la aplicación.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [open, setOpen] = useState(false);

  const showToast = useCallback((message: string, severity: ToastSeverity = 'success') => {
    setToast({ message, severity, key: Date.now() });
    setOpen(true);
  }, []);

  function handleClose(_event?: unknown, reason?: string) {
    if (reason === 'clickaway') return;
    setOpen(false);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        key={toast?.key}
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {toast ? (
          <Alert onClose={handleClose} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return ctx;
}
