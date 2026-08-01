import { Avatar } from '@mui/material';
import { UserRole } from '@/features/auth/types/role.enum';
import { roleColor } from './UserRoleChip';

interface UserAvatarProps {
  firstName: string;
  lastName: string;
  role: UserRole;
}

export function UserAvatar({ firstName, lastName, role }: UserAvatarProps) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

  return (
    <Avatar
      sx={{
        bgcolor: roleColor[role],
        width: 36,
        height: 36,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {initials}
    </Avatar>
  );
}
