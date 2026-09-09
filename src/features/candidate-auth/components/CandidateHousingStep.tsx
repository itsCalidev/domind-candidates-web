import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { candidatesService } from '@/features/candidates/services/candidateService';
import type { CandidateHousing } from '@/features/candidates/types/candidate.types';
import { useToast } from '@/shared/context/ToastContext';
import { candidateHousingSchema, type CandidateHousingFormValues } from '../types/candidateHousing.schema';

/**
 * `valueAsNumber: true` de RHF convierte un input vacío en `NaN`, que
 * `z.number()` rechaza — en vez de sumarle `z.preprocess()` al schema
 * (ver candidateHousing.schema.ts, rompe la inferencia de tipos de
 * `zodResolver`), se resuelve aquí: string vacío → `undefined`,
 * cualquier otra cosa → `Number(...)`.
 */
function numberFieldOptions() {
  return { setValueAs: (value: string) => (value === '' ? undefined : Number(value)) };
}

interface CandidateHousingStepProps {
  candidateId: string;
  /** Datos ya capturados antes (ej. el candidato cerró la pestaña a medio formulario) — `null` si es la primera vez. */
  initialValues: CandidateHousing | null;
  /** Avisa al wizard que este paso se guardó — desbloquea el siguiente. */
  onSaved: () => void;
}

/**
 * Mismas 4 etiquetas que ya usa HousingTab.tsx (panel administrativo)
 * para hacer match por palabra clave contra `publicServices` — se
 * reutilizan los strings (no el componente) para que lo que mande el
 * candidato siga coincidiendo con esa lógica de lectura ya existente.
 */
const PUBLIC_SERVICE_OPTIONS = ['Agua', 'Luz', 'Internet', 'Drenaje'];

function toFormValues(housing: CandidateHousing | null): CandidateHousingFormValues {
  return {
    propertyOwner: housing?.propertyOwner ?? '',
    timeLivingThere: housing?.timeLivingThere ?? '',
    previousAddress: housing?.previousAddress ?? '',
    hasInfonavitDebt: housing?.hasInfonavitDebt ?? false,
    infonavitAmount: housing?.infonavitAmount ?? undefined,
    infonavitCreditNumber: housing?.infonavitCreditNumber ?? '',
    housingConditions: housing?.housingConditions ?? '',
    housingType: housing?.housingType ?? '',
    roomsCount: housing?.roomsCount ?? undefined,
    livingRoomCount: housing?.livingRoomCount ?? undefined,
    diningRoomCount: housing?.diningRoomCount ?? undefined,
    kitchenCount: housing?.kitchenCount ?? undefined,
    bathroomsCount: housing?.bathroomsCount ?? undefined,
    patioCount: housing?.patioCount ?? undefined,
    publicServices: housing?.publicServices ?? [],
  };
}

/**
 * Paso "Vivienda" del formulario de candidato — componente nuevo y
 * exclusivo de este flujo, NO reutiliza HousingTab.tsx del panel
 * administrativo (que además es de solo lectura, sin ningún formulario).
 * Guarda con PATCH /candidates/:id/housing (ruta híbrida, ver
 * candidateService.ts) y notifica al wizard con `onSaved` para
 * desbloquear el siguiente paso.
 */
export function CandidateHousingStep({ candidateId, initialValues, onSaved }: CandidateHousingStepProps) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CandidateHousingFormValues>({
    resolver: zodResolver(candidateHousingSchema),
    defaultValues: toFormValues(initialValues),
  });

  async function onSubmit(values: CandidateHousingFormValues) {
    setIsSaving(true);
    try {
      await candidatesService.updateHousing(candidateId, values);
      onSaved();
    } catch {
      // Regla estricta del flujo de candidato: nunca mostrar el error
      // crudo del servidor, solo un mensaje genérico.
      showToast('No se pudo guardar tu información. Intenta de nuevo.', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Vivienda
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="¿Quién es el propietario?"
              fullWidth
              {...register('propertyOwner')}
              error={!!errors.propertyOwner}
              helperText={errors.propertyOwner?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Tiempo viviendo ahí"
              fullWidth
              {...register('timeLivingThere')}
              error={!!errors.timeLivingThere}
              helperText={errors.timeLivingThere?.message}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Domicilio anterior"
              fullWidth
              {...register('previousAddress')}
              error={!!errors.previousAddress}
              helperText={errors.previousAddress?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Tipo de vivienda"
              fullWidth
              {...register('housingType')}
              error={!!errors.housingType}
              helperText={errors.housingType?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Condiciones de la vivienda"
              fullWidth
              multiline
              minRows={2}
              {...register('housingConditions')}
              error={!!errors.housingConditions}
              helperText={errors.housingConditions?.message}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              label="Habitaciones"
              type="number"
              fullWidth
              {...register('roomsCount', numberFieldOptions())}
              error={!!errors.roomsCount}
              helperText={errors.roomsCount?.message}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              label="Baños"
              type="number"
              fullWidth
              {...register('bathroomsCount', numberFieldOptions())}
              error={!!errors.bathroomsCount}
              helperText={errors.bathroomsCount?.message}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              label="Salas"
              type="number"
              fullWidth
              {...register('livingRoomCount', numberFieldOptions())}
              error={!!errors.livingRoomCount}
              helperText={errors.livingRoomCount?.message}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              label="Comedores"
              type="number"
              fullWidth
              {...register('diningRoomCount', numberFieldOptions())}
              error={!!errors.diningRoomCount}
              helperText={errors.diningRoomCount?.message}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              label="Cocinas"
              type="number"
              fullWidth
              {...register('kitchenCount', numberFieldOptions())}
              error={!!errors.kitchenCount}
              helperText={errors.kitchenCount?.message}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              label="Patios"
              type="number"
              fullWidth
              {...register('patioCount', numberFieldOptions())}
              error={!!errors.patioCount}
              helperText={errors.patioCount?.message}
            />
          </Grid>

          <Grid size={12}>
            <Controller
              name="hasInfonavitDebt"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label="¿Tiene deuda de Infonavit o hipotecaria?"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Monto de la deuda"
              type="number"
              fullWidth
              {...register('infonavitAmount', numberFieldOptions())}
              error={!!errors.infonavitAmount}
              helperText={errors.infonavitAmount?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Número de crédito"
              fullWidth
              {...register('infonavitCreditNumber')}
              error={!!errors.infonavitCreditNumber}
              helperText={errors.infonavitCreditNumber?.message}
            />
          </Grid>

          <Grid size={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Servicios públicos con los que cuenta
            </Typography>
            <Controller
              name="publicServices"
              control={control}
              render={({ field }) => (
                <FormGroup row>
                  {PUBLIC_SERVICE_OPTIONS.map((service) => (
                    <FormControlLabel
                      key={service}
                      control={
                        <Checkbox
                          checked={field.value.includes(service)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...field.value, service]
                              : field.value.filter((s) => s !== service);
                            field.onChange(next);
                          }}
                        />
                      }
                      label={service}
                    />
                  ))}
                </FormGroup>
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? 'Guardando…' : 'Guardar y continuar'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
