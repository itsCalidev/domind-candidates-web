import { useState, type MouseEvent } from 'react';
import {
  Checkbox,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import { useNavigate } from 'react-router-dom';
import { recruiterFullName, type CandidateListItem } from '../types/candidate.types';
import { CandidateStatusChip } from './CandidateStatusChip';
import { paths } from '@/routes/paths';
import { scrollableTableContainerSx, stickyTableHeadCellSx } from '@/shared/constants/table';

interface CandidatesTableProps {
  candidates: CandidateListItem[];
  /**
   * Asignar reclutador es exclusivo de SYSTEM/ADMIN (ver hasFullAccess en
   * role.enum.ts). Igual que UsersTable, la tabla no decide el rol:
   * recibe el resultado ya calculado desde la página.
   */
  onAssignRecruiter: (candidate: CandidateListItem) => void;
  canAssignRecruiter: boolean;
  headerState: 'checked' | 'indeterminate' | 'unchecked';
  isSelected: (id: string) => boolean;
  toggleRow: (id: string) => void;
  toggleAllOnPage: () => void;
}

/** Columnas totales, para el colSpan del estado vacío. */
const COLUMN_COUNT = 7;

export function CandidatesTable({
  candidates,
  onAssignRecruiter,
  canAssignRecruiter,
  headerState,
  isSelected,
  toggleRow,
  toggleAllOnPage,
}: CandidatesTableProps) {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuCandidate, setMenuCandidate] = useState<CandidateListItem | null>(null);

  function openMenu(event: MouseEvent<HTMLElement>, candidate: CandidateListItem) {
    setMenuAnchor(event.currentTarget);
    setMenuCandidate(candidate);
  }

  function closeMenu() {
    setMenuAnchor(null);
    setMenuCandidate(null);
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ borderRadius: 3, ...scrollableTableContainerSx }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" scope="col" sx={stickyTableHeadCellSx}>
              <Checkbox
                checked={headerState === 'checked'}
                indeterminate={headerState === 'indeterminate'}
                onChange={toggleAllOnPage}
                slotProps={{ input: { 'aria-label': 'Seleccionar todas las filas visibles' } }}
              />
            </TableCell>
            <TableCell scope="col" sx={{ fontWeight: 600, ...stickyTableHeadCellSx }}>Candidato</TableCell>
            <TableCell scope="col" sx={{ fontWeight: 600, ...stickyTableHeadCellSx }}>Empresa</TableCell>
            <TableCell scope="col" sx={{ fontWeight: 600, ...stickyTableHeadCellSx }}>Puesto solicitado</TableCell>
            <TableCell scope="col" sx={{ fontWeight: 600, ...stickyTableHeadCellSx }}>Asignado a</TableCell>
            <TableCell scope="col" sx={{ fontWeight: 600, ...stickyTableHeadCellSx }}>Estado</TableCell>
            <TableCell scope="col" sx={{ fontWeight: 600, ...stickyTableHeadCellSx }} align="right">Acciones</TableCell>
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
                <Typography
                  variant="body2"
                  color={candidate.assignedRecruiter ? 'text.primary' : 'text.disabled'}
                  fontStyle={candidate.assignedRecruiter ? 'normal' : 'italic'}
                >
                  {recruiterFullName(candidate.assignedRecruiter)}
                </Typography>
              </TableCell>
              <TableCell>
                <CandidateStatusChip status={candidate.status} />
              </TableCell>
              <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                <IconButton
                  size="small"
                  onClick={(e) => openMenu(e, candidate)}
                  aria-label={`Más acciones para ${candidate.fullName}`}
                >
                  <MoreVertOutlinedIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}

          {candidates.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} align="center" sx={{ py: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  No se encontraron candidatos con estos filtros.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={closeMenu}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2.5,
              minWidth: 200,
              boxShadow: '0px 12px 32px rgba(0,0,0,0.14)',
              '& .MuiMenuItem-root': {
                py: 1.1,
                px: 2,
                '&:hover': { bgcolor: 'rgba(0,74,152,0.06)' },
              },
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuCandidate) navigate(paths.candidateDetail(menuCandidate.id));
            closeMenu();
          }}
        >
          <ListItemIcon>
            <VisibilityOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver detalle</ListItemText>
        </MenuItem>

        {canAssignRecruiter && (
          <>
            <Divider sx={{ my: 0.5 }} />
            {menuCandidate?.status === 'ARCHIVED' ? (
              <Tooltip title="No se puede asignar un candidato archivado" placement="left">
                <span>
                  <MenuItem disabled>
                    <ListItemIcon>
                      <AssignmentIndOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Asignar reclutador</ListItemText>
                  </MenuItem>
                </span>
              </Tooltip>
            ) : (
              <MenuItem
                onClick={() => {
                  if (menuCandidate) onAssignRecruiter(menuCandidate);
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <AssignmentIndOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  {menuCandidate?.assignedRecruiter ? 'Cambiar reclutador' : 'Asignar reclutador'}
                </ListItemText>
              </MenuItem>
            )}
          </>
        )}
      </Menu>
    </TableContainer>
  );
}
