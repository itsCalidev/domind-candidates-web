import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '@/shared/components/PageLoader';
import { paths } from '@/routes/paths';

/**
 * Exige una sesión válida. Hoy solo verifica que exista un usuario
 * autenticado — permisos por rol (SYSTEM/ADMIN/RECRUITER) son una
 * fase posterior.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to={paths.login} replace />;

  return <>{children}</>;
}
