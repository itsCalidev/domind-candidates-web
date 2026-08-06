import { useEffect } from 'react';
import {
  Box,
  InputAdornment,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useCandidatesList } from '../hooks/useCandidatesList';
import { CandidatesTable } from './CandidatesTable';
import { CANDIDATE_STATUS_LABEL, type CandidateStatus } from '../types/candidate.types';
import { SelectionActionBar } from '@/shared/components/SelectionActionBar';
import { useRowSelection } from '@/shared/hooks/useRowSelection';

export function CandidatesListPage() {
  const {
    candidates,
    totalResults,
    isLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    totalPages,
    setPage,
  } = useCandidatesList();

  const selection = useRowSelection<string>({
    pageIds: candidates.map((candidate) => candidate.id),
    totalCount: totalResults,
  });

  // Igual que en Users: cambiar de búsqueda/filtro limpia la selección
  // (ya no refiere al mismo conjunto de resultados); cambiar de página
  // deliberadamente no está en estas dependencias.
  useEffect(() => {
    selection.clearSelection();
  }, [search, statusFilter, selection.clearSelection]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Candidatos
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {totalResults} candidato{totalResults !== 1 ? 's' : ''} encontrado
        {totalResults !== 1 ? 's' : ''}
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Buscar por nombre o puesto…"
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: { sm: 320 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          select
          size="small"
          label="Estado"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CandidateStatus | 'all')}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          {Object.entries(CANDIDATE_STATUS_LABEL).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {isLoading ? (
        <Skeleton variant="rounded" height={420} sx={{ borderRadius: 3 }} />
      ) : (
        <>
          {selection.hasSelection && (
            <SelectionActionBar
              selectedCount={selection.selectedCount}
              totalCount={totalResults}
              isAllSelected={selection.isAllSelected}
              canSelectAllMatching={totalPages > 1}
              onSelectAllMatching={selection.selectAllMatching}
              onClearSelection={selection.clearSelection}
              // Slot `actions` vacío a propósito — misma razón que en Users.
            />
          )}

          <CandidatesTable
            candidates={candidates}
            headerState={selection.headerState}
            isSelected={selection.isSelected}
            toggleRow={selection.toggleRow}
            toggleAllOnPage={selection.toggleAllOnPage}
          />

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                shape="rounded"
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
