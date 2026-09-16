import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import type { CandidateCaptureStatus, CandidateGeneralInfo, PersonalInfoPayload } from '../types/candidate.types';
import {
  HIGHEST_EDUCATION_OPTIONS,
  STUDIES_PROOF_TYPE_OPTIONS,
  maxBirthDateForAdult,
  personalInfoSchema,
  todayISODate,
  type PersonalInfoFormValues,
} from '../types/personalInfo.schema';
import { maritalStatusLabels } from '../utils/maritalStatus';

interface GeneralInfoTabProps {
  candidateId: string;
  info: CandidateGeneralInfo;
  captureStatus: CandidateCaptureStatus;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Grid>
  );
}

/**
 * Placeholder que candidateService.ts pone en `generalInfo` cuando el
 * backend no trae el dato (ej. `data.personal?.address || 'No registrado'`)
 * — es texto de UI, no un valor real, así que no debe filtrarse al
 * formulario de edición como si el candidato lo hubiera capturado.
 */
const NOT_REGISTERED = 'No registrado';

function buildFormDefaults(info: CandidateGeneralInfo): PersonalInfoFormValues {
  const clean = (value: string) => (value === NOT_REGISTERED ? '' : value);
  return {
    firstName: info.firstName,
    lastName: info.lastName,
    address: clean(info.address),
    neighborhood: clean(info.neighborhood),
    postalCode: clean(info.postalCode),
    phone: clean(info.phone),
    email: clean(info.email),
    birthDate: clean(info.birthDate),
    birthPlace: clean(info.birthPlace),
    // Si el valor guardado no es una clave válida de maritalStatusLabels
    // (nunca se capturó, o es el placeholder de arriba), el Select debe
    // arrancar en "Sin especificar" en vez de con un value huérfano.
    maritalStatus: maritalStatusLabels[info.civilStatus]
      ? (info.civilStatus as PersonalInfoFormValues['maritalStatus'])
      : '',
    spouseBirthDate: clean(info.spouseBirthDate),
    // highestEducation/studiesProofType son texto libre (no un enum
    // cerrado), así que a diferencia de maritalStatus no hace falta
    // validar contra la lista de opciones — cualquier valor guardado
    // previamente es válido de mostrar, incluso si ya no está en
    // HIGHEST_EDUCATION_OPTIONS/STUDIES_PROOF_TYPE_OPTIONS.
    highestEducation: clean(info.highestEducation),
    studiesProofType: clean(info.studiesProofType),
    studiesProofDate: clean(info.studiesProofDate),
  };
}

/**
 * Solo incluye los campos que react-hook-form marcó como `dirty` —
 * pedido explícito del usuario: el PATCH manda únicamente lo que el
 * reclutador realmente tocó, no el objeto completo en cada guardado.
 */
function buildChangedPayload(
  values: PersonalInfoFormValues,
  dirtyFields: Partial<Record<keyof PersonalInfoFormValues, boolean>>,
): Partial<PersonalInfoPayload> {
  const payload: Partial<PersonalInfoPayload> = {};
  if (dirtyFields.firstName) payload.firstName = values.firstName;
  if (dirtyFields.lastName) payload.lastName = values.lastName;
  if (dirtyFields.email) payload.email = values.email;
  if (dirtyFields.phone) payload.phone = values.phone;
  if (dirtyFields.address) payload.address = values.address;
  if (dirtyFields.neighborhood) payload.neighborhood = values.neighborhood;
  if (dirtyFields.postalCode) payload.postalCode = values.postalCode;
  if (dirtyFields.birthPlace) payload.birthPlace = values.birthPlace;
  if (dirtyFields.birthDate) payload.birthDate = values.birthDate;
  if (dirtyFields.maritalStatus) payload.maritalStatus = values.maritalStatus;
  if (dirtyFields.spouseBirthDate) payload.spouseBirthDate = values.spouseBirthDate;
  if (dirtyFields.highestEducation) payload.highestEducation = values.highestEducation;
  if (dirtyFields.studiesProofType) payload.studiesProofType = values.studiesProofType;
  if (dirtyFields.studiesProofDate) payload.studiesProofDate = values.studiesProofDate;
  return payload;
}

/**
 * `highestEducation`/`studiesProofType` son texto libre en el backend:
 * un candidato viejo puede tener guardado un valor que ya no está en la
 * lista de opciones sugeridas. Sin esto, el Select de MUI mostraría un
 * "out-of-range value" y ocultaría el dato real en vez de solo permitir
 * elegir uno de los sugeridos.
 */
function withCurrentValueOption(options: readonly string[], currentValue: string): string[] {
  if (!currentValue || currentValue === NOT_REGISTERED || options.includes(currentValue)) {
    return [...options];
  }
  return [currentValue, ...options];
}

/**
 * Única pestaña de detalle con toggle lectura/edición: mientras el
 * candidato sigue en captura manual sin terminar (`captureStatus ===
 * 'DRAFT'`), el reclutador puede corregir sus datos personales a mano.
 * Una vez `COMPLETED`, esta vista vuelve a ser de solo lectura — ni
 * siquiera se renderiza el botón "Editar" (regla de negocio dada
 * explícitamente por el usuario, no una decisión de UI).
 *
 * Modo edición con react-hook-form + Zod (personalInfoSchema), a
 * diferencia de SocialNetworkTab/HousingTab (useState plano sin schema):
 * este formulario sí necesita validar formatos estrictos del backend
 * (longitudes, regex de teléfono/CP, edad mínima), así que amerita un
 * resolver en vez de checks manuales dispersos.
 */
