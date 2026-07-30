import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { User } from '../types/user.types';
import { UserStatusChip } from './UserStatusChip';

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </TableCell>
              <TableCell>
                {/* Rol sin traducir: mismo valor exacto que expone el backend */}
                <Typography variant="body2">{user.role}</Typography>
              </TableCell>
              <TableCell>
                <UserStatusChip isActive={user.isActive} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
