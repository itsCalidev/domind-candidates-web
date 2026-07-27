import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '@/shared/components/PageLoader';
import { paths } from '@/routes/paths';

/**
 * Complemento de ProtectedRoute: si ya hay sesión activa, no tiene
 * sentido mostrar el formulario de Login de nuevo.
 */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to={paths.dashboard} replace />;

  return <>{children}</>;
}
