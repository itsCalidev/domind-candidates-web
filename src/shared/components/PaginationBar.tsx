import { MenuItem, Pagination, Stack, TextField, Typography } from '@mui/material';
import { PAGE_SIZE_OPTIONS } from '@/shared/constants/table';

export interface PaginationBarProps {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** Total de registros que coinciden con el filtro activo, para la etiqueta "mostrando X–Y de Z". */
  totalCount?: number;
  pageSizeOptions?: readonly number[];
}

/**
 * Barra de paginación reutilizable por cualquier tabla del proyecto:
 * selector de "filas por página" + control de páginas de MUI + etiqueta
 * de rango. No conoce Users, Candidates ni ningún dominio — recibe todo
 * por props, igual que SelectionActionBar.
 *
 * Regla de visibilidad importante, y por qué vive AQUÍ y no en cada
 * página que lo usa: el selector de "filas por página" es permanente
 * (debe seguir existiendo con 0 registros, con una sola página, tras
 * cambiar el límite, etc.) — solo el control de números de página tiene
 * sentido ocultar cuando `totalPages <= 1`. Si esa regla viviera en cada
 * página consumidora, cualquier tabla futura podría reintroducir el
 * mismo bug de "el selector desaparece". Al vivir en un solo lugar,
 * queda resuelto para siempre en toda la infraestructura.
 */
export function PaginationBar({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalCount,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: PaginationBarProps) {
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = totalCount !== undefined ? Math.min(page * pageSize, totalCount) : undefined;

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      sx={{ mt: 3 }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          Filas por página
        </Typography>
        <TextField
          select
          size="small"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          sx={{ width: 84 }}
          slotProps={{ select: { 'aria-label': 'Filas por página' } }}
        >
          {pageSizeOptions.map((size) => (
            <MenuItem key={size} value={size}>
              {size}
            </MenuItem>
          ))}
        </TextField>

        {totalCount !== undefined && (
          <Typography variant="body2" color="text.secondary">
            {rangeStart}–{rangeEnd} de {totalCount}
          </Typography>
        )}
      </Stack>

      {totalPages > 1 && (
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => onPageChange(value)}
          shape="rounded"
          color="primary"
        />
      )}
    </Stack>
  );
}
