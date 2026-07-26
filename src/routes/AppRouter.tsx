import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageLoader } from '@/shared/components/PageLoader';
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
const DashboardPage = lazy(() =>
  import('@/features/dashboard/components/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const CandidatesListPage = lazy(() =>
  import('@/features/candidates/components/CandidatesListPage').then((m) => ({
    default: m.CandidatesListPage,
  })),
);

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to={paths.login} replace />} />
        <Route path={paths.login} element={<LoginPage />} />
        <Route path={paths.dashboard} element={<DashboardPage />} />
        <Route path={paths.candidates} element={<CandidatesListPage />} />
      </Routes>
    </Suspense>
  );
}
