import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import { useRecruiters } from '../hooks/useRecruiters';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import {
  UNASSIGNED_RECRUITER_LABEL,
  recruiterFullName,
  type CandidateListItem,
} from '../types/candidate.types';
import { DialogHeader, dialogPaperSx } from '@/shared/components/DialogHeader';
import { extractApiErrorMessage } from '@/shared/utils/apiError';

/**
 * Valor del <Select> que representa "sin reclutador". No puede ser la
 * cadena vacía: MUI trata '' como "sin selección" y dejaría el campo
 * visualmente en blanco en vez de mostrar la opción elegida. Se traduce a
 * `recruiterId: null` justo antes de enviar.
 */
const UNASSIGNED_VALUE = '__unassigned__';

interface AssignRecruiterDialogProps {
  open: boolean;
  /** Basta con la forma del listado: el detalle la hereda vía CandidateDetail. */
  candidate: CandidateListItem | null;
  onClose: () => void;
}

/**
 * Igual que UserFormDialog: `open` controla el montaje, no solo la
 * visibilidad, para que cada apertura arranque con el reclutador actual
 * del candidato y no con el de la vez anterior.
 */
export function AssignRecruiterDialog({ open, candidate, onClose }: AssignRecruiterDialogProps) {
  if (!open || !candidate) return null;
  return <AssignRecruiterDialogContent key={candidate.id} candidate={candidate} onClose={onClose} />;
}

function AssignRecruiterDialogContent({
  candidate,
  onClose,
}: {
  candidate: CandidateListItem;
  onClose: () => void;
}) {
  const { recruiters, isLoading, isError, error } = useRecruiters();
  const { assignRecruiter } = useCandidateMutations();
  const [selectedId, setSelectedId] = useState(
    candidate.assignedRecruiter?.id ?? UNASSIGNED_VALUE,
  );

  const isPending = assignRecruiter.isPending;
  const currentId = candidate.assignedRecruiter?.id ?? UNASSIGNED_VALUE;
  const hasChanged = selectedId !== currentId;

  /**
   * El reclutador actual puede no estar en la lista: useRecruiters solo
   * trae los activos, así que si a este candidato lo asignaron antes de
   * que su reclutador se desactivara, su id no tendría <MenuItem> y el
   * Select se vería vacío. Se añade explícitamente para que el diálogo
   * siempre muestre el estado real.
   */
  const assigned = candidate.assignedRecruiter;
  const isAssignedMissing = !!assigned && !recruiters.some((r) => r.id === assigned.id);

  async function onSubmit() {
    try {
      await assignRecruiter.mutateAsync({
        id: candidate.id,
        recruiterId: selectedId === UNASSIGNED_VALUE ? null : selectedId,
      });
      onClose();
    } catch {
      // El toast de error ya lo emite useCandidateMutations; aquí solo
      // se evita cerrar el diálogo para que se pueda reintentar.
    }
  }

  return (
    <Dialog
      open
      onClose={isPending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: dialogPaperSx } }}
    >
      <DialogHeader
        icon={<AssignmentIndOutlinedIcon fontSize="small" />}
        title="Asignar reclutador"
        description={`${candidate.folio} — ${candidate.fullName}`}
        onClose={isPending ? undefined : onClose}
      />

      <DialogContent sx={{ px: 4, pt: 1, pb: 1 }}>
        <Stack spacing={2.5}>
          {isError && (
            <Alert severity="error">
              {extractApiErrorMessage(error, 'No se pudo cargar la lista de reclutadores.')}
            </Alert>
          )}

          <TextField
            select
            label="Reclutador"
            fullWidth
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={isLoading || isPending}
            helperText={
              isLoading ? 'Cargando reclutadores…' : 'Elige "Sin asignar" para remover la asignación.'
            }
          >
            <MenuItem value={UNASSIGNED_VALUE}>
              <Typography variant="body2" color="text.secondary">
                {UNASSIGNED_RECRUITER_LABEL}
              </Typography>
            </MenuItem>

            {isAssignedMissing && assigned && (
              <MenuItem value={assigned.id}>
                <ListItemText
                  primary={recruiterFullName(assigned)}
                  secondary="Asignado actualmente · inactivo"
                />
              </MenuItem>
            )}

            {recruiters.map((recruiter) => (
              <MenuItem key={recruiter.id} value={recruiter.id}>
                <ListItemText
                  primary={`${recruiter.firstName} ${recruiter.lastName}`}
                  secondary={recruiter.email}
                />
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{ px: 4, pb: 3, pt: 2.5, gap: 1, mt: 1, borderTop: '1px solid', borderColor: 'divider' }}
      >
        <Button onClick={onClose} disabled={isPending} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={isPending || isLoading || !hasChanged}
        >
          {isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
