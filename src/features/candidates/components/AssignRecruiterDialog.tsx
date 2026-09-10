import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  ListItemText,
  MenuItem,
  Radio,
  RadioGroup,
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

type FillMode = 'manual' | 'magicLink';

function AssignRecruiterDialogContent({
  candidate,
  onClose,
}: {
  candidate: CandidateListItem;
  onClose: () => void;
}) {
  const { recruiters, isLoading, isError, error } = useRecruiters();
  const { assignRecruiter, sendMagicLink } = useCandidateMutations();
  const [selectedId, setSelectedId] = useState(
    candidate.assignedRecruiter?.id ?? UNASSIGNED_VALUE,
  );
  const [fillMode, setFillMode] = useState<FillMode>('manual');

  const isPending = assignRecruiter.isPending || sendMagicLink.isPending;
  const currentId = candidate.assignedRecruiter?.id ?? UNASSIGNED_VALUE;
  const hasChanged = selectedId !== currentId;
  const hasRecruiterSelected = selectedId !== UNASSIGNED_VALUE;
  const wantsMagicLink = hasRecruiterSelected && fillMode === 'magicLink';
  // Regla UI 2: habilitado si se reasignó a alguien distinto, O si el
  // reclutador es el mismo pero se pidió (re)enviar el enlace mágico —
  // `hasChanged` ya cubre por sí solo el caso "reasignó Y quiere enlace".
  const canSubmit = hasChanged || wantsMagicLink;

  /**
   * El reclutador actual puede no estar en la lista: useRecruiters solo
   * trae los activos, así que si a este candidato lo asignaron antes de
   * que su reclutador se desactivara, su id no tendría <MenuItem> y el
   * Select se vería vacío. Se añade explícitamente para que el diálogo
   * siempre muestre el estado real.
   */
  const assigned = candidate.assignedRecruiter;
  const isAssignedMissing = !!assigned && !recruiters.some((r) => r.id === assigned.id);

  function handleSelectChange(value: string) {
    setSelectedId(value);
    // Sin reclutador no hay a quién mandarle el enlace — se resetea para
    // que no quede "Autollenado" elegido en silencio si luego se vuelve
    // a asignar a alguien.
    if (value === UNASSIGNED_VALUE) setFillMode('manual');
  }

  async function onSubmit() {
    try {
      if (hasChanged) {
        await assignRecruiter.mutateAsync({
          id: candidate.id,
          recruiterId: selectedId === UNASSIGNED_VALUE ? null : selectedId,
        });
      }
      if (wantsMagicLink) {
        await sendMagicLink.mutateAsync(candidate.id);
      }
      onClose();
    } catch {
      // Los toasts de error ya los emiten las mutaciones; aquí solo se
      // evita cerrar el diálogo para que se pueda reintentar.
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
            onChange={(e) => handleSelectChange(e.target.value)}
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

          {/* Regla UI 1: sin reclutador no hay a quién mandarle el enlace, así que se oculta por completo en vez de solo deshabilitarse. */}
          {hasRecruiterSelected && (
            <FormControl disabled={isPending}>
              <FormLabel id="fill-mode-label">Modalidad de llenado</FormLabel>
              <RadioGroup
                aria-labelledby="fill-mode-label"
                value={fillMode}
                onChange={(e) => setFillMode(e.target.value as FillMode)}
              >
                <FormControlLabel value="manual" control={<Radio />} label="Llenado Manual (Reclutador)" />
                <FormControlLabel
                  value="magicLink"
                  control={<Radio />}
                  label="Autollenado (Enviar Enlace Mágico al Candidato)"
                />
              </RadioGroup>
            </FormControl>
          )}
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
          disabled={isPending || isLoading || !canSubmit}
        >
          {isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
