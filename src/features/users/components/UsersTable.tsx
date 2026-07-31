import { useState, type MouseEvent } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import type { User } from '../types/user.types';
import { UserStatusChip } from './UserStatusChip';
import { UserRoleChip } from './UserRoleChip';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onChangePassword: (user: User) => void;
  /** id del usuario cuyo cambio de estado está en curso ahora mismo. */
  statusPendingUserId?: string;
}

export function UsersTable({
  users,
  onEdit,
  onToggleStatus,
  onChangePassword,
  statusPendingUserId,
}: UsersTableProps) {
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
            <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => {
            const isStatusPending = user.id === statusPendingUserId;

            return (
              <TableRow key={user.id} hover sx={{ opacity: isStatusPending ? 0.6 : 1 }}>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <UserRoleChip role={user.role} />
                </TableCell>
                <TableCell>
                  <UserStatusChip isActive={user.isActive} />
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

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            if (menuUser) onEdit(menuUser);
            closeMenu();
          }}
        >
          Editar
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuUser) onChangePassword(menuUser);
            closeMenu();
          }}
        >
          Cambiar contraseña
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuUser) onToggleStatus(menuUser);
            closeMenu();
          }}
        >
          {menuUser?.isActive ? 'Desactivar' : 'Activar'}
        </MenuItem>
      </Menu>
    </TableContainer>
  );
}
