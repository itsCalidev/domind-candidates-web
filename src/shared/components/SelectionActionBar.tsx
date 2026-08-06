import type { ReactNode } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';

export interface SelectionActionBarProps {
  selectedCount: number;
  /** Total de registros que coinciden con el filtro activo (todas las páginas). */
  totalCount?: number;
  /** true cuando ya están seleccionados TODOS los registros, no solo la página visible. */
  isAllSelected: boolean;
  /** true si hay más registros de los que caben en la página actual (tiene sentido ofrecer "seleccionar todos"). */
  canSelectAllMatching: boolean;
  onSelectAllMatching: () => void;
  onClearSelection: () => void;
  /**
   * Acciones masivas (exportar PDF/Excel, eliminar, cambios de estado…).
   * Vacío por ahora — se conectan en fases posteriores pasándolas como
   * children desde la página específica, sin modificar este componente
   * ni el hook de selección.
   */
  actions?: ReactNode;
}

/**
 * Barra que se muestra cuando hay al menos una fila seleccionada.
 * Puramente presentacional: toda la lógica de qué está seleccionado
 * vive en useRowSelection — este componente solo la refleja.
 */
export function SelectionActionBar({
  selectedCount,
  totalCount,
  isAllSelected,
  canSelectAllMatching,
  onSelectAllMatching,
  onClearSelection,
  actions,
}: SelectionActionBarProps) {
  return (
    <Paper
      elevation={0}
      role="region"
      aria-label="Selección de filas"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        px: 2.5,
        py: 1.5,
        mb: 2,
        borderRadius: 3,
        bgcolor: 'rgba(0,74,152,0.06)',
        border: '1px solid rgba(0,74,152,0.16)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        {/* aria-live: un lector de pantalla anuncia el cambio de conteo
            sin que el usuario tenga que volver a enfocar este bloque. */}
        <Typography variant="body2" fontWeight={600} color="primary.main" aria-live="polite">
          {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
        </Typography>

        {canSelectAllMatching && !isAllSelected && totalCount !== undefined && (
          <Button size="small" onClick={onSelectAllMatching} sx={{ textTransform: 'none' }}>
            Seleccionar los {totalCount} registros
          </Button>
        )}

        <Button size="small" color="inherit" onClick={onClearSelection} sx={{ textTransform: 'none' }}>
          Limpiar selección
        </Button>
      </Box>

      {actions && (
        <Box role="group" aria-label="Acciones masivas" sx={{ display: 'flex', gap: 1 }}>
          {actions}
        </Box>
      )}
    </Paper>
  );
}
