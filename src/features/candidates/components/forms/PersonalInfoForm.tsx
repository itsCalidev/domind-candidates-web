import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useCandidateMutations } from '../../hooks/useCandidateMutations';
import type {
  CandidateCaptureMode,
  CandidateCaptureStatus,
  CandidateGeneralInfo,
  PersonalInfoPayload,
} from '../../types/candidate.types';
import {
  HIGHEST_EDUCATION_OPTIONS,
  MARITAL_STATUSES_WITH_SPOUSE,
  STUDIES_PROOF_TYPE_OPTIONS,
  maxBirthDateForAdult,
  personalInfoSchema,
  todayISODate,
  type PersonalInfoFormValues,
} from '../../types/personalInfo.schema';
import { maritalStatusLabels } from '../../utils/maritalStatus';

/**
 * Único formulario de "Información General" — lo usan tanto GeneralInfoTab
 * (panel admin, `mode="admin"`) como el paso 1 del Wizard de Autollenado
 * (`mode="candidate"`), en vez de mantener dos copias del `useForm`/schema
 * como quedó con Housing (HousingTab + CandidateHousingStep, detectado
 * como deuda técnica en la auditoría previa). Un solo lugar donde arreglar
 * una regla de validación o agregar un campo.
 */
type PersonalInfoFormProps =
  | {
      mode: 'admin';
      candidateId: string;
      initialValues: CandidateGeneralInfo;
      captureMode: CandidateCaptureMode;
      captureStatus: CandidateCaptureStatus;
    }
  | {
      mode: 'candidate';
      candidateId: string;
      /** `null` mientras el Wizard todavía no logra cargar el detalle previo del candidato. */
      initialValues: CandidateGeneralInfo | null;
      /** Avisa al Wizard que este paso se guardó — desbloquea el siguiente. */
      onSaved: () => void;
    };

