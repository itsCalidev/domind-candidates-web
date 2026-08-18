import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { paths } from '@/routes/paths';
import { UserRole } from '@/features/auth/types/role.enum';

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
  /**
   * Si se omite, el ítem es visible para cualquier rol autenticado.
   * Esto NO es la infraestructura de autorización completa (RoleGuard)
   * que está planeada como fase aparte — es solo el dato mínimo
   * necesario para ocultar un ítem del menú por rol. La fase de
   * autorización reemplazará/reutilizará este campo con algo más
   * completo (rutas y botones, no solo el menú).
   */
  allowedRoles?: UserRole[];
}

/**
 * Navegación como datos: agregar, quitar o filtrar por rol un ítem del
 * sidebar es un cambio de este arreglo, no del componente visual.
 */
export const navItems: NavItem[] = [
  { label: 'Dashboard', path: paths.dashboard, icon: DashboardOutlinedIcon },
  { label: 'Candidatos', path: paths.candidates, icon: PeopleAltOutlinedIcon },
  {
    label: 'Usuarios',
    path: paths.users,
    icon: Groups2OutlinedIcon,
    allowedRoles: [UserRole.SYSTEM, UserRole.ADMIN],
  },
];

/** Ítems visibles para un rol dado. Sin rol (sesión aún cargando), no se muestra nada restringido. */
export function getVisibleNavItems(role: UserRole | undefined): NavItem[] {
  return navItems.filter((item) => !item.allowedRoles || (role && item.allowedRoles.includes(role)));
}
