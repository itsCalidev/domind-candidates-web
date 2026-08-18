import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageLoader } from '@/shared/components/PageLoader';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { GuestRoute } from '@/features/auth/components/GuestRoute';
import { RequirePasswordChangeRoute } from '@/features/auth/components/RequirePasswordChangeRoute';
import { paths } from './paths';

/**
 * Cada página se carga bajo demanda (code-splitting por ruta).
 *
 * Hoy estas páginas son livianas, pero el módulo de Candidatos crecerá
 * con varias secciones (salud, vivienda, economía, familia, documentos...),
 * y establecer esta convención desde ya evita tener que migrar rutas
 * "en caliente" más adelante.
 */
const LoginPage = lazy(() =>
  import('@/features/auth/components/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const ForcePasswordChangePage = lazy(() =>
  import('@/features/auth/components/ForcePasswordChangePage').then((m) => ({
    default: m.ForcePasswordChangePage,
  })),
);
const DashboardPage = lazy(() =>
  import('@/features/dashboard/components/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const CandidatesListPage = lazy(() =>
  import('@/features/candidates/components/CandidatesListPage').then((m) => ({
    default: m.CandidatesListPage,
  })),
);
const CandidateDetailPage = lazy(() =>
  import('@/features/candidates/components/CandidateDetailPage').then((m) => ({
    default: m.CandidateDetailPage,
  })),
);
const UsersPage = lazy(() =>
  import('@/features/users/components/UsersPage').then((m) => ({ default: m.UsersPage })),
);
const ProfilePage = lazy(() =>
  import('@/features/profile/components/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const AdminLayout = lazy(() =>
  import('@/layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to={paths.login} replace />} />

        <Route
          path={paths.login}
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />

        {/* Fuera de AdminLayout a propósito: sin sidebar, sin menú, mientras
            el backend exija cambiar la contraseña (ver ProtectedRoute). */}
        <Route
          path={paths.changePassword}
          element={
            <RequirePasswordChangeRoute>
              <ForcePasswordChangePage />
            </RequirePasswordChangeRoute>
          }
        />

        {/* Rutas del panel administrativo, protegidas y bajo el mismo layout */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path={paths.dashboard} element={<DashboardPage />} />
          <Route path={paths.candidates} element={<CandidatesListPage />} />
          <Route path={paths.candidateDetail(':id')} element={<CandidateDetailPage />} />
          <Route path={paths.users} element={<UsersPage />} />
          <Route path={paths.profile} element={<ProfilePage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
