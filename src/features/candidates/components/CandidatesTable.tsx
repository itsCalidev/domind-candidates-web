import {
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { CandidateListItem } from '../types/candidate.types';
import { CandidateStatusChip } from './CandidateStatusChip';
import { paths } from '@/routes/paths';
import { scrollableTableContainerSx, stickyTableHeadCellSx } from '@/shared/constants/table';

interface CandidatesTableProps {
  candidates: CandidateListItem[];
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
            <TableCell sx={{ fontWeight: 600, ...stickyTableHeadCellSx }}>Empresa</TableCell>
            <TableCell sx={{ fontWeight: 600, ...stickyTableHeadCellSx }}>Puesto solicitado</TableCell>
            <TableCell sx={{ fontWeight: 600, ...stickyTableHeadCellSx }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 600, ...stickyTableHeadCellSx }} align="right">Acciones</TableCell>
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
                <Typography variant="body2">{candidate.companyName}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{candidate.positionName}</Typography>
              </TableCell>
              <TableCell>
                <CandidateStatusChip status={candidate.status} />
              </TableCell>
              <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                <Button 
                  size="small" 
                  onClick={() => navigate(paths.candidateDetail(candidate.id))}
                >
                  Ver detalle
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {candidates.length === 0 && (
            <TableRow>
              {/* Cambiamos el colSpan a 6 porque ahora tenemos 6 columnas */}
              <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
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