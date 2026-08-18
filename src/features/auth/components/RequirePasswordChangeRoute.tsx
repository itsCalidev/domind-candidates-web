import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '@/shared/components/PageLoader';
import { paths } from '@/routes/paths';

/**
 * Guarda exclusiva de /change-password: exige sesión activa Y que el
 * backend haya marcado mustChangePassword en este login. Complemento
 * exacto de ProtectedRoute, que redirige aquí mientras el flag sea true —
 * esta guarda hace lo contrario: si ya no aplica (sesión normal, o el
 * usuario ya completó el cambio), no hay razón para ver esta pantalla.
 */
export function RequirePasswordChangeRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to={paths.login} replace />;
  if (!mustChangePassword) return <Navigate to={paths.dashboard} replace />;

  return <>{children}</>;
}
