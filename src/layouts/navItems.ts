import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { paths } from '@/routes/paths';

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
}

/**
 * Navegación como datos: agregar, quitar o filtrar por rol un ítem del
 * sidebar es un cambio de este arreglo, no del componente visual.
 */
export const navItems: NavItem[] = [
  { label: 'Dashboard', path: paths.dashboard, icon: DashboardOutlinedIcon },
  { label: 'Candidatos', path: paths.candidates, icon: PeopleAltOutlinedIcon },
  { label: 'Usuarios', path: paths.users, icon: Groups2OutlinedIcon },
  { label: 'Configuración', path: paths.settings, icon: SettingsOutlinedIcon },
];