export function GeneralInfoTab({ candidateId, info, captureStatus }: GeneralInfoTabProps) {
  const { updatePersonalInfo } = useCandidateMutations();
  const [isEditing, setIsEditing] = useState(false);
  const isSaving = updatePersonalInfo.isPending;
  const canEdit = captureStatus === 'DRAFT';

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: buildFormDefaults(info),
  });

  function handleStartEditing() {
    reset(buildFormDefaults(info));
    setIsEditing(true);
  }

  async function onSubmit(values: PersonalInfoFormValues) {
    try {
      const payload = buildChangedPayload(values, dirtyFields);
      await updatePersonalInfo.mutateAsync({ id: candidateId, payload });
      setIsEditing(false);
    } catch {
      // El toast de error (extractApiErrorMessage, sin detalles técnicos)
      // ya lo emite useCandidateMutations; el formulario se queda abierto
      // con lo que el usuario escribió, para reintentar.
    }
  }

  if (isEditing) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Grid component="form" container spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Nombre(s)"
              fullWidth
              disabled={isSaving}
              {...register('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Apellido(s)"
              fullWidth
              disabled={isSaving}
              {...register('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="maritalStatus"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Estado civil"
                  fullWidth
                  disabled={isSaving}
                  error={!!errors.maritalStatus}
                  helperText={errors.maritalStatus?.message}
                >
                  <MenuItem value="">
                    <em>Sin especificar</em>
                  </MenuItem>
                  {Object.entries(maritalStatusLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Domicilio"
              fullWidth
              disabled={isSaving}
              {...register('address')}
              error={!!errors.address}
              helperText={errors.address?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Colonia"
              fullWidth
              disabled={isSaving}
              {...register('neighborhood')}
              error={!!errors.neighborhood}
              helperText={errors.neighborhood?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Código postal"
              fullWidth
              disabled={isSaving}
              {...register('postalCode')}
              error={!!errors.postalCode}
              helperText={errors.postalCode?.message}
              slotProps={{ htmlInput: { maxLength: 5, inputMode: 'numeric' } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Teléfono"
              fullWidth
              disabled={isSaving}
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              slotProps={{ htmlInput: { maxLength: 15 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Correo electrónico"
              type="email"
              fullWidth
              disabled={isSaving}
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Fecha de nacimiento"
              type="date"
              fullWidth
              disabled={isSaving}
              {...register('birthDate')}
              error={!!errors.birthDate}
              helperText={errors.birthDate?.message}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { max: maxBirthDateForAdult() },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Lugar de nacimiento"
              fullWidth
              disabled={isSaving}
              {...register('birthPlace')}
              error={!!errors.birthPlace}
              helperText={errors.birthPlace?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Fecha Nac. Cónyuge"
              type="date"
              fullWidth
              disabled={isSaving}
              {...register('spouseBirthDate')}
              error={!!errors.spouseBirthDate}
              helperText={errors.spouseBirthDate?.message}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { max: todayISODate() },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="highestEducation"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Último grado de estudios"
                  fullWidth
                  disabled={isSaving}
                  error={!!errors.highestEducation}
                  helperText={errors.highestEducation?.message}
                >
                  <MenuItem value="">
                    <em>Sin especificar</em>
                  </MenuItem>
                  {withCurrentValueOption(HIGHEST_EDUCATION_OPTIONS, info.highestEducation).map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="studiesProofType"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Tipo de comprobante"
                  fullWidth
                  disabled={isSaving}
                  error={!!errors.studiesProofType}
                  helperText={errors.studiesProofType?.message}
                >
                  <MenuItem value="">
                    <em>Sin especificar</em>
                  </MenuItem>
                  {withCurrentValueOption(STUDIES_PROOF_TYPE_OPTIONS, info.studiesProofType).map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Fecha del comprobante"
              type="date"
              fullWidth
              disabled={isSaving}
              {...register('studiesProofDate')}
              error={!!errors.studiesProofDate}
              helperText={errors.studiesProofDate?.message}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { max: todayISODate() },
              }}
            />
          </Grid>

          <Grid size={12}>
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained" size="small" disabled={isSaving || !isDirty}>
                {isSaving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                size="small"
                disabled={isSaving}
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      {canEdit && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<EditOutlinedIcon fontSize="small" />}
            onClick={handleStartEditing}
          >
            Editar
          </Button>
        </Stack>
      )}
      <Grid container spacing={3}>
        <Field label="Nombre completo" value={info.fullName} />
        <Field label="Puesto solicitado" value={info.positionApplied} />
        <Field
          label="Estado civil"
          value={maritalStatusLabels[info.civilStatus] ?? info.civilStatus}
        />
        <Field label="Domicilio" value={info.address} />
        <Field label="Colonia" value={info.neighborhood} />
        <Field label="Código postal" value={info.postalCode} />
        <Field label="Teléfono" value={info.phone} />
        <Field label="Correo electrónico" value={info.email} />
        <Field label="Fecha de nacimiento" value={info.birthDate} />
        <Field label="Lugar de nacimiento" value={info.birthPlace} />
        <Field label="Fecha Nac. Cónyuge" value={info.spouseBirthDate} />
        <Field label="Último grado de estudios" value={info.highestEducation} />
        <Field label="Tipo de comprobante" value={info.studiesProofType} />
        <Field label="Fecha del comprobante" value={info.studiesProofDate} />
      </Grid>
    </Paper>
  );
}
