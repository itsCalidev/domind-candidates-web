import { useEffect } from 'react';
import {
  Alert,
  Box,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useCandidatesList } from '../hooks/useCandidatesList';
import { CandidatesTable } from './CandidatesTable';
import { CANDIDATE_STATUS_LABEL, type CandidateStatus, type CandidateListItem } from '../types/candidate.types';
import { CANDIDATE_EXPORT_COLUMNS } from '../services/candidateExport';
import { SelectionActionBar } from '@/shared/components/SelectionActionBar';
import { PaginationBar } from '@/shared/components/PaginationBar';
import { ExportButton } from '@/shared/components/ExportButton';
import { useRowSelection } from '@/shared/hooks/useRowSelection';
import { useExport } from '@/shared/hooks/useExport';

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
    pageSize,
    setPageSize,
    fetchPage,
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
  }, [search, statusFilter, pageSize, selection.clearSelection]);

  const { isExporting, error: exportError, exportToCsv } = useExport<CandidateListItem, string>({
    currentPageItems: candidates,
    getId: (candidate) => candidate.id,
    getSelectionPayload: selection.getSelectionPayload,
    totalPages,
    pageSize,
    fetchPage,
    columns: CANDIDATE_EXPORT_COLUMNS,
    fileName: 'candidates-export.csv',
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
        <Typography variant="h4">Candidatos</Typography>
        <ExportButton onExport={exportToCsv} isExporting={isExporting} disabled={isLoading} />
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {totalResults} candidato{totalResults !== 1 ? 's' : ''} encontrado
        {totalResults !== 1 ? 's' : ''}
      </Typography>

      {exportError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {exportError}
        </Alert>
      )}

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

          {/* Misma regla que en Users: PaginationBar decide internamente
              si oculta el control de páginas; el selector de tamaño es
              permanente mientras no esté cargando. */}
          <PaginationBar
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            totalCount={totalResults}
          />
        </>
      )}
    </Box>
  );
}
