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
          <CandidatesTable candidates={candidates} />

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
