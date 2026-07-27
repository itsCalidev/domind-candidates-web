import {
  Box,
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

interface CandidatesTableProps {
  candidates: CandidateListItem[];
}

export function CandidatesTable({ candidates }: CandidatesTableProps) {
  const navigate = useNavigate();

  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Candidato</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Puesto solicitado</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 600, width: 180 }}>Avance</TableCell>
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
              <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
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
