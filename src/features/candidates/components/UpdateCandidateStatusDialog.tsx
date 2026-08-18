import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, MenuItem, Stack, TextField } from '@mui/material';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import {
  CANDIDATE_STATUS_LABEL,
  type CandidateListItem,
  type CandidateStatus,
} from '../types/candidate.types';
import { DialogHeader, dialogPaperSx } from '@/shared/components/DialogHeader';

interface UpdateCandidateStatusDialogProps {
  open: boolean;
  /** Basta con la forma del listado: el detalle la hereda vía CandidateDetail. */
  candidate: CandidateListItem | null;
  /** Ya filtrados por rol — este diálogo no decide permisos, solo los muestra. */
  availableStatuses: CandidateStatus[];
  onClose: () => void;
}

/**
 * Igual que AssignRecruiterDialog: `open` controla el montaje, no solo la
 * visibilidad, para que cada apertura arranque con el estado actual del
 * candidato y no con el de la vez anterior.
 */
export function UpdateCandidateStatusDialog({
  open,
  candidate,
  availableStatuses,
  onClose,
}: UpdateCandidateStatusDialogProps) {
  if (!open || !candidate) return null;
  return (
    <UpdateCandidateStatusDialogContent
      key={candidate.id}
      candidate={candidate}
      availableStatuses={availableStatuses}
      onClose={onClose}
    />
  );
}

function UpdateCandidateStatusDialogContent({
  candidate,
  availableStatuses,
  onClose,
}: {
  candidate: CandidateListItem;
  availableStatuses: CandidateStatus[];
  onClose: () => void;
}) {
  const { updateStatus } = useCandidateMutations();
  const [selectedStatus, setSelectedStatus] = useState<CandidateStatus>(candidate.status);

  const isPending = updateStatus.isPending;
  const hasChanged = selectedStatus !== candidate.status;

  /**
   * El estado actual puede no estar en `availableStatuses` (ej. un
   * RECRUITER abre el diálogo de un candidato que SYSTEM ya archivó).
   * Se añade igual, para que el diálogo siempre refleje el estado real
   * en vez de forzar un <Select> sin opción coincidente.
   */
  const isCurrentStatusRestricted = !availableStatuses.includes(candidate.status);

  async function onSubmit() {
    try {
      await updateStatus.mutateAsync({ id: candidate.id, status: selectedStatus });
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
        icon={<SwapHorizOutlinedIcon fontSize="small" />}
        title="Cambiar estado"
        description={`${candidate.folio} — ${candidate.fullName}`}
        onClose={isPending ? undefined : onClose}
      />

      <DialogContent sx={{ px: 4, pt: 1, pb: 1 }}>
        <Stack spacing={2.5}>
          <TextField
            select
            label="Estado"
            fullWidth
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as CandidateStatus)}
            disabled={isPending}
          >
            {isCurrentStatusRestricted && (
              <MenuItem value={candidate.status}>
                {CANDIDATE_STATUS_LABEL[candidate.status]} (actual)
              </MenuItem>
            )}
            {availableStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {CANDIDATE_STATUS_LABEL[status]}
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
        <Button variant="contained" onClick={onSubmit} disabled={isPending || !hasChanged}>
          {isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
