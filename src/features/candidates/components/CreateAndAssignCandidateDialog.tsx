import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
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
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import { useRecruiters } from '../hooks/useRecruiters';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import {
  createAndAssignCandidateSchema,
  type CreateAndAssignCandidateFormValues,
} from '../types/createAndAssignCandidate.schema';
import { DialogHeader, dialogPaperSx } from '@/shared/components/DialogHeader';
import { extractApiErrorMessage } from '@/shared/utils/apiError';

interface CreateAndAssignCandidateDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Textos exactos pedidos por el usuario — cambian según la modalidad elegida. */
const FILL_MODE_HELP: Record<'manual' | 'magicLink', string> = {
  manual:
    'Se enviará un correo únicamente al reclutador con el enlace para que él mismo llene la información del candidato.',
  magicLink:
    'Se enviará un correo al candidato con un enlace válido por 24 hrs. El reclutador recibirá un correo notificándole que debe brindar soporte.',
};

/**
 * Reemplaza al flujo que se intentó meter en AssignRecruiterDialog (esa
 * idea se abortó: ese diálogo es solo para reasignar un candidato ya
 * existente). Este es el punto real donde nace la decisión de modalidad
 * de llenado — al dar de alta al candidato, no después.
 *
 * `open` controla el montaje igual que AssignRecruiterDialog, pero sin
 * `key`: aquí no hay una entidad existente que cambie entre aperturas, así
 * que desmontar/remontar por `open` ya garantiza un formulario limpio.
 */
export function CreateAndAssignCandidateDialog({ open, onClose }: CreateAndAssignCandidateDialogProps) {
  if (!open) return null;
  return <CreateAndAssignCandidateDialogContent onClose={onClose} />;
}

function CreateAndAssignCandidateDialogContent({ onClose }: { onClose: () => void }) {
  const { recruiters, isLoading: isLoadingRecruiters, isError, error } = useRecruiters();
  const { createAndAssignCandidate } = useCandidateMutations();
  const isPending = createAndAssignCandidate.isPending;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateAndAssignCandidateFormValues>({
    resolver: zodResolver(createAndAssignCandidateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      recruiterId: '',
      fillMode: 'manual',
    },
  });

  const fillMode = watch('fillMode');

  async function onSubmit(values: CreateAndAssignCandidateFormValues) {
    try {
      await createAndAssignCandidate.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        recruiterId: values.recruiterId,
        fillMode: values.fillMode === 'magicLink' ? 'MAGIC_LINK' : 'MANUAL',
      });
      onClose();
    } catch {
      // El toast de error ya lo emite useCandidateMutations; aquí solo se
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
        icon={<PersonAddAltOutlinedIcon fontSize="small" />}
        title="Agregar candidato"
        description="Da de alta al candidato y decide quién captura su información."
        onClose={isPending ? undefined : onClose}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ px: 4, pt: 1, pb: 1 }}>
          <Stack spacing={2.5}>
            {isError && (
              <Alert severity="error">
                {extractApiErrorMessage(error, 'No se pudo cargar la lista de reclutadores.')}
              </Alert>
            )}

            <TextField
              label="Nombre(s) del candidato(a)"
              fullWidth
              disabled={isPending}
              {...register('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
            <TextField
              label="Apellido(s) del candidato(a)"
              fullWidth
              disabled={isPending}
              {...register('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
            <TextField
              label="Correo electrónico del candidato(a)"
              type="email"
              fullWidth
              disabled={isPending}
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <Controller
              name="recruiterId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Reclutador"
                  fullWidth
                  disabled={isLoadingRecruiters || isPending}
                  error={!!errors.recruiterId}
                  helperText={
                    errors.recruiterId?.message ?? (isLoadingRecruiters ? 'Cargando reclutadores…' : ' ')
                  }
                >
                  {recruiters.map((recruiter) => (
                    <MenuItem key={recruiter.id} value={recruiter.id}>
                      <ListItemText
                        primary={`${recruiter.firstName} ${recruiter.lastName}`}
                        secondary={recruiter.email}
                      />
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <FormControl disabled={isPending}>
              <FormLabel id="create-fill-mode-label">Modalidad de llenado</FormLabel>
              <Controller
                name="fillMode"
                control={control}
                render={({ field }) => (
                  <RadioGroup aria-labelledby="create-fill-mode-label" value={field.value} onChange={field.onChange}>
                    <FormControlLabel value="manual" control={<Radio />} label="Llenado Manual (Reclutador)" />
                    <FormControlLabel
                      value="magicLink"
                      control={<Radio />}
                      label="Autollenado (Candidato)"
                    />
                  </RadioGroup>
                )}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {FILL_MODE_HELP[fillMode]}
              </Typography>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{ px: 4, pb: 3, pt: 2.5, gap: 1, mt: 1, borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Button onClick={onClose} disabled={isPending} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending || isLoadingRecruiters}>
            {isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
