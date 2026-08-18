import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '@/shared/components/PageLoader';
import { paths } from '@/routes/paths';

/**
 * Exige una sesión válida. Permisos por rol (SYSTEM/ADMIN/RECRUITER) son
 * una fase posterior.
 *
 * También bloquea la navegación mientras `mustChangePassword` sea true:
 * como AdminLayout (sidebar incluido) solo se renderiza dentro de esta
 * guarda, el usuario nunca llega a ver el menú ni ninguna pantalla del
 * panel hasta completar /change-password.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to={paths.login} replace />;
  if (mustChangePassword) return <Navigate to={paths.changePassword} replace />;

  return <>{children}</>;
}
