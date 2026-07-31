import { Chip } from '@mui/material';
import { UserRole } from '@/features/auth/types/role.enum';

interface UserRoleChipProps {
  role: UserRole;
}

/** Solo color por rol; el texto es siempre el valor exacto del backend. */
const roleColor: Record<UserRole, string> = {
  [UserRole.SYSTEM]: '#69478E',
  [UserRole.ADMIN]: '#004A98',
  [UserRole.RECRUITER]: '#0083C1',
};

export function UserRoleChip({ role }: UserRoleChipProps) {
  const color = roleColor[role];

  return (
    <Chip
      label={role}
      size="small"
      sx={{ bgcolor: `${color}1A`, color, fontWeight: 600, border: 'none' }}
    />
  );
}
