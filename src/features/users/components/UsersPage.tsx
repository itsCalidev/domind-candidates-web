import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import { useUsersQuery } from '../hooks/useUsersQuery';
import { UsersTable } from './UsersTable';
import { extractApiErrorMessage } from '@/shared/utils/apiError';

export function UsersPage() {
  const {
    users,
    pagination,
    isLoading,
    isError,
    error,
    refetch,
    searchInput,
    setSearchInput,
    page,
    setPage,
  } = useUsersQuery();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Usuarios
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {pagination
          ? `${pagination.total} usuario${pagination.total !== 1 ? 's' : ''} encontrado${pagination.total !== 1 ? 's' : ''}`
          : 'Administra el acceso al panel administrativo.'}
      </Typography>

      <TextField
        placeholder="Buscar por nombre o correo…"
        size="small"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        sx={{ mb: 3, maxWidth: 320 }}
        fullWidth
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
          {extractApiErrorMessage(error, 'No se pudo cargar la lista de usuarios.')}
        </Alert>
      )}

      {isLoading && <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />}

      {!isLoading && !isError && users.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,74,152,0.08)',
              color: 'primary.main',
              mb: 2,
            }}
          >
            <PeopleOutlineOutlinedIcon />
          </Box>
          <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
            No se encontraron usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
            {searchInput
              ? 'Intenta con otro término de búsqueda.'
              : 'Todavía no hay usuarios registrados.'}
          </Typography>
        </Paper>
      )}

      {!isLoading && !isError && users.length > 0 && (
        <>
          <UsersTable users={users} />

          {pagination && pagination.totalPages > 1 && (
            <Stack alignItems="center" sx={{ mt: 3 }}>
              <Pagination
                count={pagination.totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                shape="rounded"
                color="primary"
              />
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}
