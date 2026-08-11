import { Button } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

interface ExportButtonProps {
  onExport: () => void;
  disabled?: boolean;
  isExporting?: boolean;
  label?: string;
}

/**
 * Botón de exportación genérico, sin conocimiento de Users/Candidates.
 * Vive fuera de SelectionActionBar a propósito: Export tiene comportamiento
 * definido CON y SIN selección activa, así que necesita estar siempre
 * visible en la barra de herramientas de la página — no solo cuando hay
 * filas seleccionadas (el slot `actions` de SelectionActionBar queda
 * reservado para acciones que únicamente tienen sentido con selección,
 * como eliminar o cambiar estado en lote).
 */
export function ExportButton({
  onExport,
  disabled = false,
  isExporting = false,
  label = 'Exportar',
}: ExportButtonProps) {
  return (
    <Button
      variant="outlined"
      color="inherit"
      size="small"
      startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
      onClick={onExport}
      disabled={disabled || isExporting}
      sx={{ textTransform: 'none' }}
    >
      {isExporting ? 'Exportando…' : label}
    </Button>
  );
}
