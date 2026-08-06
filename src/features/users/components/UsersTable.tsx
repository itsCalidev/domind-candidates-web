import { useState, type MouseEvent } from 'react';
import {
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import type { User } from '../types/user.types';
import { UserStatusChip } from './UserStatusChip';
import { UserRoleChip } from './UserRoleChip';
import { UserAvatar } from './UserAvatar';
import { formatShortDate } from '@/shared/utils/formatDate';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  /** id del usuario cuyo cambio de estado está en curso ahora mismo. */
  statusPendingUserId?: string;
}

export function UsersTable({ users, onEdit, onToggleStatus, statusPendingUserId }: UsersTableProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuUser, setMenuUser] = useState<User | null>(null);

  function openMenu(event: MouseEvent<HTMLElement>, user: User) {
    setMenuAnchor(event.currentTarget);
    setMenuUser(user);
  }

  function closeMenu() {
    setMenuAnchor(null);
    setMenuUser(null);
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, py: 2 }}>Usuario</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Correo</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Última actualización</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => {
            const isStatusPending = user.id === statusPendingUserId;

            return (
              <TableRow
                key={user.id}
                hover
                sx={{ opacity: isStatusPending ? 0.6 : 1, '& td': { py: 1.75 } }}
              >
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <UserAvatar firstName={user.firstName} lastName={user.lastName} role={user.role} />
                    <Typography variant="body2" fontWeight={600}>
                      {user.firstName} {user.lastName}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <UserRoleChip role={user.role} />
                </TableCell>
                <TableCell>
                  <UserStatusChip isActive={user.isActive} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatShortDate(user.updatedAt)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => openMenu(e, user)}
                    disabled={isStatusPending}
                  >
                    <MoreVertOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={closeMenu}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2.5,
              minWidth: 200,
              boxShadow: '0px 12px 32px rgba(0,0,0,0.14)',
              '& .MuiMenuItem-root': {
                py: 1.1,
                px: 2,
                '&:hover': { bgcolor: 'rgba(0,74,152,0.06)' },
              },
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuUser) onEdit(menuUser);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={() => {
            if (menuUser) onToggleStatus(menuUser);
            closeMenu();
          }}
          sx={{ color: menuUser?.isActive ? 'error.main' : 'success.main' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            {menuUser?.isActive ? (
              <ToggleOffOutlinedIcon fontSize="small" />
            ) : (
              <ToggleOnOutlinedIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>{menuUser?.isActive ? 'Desactivar' : 'Activar'}</ListItemText>
        </MenuItem>
      </Menu>
    </TableContainer>
  );
}
