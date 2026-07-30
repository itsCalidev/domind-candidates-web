import { Chip } from '@mui/material';

interface UserStatusChipProps {
  isActive: boolean;
}

/**
 * Representa visualmente el estado del usuario. No hay "Eliminado":
 * únicamente Activo/Inactivo, tal como pide el negocio (el borrado
 * físico es una capacidad exclusiva de SYSTEM, fuera de alcance aquí).
 */
export function UserStatusChip({ isActive }: UserStatusChipProps) {
  const color = isActive ? '#76B82A' : '#706F6F';

  return (
    <Chip
      label={isActive ? 'Activo' : 'Inactivo'}
      size="small"
      sx={{ bgcolor: `${color}1A`, color, fontWeight: 600, border: 'none' }}
    />
  );
}
