import {
  Box,
  Checkbox,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { CandidateListItem } from '../types/candidate.types';
import { CandidateStatusChip } from './CandidateStatusChip';
import { paths } from '@/routes/paths';
import { scrollableTableContainerSx, stickyTableHeadCellSx } from '@/shared/constants/table';

interface CandidatesTableProps {
  candidates: CandidateListItem[];
  /**
   * Props de selección: provienen de useRowSelection en la página
   * (orquestación). Mismo contrato exacto que UsersTable — ninguna
   * tabla mantiene su propio estado de selección.
   */
  headerState: 'checked' | 'indeterminate' | 'unchecked';
  isSelected: (id: string) => boolean;
  toggleRow: (id: string) => void;
  toggleAllOnPage: () => void;
}

export function CandidatesTable({
  candidates,
  headerState,
  isSelected,
  toggleRow,
  toggleAllOnPage,
}: CandidatesTableProps) {
  const navigate = useNavigate();

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ borderRadius: 3, ...scrollableTableContainerSx }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" sx={stickyTableHeadCellSx}>
              <Checkbox
                checked={headerState === 'checked'}
                indeterminate={headerState === 'indeterminate'}
                onChange={toggleAllOnPage}
                slotProps={{ input: { 'aria-label': 'Seleccionar todas las filas visibles' } }}
              />
            </TableCell>
            <TableCell sx={{ fontWeight: 600, ...stickyTableHeadCellSx }}>Candidato</TableCell>
            <TableCell sx={{ fontWeight: 600, ...stickyTableHeadCellSx }}>Puesto solicitado</TableCell>
            <TableCell sx={{ fontWeight: 600, ...stickyTableHeadCellSx }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 600, ...stickyTableHeadCellSx, width: 180 }}>Avance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow
              key={candidate.id}
              hover
              onClick={() => navigate(paths.candidateDetail(candidate.id))}
              sx={{ cursor: 'pointer' }}
            >
              {/* stopPropagation: clickear el checkbox no debe disparar
                  la navegación al detalle del candidato que sí dispara
                  el resto de la fila. */}
              <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected(candidate.id)}
                  onChange={() => toggleRow(candidate.id)}
                  slotProps={{
                    input: { 'aria-label': `Seleccionar a ${candidate.fullName}` },
                  }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {candidate.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {candidate.email}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{candidate.positionApplied}</Typography>
              </TableCell>
              <TableCell>
                <CandidateStatusChip status={candidate.status} />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={candidate.progress}
                    sx={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(0,0,0,0.06)',
                      '& .MuiLinearProgress-bar': { borderRadius: 3 },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ width: 32 }}>
                    {candidate.progress}%
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ))}

          {candidates.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  No se encontraron candidatos con estos filtros.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