function ReadOnlyField({ label, value }: { label: string; value: string }) {
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

function buildFormDefaults(info: CandidateGeneralInfo | null): PersonalInfoFormValues {
  const clean = (value: string | undefined) => (!value || value === NOT_REGISTERED ? '' : value);
  return {
    firstName: info?.firstName ?? '',
    lastName: info?.lastName ?? '',
    companyName: clean(info?.companyName),
    positionName: clean(info?.positionApplied),
    address: clean(info?.address),
    neighborhood: clean(info?.neighborhood),
    postalCode: clean(info?.postalCode),
    phone: clean(info?.phone),
    email: clean(info?.email),
    birthDate: clean(info?.birthDate),
    birthPlace: clean(info?.birthPlace),
    // Si el valor guardado no es una clave válida de maritalStatusLabels
    // (nunca se capturó, o es el placeholder de arriba), el Select debe
    // arrancar en "Sin especificar" en vez de con un value huérfano.
    maritalStatus:
      info && maritalStatusLabels[info.civilStatus]
        ? (info.civilStatus as PersonalInfoFormValues['maritalStatus'])
        : '',
    spouseBirthDate: clean(info?.spouseBirthDate),
    // highestEducation/studiesProofType son texto libre (no un enum
    // cerrado), así que a diferencia de maritalStatus no hace falta
    // validar contra la lista de opciones — cualquier valor guardado
    // previamente es válido de mostrar, incluso si ya no está en
    // HIGHEST_EDUCATION_OPTIONS/STUDIES_PROOF_TYPE_OPTIONS.
    highestEducation: clean(info?.highestEducation),
    studiesProofType: clean(info?.studiesProofType),
    studiesProofDate: clean(info?.studiesProofDate),
  };
}

/**
 * Solo incluye los campos que react-hook-form marcó como `dirty` —
 * pedido explícito del usuario: el PATCH manda únicamente lo que se
 * realmente tocó, no el objeto completo en cada guardado. Aplica igual
 * en modo candidato: `/personal` es un PATCH parcial sin importar quién
 * lo dispare.
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
  if (dirtyFields.companyName) payload.companyName = values.companyName;
  if (dirtyFields.positionName) payload.positionName = values.positionName;
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

export function PersonalInfoForm(props: PersonalInfoFormProps) {
  const { candidateId, initialValues } = props;
  const { updatePersonalInfo } = useCandidateMutations();
  const [isEditing, setIsEditing] = useState(false);
  const isSaving = updatePersonalInfo.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: buildFormDefaults(initialValues),
  });

  const maritalStatusValue = watch('maritalStatus');
  const spouseApplies = (MARITAL_STATUSES_WITH_SPOUSE as readonly string[]).includes(maritalStatusValue ?? '');
  const currentHighestEducation = initialValues?.highestEducation ?? '';
  const currentStudiesProofType = initialValues?.studiesProofType ?? '';

  function handleStartEditing() {
    reset(buildFormDefaults(initialValues));
    setIsEditing(true);
  }

  async function onSubmit(values: PersonalInfoFormValues) {
    try {
      const payload = buildChangedPayload(values, dirtyFields);
      await updatePersonalInfo.mutateAsync({ id: candidateId, payload });
      if (props.mode === 'admin') {
        setIsEditing(false);
      } else {
        props.onSaved();
      }
    } catch {
      // El toast de error (extractApiErrorMessage, sin detalles técnicos)
      // ya lo emite useCandidateMutations; el formulario se queda abierto
      // con lo que el usuario escribió, para reintentar.
    }
  }

  const fields = (
    <>
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
        <TextField
          label="Empresa"
          fullWidth
          disabled={isSaving}
          {...register('companyName')}
          error={!!errors.companyName}
          helperText={errors.companyName?.message}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          label="Puesto solicitado"
          fullWidth
          disabled={isSaving}
          {...register('positionName')}
          error={!!errors.positionName}
          helperText={errors.positionName?.message}
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
              onChange={(e) => {
                field.onChange(e);
                if (!(MARITAL_STATUSES_WITH_SPOUSE as readonly string[]).includes(e.target.value)) {
                  setValue('spouseBirthDate', '', { shouldDirty: true });
                }
              }}
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
      {spouseApplies && (
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
              htmlInput: { max: maxBirthDateForAdult() },
            }}
          />
        </Grid>
      )}
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
              {withCurrentValueOption(HIGHEST_EDUCATION_OPTIONS, currentHighestEducation).map((option) => (
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
              {withCurrentValueOption(STUDIES_PROOF_TYPE_OPTIONS, currentStudiesProofType).map((option) => (
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
    </>
  );

  if (props.mode === 'candidate') {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Información General
        </Typography>
        <Grid component="form" container spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
          {fields}
          <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar y continuar'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    );
  }

  const canEdit = props.captureMode === 'MANUAL' && props.captureStatus === 'DRAFT';

  if (isEditing) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Grid component="form" container spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
          {fields}
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

  const info = props.initialValues;

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
        <ReadOnlyField label="Nombre completo" value={info.fullName} />
        <ReadOnlyField label="Empresa" value={info.companyName} />
        <ReadOnlyField label="Puesto solicitado" value={info.positionApplied} />
        <ReadOnlyField label="Estado civil" value={maritalStatusLabels[info.civilStatus] ?? info.civilStatus} />
        <ReadOnlyField label="Domicilio" value={info.address} />
        <ReadOnlyField label="Colonia" value={info.neighborhood} />
        <ReadOnlyField label="Código postal" value={info.postalCode} />
        <ReadOnlyField label="Teléfono" value={info.phone} />
        <ReadOnlyField label="Correo electrónico" value={info.email} />
        <ReadOnlyField label="Fecha de nacimiento" value={info.birthDate} />
        <ReadOnlyField label="Lugar de nacimiento" value={info.birthPlace} />
        <ReadOnlyField label="Fecha Nac. Cónyuge" value={info.spouseBirthDate} />
        <ReadOnlyField label="Último grado de estudios" value={info.highestEducation} />
        <ReadOnlyField label="Tipo de comprobante" value={info.studiesProofType} />
        <ReadOnlyField label="Fecha del comprobante" value={info.studiesProofDate} />
      </Grid>
    </Paper>
  );
}
