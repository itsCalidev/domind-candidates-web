import { IconButton, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

/**
 * Ícono "(i)" con Tooltip — para aclarar, junto al título de una sección
 * de formulario, una regla que de otra forma el usuario solo descubre al
 * chocar con un bloqueo (ej. el mínimo de fotos de vivienda que exige
 * `getMissingDataReport` para poder enviar el Wizard). `IconButton` (no
 * un `<span>` envuelto en Tooltip) para que también funcione por teclado/
 * foco, no solo al pasar el mouse.
 */
export function InfoTooltip({ title }: { title: string }) {
  return (
    <Tooltip title={title} arrow placement="top">
      <IconButton size="small" aria-label="Más información" sx={{ p: 0.25 }}>
        <InfoOutlinedIcon fontSize="small" color="action" />
      </IconButton>
    </Tooltip>
  );
}
