import { useCallback, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { useCandidatesList } from '../hooks/useCandidatesList';
import { CandidatesTable } from './CandidatesTable';
import { CANDIDATE_STATUS_LABEL, type CandidateStatus, type CandidateListItem } from '../types/candidate.types';
import {
  CANDIDATE_EXPORT_COLUMNS,
  CANDIDATE_PDF_TABLE_COLUMNS,
  buildCandidatesPdfSubtitle,
} from '../services/candidateExport';
import { SelectionActionBar } from '@/shared/components/SelectionActionBar';
import { PaginationBar } from '@/shared/components/PaginationBar';
import { ExportButton } from '@/shared/components/ExportButton';
import { useRowSelection, type SelectionPayload } from '@/shared/hooks/useRowSelection';
import { useExport } from '@/shared/hooks/useExport';
import { downloadCsv } from '@/shared/utils/csv';
import { downloadTablePdf } from '@/shared/utils/pdf';
import { extractApiErrorMessage } from '@/shared/utils/apiError';

export function CandidatesListPage() {
  const {
    candidates,
    totalResults,
    totalPages,
    isLoading,
    isError,
    error,
    refetch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    activeFilter,
    setActiveFilter,
    page,
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
  }, [search, statusFilter, activeFilter, pageSize, selection.clearSelection]);

  // Excel/CSV: sin cambios de comportamiento — sin selección exporta
  // solo la vista actual, exactamente como ya funcionaba.
  const {
    isExporting: isExportingCsv,
    error: csvExportError,
    runExport: exportToCsv,
  } = useExport<CandidateListItem, string>({
    currentPageItems: candidates,
    getId: (candidate) => candidate.id,
    getSelectionPayload: selection.getSelectionPayload,
    totalPages,
    pageSize,
    fetchPage,
    generateFile: (records) => downloadCsv('candidates-export.csv', records, CANDIDATE_EXPORT_COLUMNS),
  });

  // PDF de la tabla: a diferencia del CSV, sin selección exporta TODOS
  // los registros que coincidan con los filtros activos (no solo la
  // página visible) — es la naturaleza de un PDF documental, pensado
  // para imprimirse/archivarse completo. Se logra pasando un payload
  // "exclude, sin excepciones" cuando no hay selección real: eso hace
  // que resolveSelectionRecords recorra todas las páginas, igual que ya
  // hace cuando SÍ hay una selección — sin duplicar esa lógica.
  const getPdfSelectionPayload = useCallback((): SelectionPayload<string> => {
    if (selection.hasSelection) return selection.getSelectionPayload();
    return { mode: 'exclude', ids: [], totalCount: totalResults };
  }, [selection.hasSelection, selection.getSelectionPayload, totalResults]);

  const {
    isExporting: isExportingPdf,
    error: pdfExportError,
    runExport: exportToPdf,
  } = useExport<CandidateListItem, string>({
    currentPageItems: candidates,
    getId: (candidate) => candidate.id,
    getSelectionPayload: getPdfSelectionPayload,
    totalPages,
    pageSize,
    fetchPage,
    generateFile: (records) =>
      downloadTablePdf({
        fileName: 'candidates-export.pdf',
        title: 'Candidatos',
        subtitle: buildCandidatesPdfSubtitle({ search, statusFilter, activeFilter }),
        columns: CANDIDATE_PDF_TABLE_COLUMNS,
        items: records,
      }),
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
        <Typography variant="h4">Candidatos</Typography>
        <Stack direction="row" spacing={1.5}>
          <ExportButton
            label="Exportar Excel"
            icon={<TableChartOutlinedIcon fontSize="small" />}
            onExport={exportToCsv}
            isExporting={isExportingCsv}
            disabled={isLoading || isExportingPdf}
          />
          <ExportButton
            label="Exportar PDF"
            icon={<PictureAsPdfOutlinedIcon fontSize="small" />}
            onExport={exportToPdf}
            isExporting={isExportingPdf}
            disabled={isLoading || isExportingCsv}
          />
        </Stack>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {totalResults} candidato{totalResults !== 1 ? 's' : ''} encontrado
        {totalResults !== 1 ? 's' : ''}
      </Typography>

      {csvExportError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {csvExportError}
        </Alert>
      )}
      {pdfExportError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {pdfExportError}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Buscar por nombre, folio o puesto…"
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

        <TextField
          select
          size="small"
          label="Activo"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="active">Activo</MenuItem>
          <MenuItem value="inactive">Inactivo</MenuItem>
        </TextField>
      </Stack>

      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        >
          {extractApiErrorMessage(error, 'No se pudo cargar la lista de candidatos.')}
        </Alert>
      )}

      {isLoading && <Skeleton variant="rounded" height={420} sx={{ borderRadius: 3 }} />}

      {!isLoading && !isError && (
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
              permanente y no depende de candidates.length. */}
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
