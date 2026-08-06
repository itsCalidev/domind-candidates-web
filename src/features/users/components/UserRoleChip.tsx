import { Chip } from '@mui/material';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import { UserRole } from '@/features/auth/types/role.enum';

interface UserRoleChipProps {
  role: UserRole;
}

/**
 * Color por rol. Se exporta (no solo se usa internamente) porque
 * UserAvatar reutiliza exactamente el mismo mapeo — así el avatar y el
 * chip de rol se leen como el mismo dato visual, no como dos sistemas
 * de color distintos.
 */
export const roleColor: Record<UserRole, string> = {
  [UserRole.SYSTEM]: '#69478E',
  [UserRole.ADMIN]: '#004A98',
  [UserRole.RECRUITER]: '#0083C1',
};

/** Ícono por rol. Se exporta para reutilizarse fuera del Chip (selector de creación, filtro de rol). */
export const roleIcon: Record<UserRole, typeof AdminPanelSettingsOutlinedIcon> = {
  [UserRole.SYSTEM]: SettingsSuggestOutlinedIcon,
  [UserRole.ADMIN]: AdminPanelSettingsOutlinedIcon,
  [UserRole.RECRUITER]: BadgeOutlinedIcon,
};

export function UserRoleChip({ role }: UserRoleChipProps) {
  const color = roleColor[role];
  const Icon = roleIcon[role];

  return (
    <Chip
      icon={<Icon sx={{ fontSize: 16, color: `${color} !important` }} />}
      label={role}
      size="small"
      sx={{ bgcolor: `${color}1A`, color, fontWeight: 600, border: 'none' }}
    />
  );
}
