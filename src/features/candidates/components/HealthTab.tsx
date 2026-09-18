import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import AccessibilityNewOutlinedIcon from '@mui/icons-material/AccessibilityNewOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import SmokingRoomsOutlinedIcon from '@mui/icons-material/SmokingRoomsOutlined';
import SmokeFreeOutlinedIcon from '@mui/icons-material/SmokeFreeOutlined';
import WineBarOutlinedIcon from '@mui/icons-material/WineBarOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import WeekendOutlinedIcon from '@mui/icons-material/WeekendOutlined';
import MonitorOutlinedIcon from '@mui/icons-material/MonitorOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import MonitorWeightOutlinedIcon from '@mui/icons-material/MonitorWeightOutlined';
import OpacityOutlinedIcon from '@mui/icons-material/OpacityOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import type { ReactElement, ReactNode } from 'react';
import { RiskGlass } from './RiskGlass';
import { BmiGauge } from './BmiGauge';
import { computeHealthRisk, isHealthRiskDataMissing } from '../utils/healthRisk';
import {
  classifyAlcoholFrequency,
  classifyCurrentHealth,
  classifyDietQuality,
  classifyPhysicalActivity,
  classifyPhysicalAspect,
  isEmptyMedicalText,
  splitMedicalEntries,
  type HabitSeverity,
} from '../utils/healthQualitative';
import { CleanStateBadge } from '@/shared/components/CleanStateBadge';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import type {
  CandidateCaptureMode,
  CandidateCaptureStatus,
  CandidateHealth,
  CandidateHealthPayload,
} from '../types/candidate.types';
import {
  ALCOHOL_TYPE_OPTIONS,
  CURRENT_HEALTH_OPTIONS,
  DIET_QUALITY_OPTIONS,
  HEALTHCARE_ACCESS_OPTIONS,
  OTHER_OPTION,
  PHYSICAL_ACTIVITY_OPTIONS,
  healthFormSchema,
  type HealthFormValues,
} from '../types/healthForm.schema';

interface HealthTabProps {
  candidateId: string;
  health: CandidateHealth;
  captureMode: CandidateCaptureMode;
  captureStatus: CandidateCaptureStatus;
}

function toFormNumber(value: number | null): string {
  return value === null ? '' : String(value);
}

function toTriState(value: boolean | null): 'yes' | 'no' | '' {
  return value === null ? '' : value ? 'yes' : 'no';
}

function pickOption<T extends string>(options: readonly T[], value: string | null): T | '' {
  return value && (options as readonly string[]).includes(value) ? (value as T) : '';
}

/**
 * `healthcareAccess`/`alcoholTypes` ya guardados pueden traer un valor
 * que no está en la lista de opciones sugeridas (capturado antes de que
 * existiera el checkbox "Otro", o escrito directo en el backend) — esos
 * valores se agrupan bajo "Otro" con su texto original preservado, en
 * vez de perderse o romper el checkbox.
 */
function splitKnownAndOther(
  values: string[],
  knownOptions: readonly string[],
): { known: string[]; other: string } {
  const known = values.filter((value) => knownOptions.includes(value));
  const otherValues = values.filter((value) => !knownOptions.includes(value));
  return {
    known: otherValues.length > 0 ? [...known, OTHER_OPTION] : known,
    other: otherValues.join(', '),
  };
}

/** Inverso de `splitKnownAndOther`: para el payload, "Otro" nunca se envía tal cual — se reemplaza por lo que el reclutador escribió, o se descarta si lo dejó vacío. */
function resolveOtherOption(values: string[], otherText: string): string[] {
  if (!values.includes(OTHER_OPTION)) return values;
  const resolved = values.filter((value) => value !== OTHER_OPTION);
  const trimmedOther = otherText.trim();
  return trimmedOther ? [...resolved, trimmedOther] : resolved;
}

function buildHealthFormDefaults(health: CandidateHealth): HealthFormValues {
  const healthcareAccess = splitKnownAndOther(health.healthcareAccess, HEALTHCARE_ACCESS_OPTIONS);
  const alcoholTypes = splitKnownAndOther(health.alcoholTypes, ALCOHOL_TYPE_OPTIONS);
  return {
    weight: toFormNumber(health.weight),
    height: toFormNumber(health.height),
    usesGlasses: toTriState(health.usesGlasses),
    physicalAspect: health.physicalAspect ?? '',
    currentHealth: pickOption(CURRENT_HEALTH_OPTIONS, health.currentHealth),
    chronicDiseasesFamily: toTriState(health.chronicDiseasesFamily),
    chronicDiseasesDetails: health.chronicDiseasesDetails ?? '',
    pastDiseasesFlag: isEmptyMedicalText(health.pastDiseases) ? '' : 'yes',
    pastDiseases: health.pastDiseases ?? '',
    surgeriesFlag: isEmptyMedicalText(health.surgeries) ? '' : 'yes',
    surgeries: health.surgeries ?? '',
    healthcareAccess: healthcareAccess.known,
    healthcareAccessOther: healthcareAccess.other,
    alcoholFrequency: health.alcoholFrequency ?? '',
    alcoholTypes: alcoholTypes.known,
    alcoholTypesOther: alcoholTypes.other,
    smokes: toTriState(health.smokes),
    cigarettesPerDay: toFormNumber(health.cigarettesPerDay),
    smokingExpensePerWeek: toFormNumber(health.smokingExpensePerWeek),
    usedDrugs: toTriState(health.usedDrugs),
    drugsDetails: health.drugsDetails ?? '',
    dietQuality: pickOption(DIET_QUALITY_OPTIONS, health.dietQuality),
    physicalActivity: pickOption(PHYSICAL_ACTIVITY_OPTIONS, health.physicalActivity),
    sedentaryHours: toFormNumber(health.sedentaryHours),
    screenTimeHours: toFormNumber(health.screenTimeHours),
  };
}

function toNumberOrUndefined(value: string | undefined): number | undefined {
  return value ? Number(value) : undefined;
}

/**
 * Solo incluye los campos que react-hook-form marcó como `dirty` — el
 * backend acepta un PATCH parcial (confirmado por el usuario), así que
 * se manda únicamente lo que el reclutador realmente tocó, mismo
 * criterio que `updatePersonalInfo`/GeneralInfoTab.
 */
function buildHealthPayload(
  values: HealthFormValues,
  // `unknown`, no `boolean`: react-hook-form marca los arreglos
  // (healthcareAccess/alcoholTypes) como `(boolean | undefined)[]`, no
  // como un solo booleano — aquí solo importa la verdad/falsedad general.
  dirtyFields: Partial<Record<keyof HealthFormValues, unknown>>,
): Partial<CandidateHealthPayload> {
  const payload: Partial<CandidateHealthPayload> = {};
  if (dirtyFields.weight) payload.weight = toNumberOrUndefined(values.weight);
  if (dirtyFields.height) payload.height = toNumberOrUndefined(values.height);
  if (dirtyFields.usesGlasses && values.usesGlasses !== '') payload.usesGlasses = values.usesGlasses === 'yes';
  if (dirtyFields.physicalAspect) payload.physicalAspect = values.physicalAspect;
  if (dirtyFields.currentHealth) payload.currentHealth = values.currentHealth;
  if (dirtyFields.chronicDiseasesFamily && values.chronicDiseasesFamily !== '') {
    payload.chronicDiseasesFamily = values.chronicDiseasesFamily === 'yes';
  }
  if (dirtyFields.chronicDiseasesDetails) payload.chronicDiseasesDetails = values.chronicDiseasesDetails;
  if (dirtyFields.pastDiseases) payload.pastDiseases = values.pastDiseases;
  if (dirtyFields.surgeries) payload.surgeries = values.surgeries;
  if (dirtyFields.healthcareAccess || dirtyFields.healthcareAccessOther) {
    payload.healthcareAccess = resolveOtherOption(values.healthcareAccess, values.healthcareAccessOther ?? '');
  }
  if (dirtyFields.alcoholFrequency) payload.alcoholFrequency = values.alcoholFrequency;
  if (dirtyFields.alcoholTypes || dirtyFields.alcoholTypesOther) {
    payload.alcoholTypes = resolveOtherOption(values.alcoholTypes, values.alcoholTypesOther ?? '');
  }
  if (dirtyFields.smokes && values.smokes !== '') payload.smokes = values.smokes === 'yes';
  if (dirtyFields.cigarettesPerDay) payload.cigarettesPerDay = toNumberOrUndefined(values.cigarettesPerDay);
  if (dirtyFields.smokingExpensePerWeek) {
    payload.smokingExpensePerWeek = toNumberOrUndefined(values.smokingExpensePerWeek);
  }
  if (dirtyFields.usedDrugs && values.usedDrugs !== '') payload.usedDrugs = values.usedDrugs === 'yes';
  if (dirtyFields.drugsDetails) payload.drugsDetails = values.drugsDetails;
  if (dirtyFields.dietQuality) payload.dietQuality = values.dietQuality;
  if (dirtyFields.physicalActivity) payload.physicalActivity = values.physicalActivity;
  if (dirtyFields.sedentaryHours) payload.sedentaryHours = toNumberOrUndefined(values.sedentaryHours);
  if (dirtyFields.screenTimeHours) payload.screenTimeHours = toNumberOrUndefined(values.screenTimeHours);
  return payload;
}

/** Checkboxes múltiples para healthcareAccess/alcoholTypes — arreglos de string plano, sin códigos. */
function CheckboxOptionGroup({
  options,
  value,
  onChange,
  disabled,
}: {
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled: boolean;
}) {
  return (
    <FormGroup row>
      {options.map((option) => (
        <FormControlLabel
          key={option}
          disabled={disabled}
          control={
            <Checkbox
              checked={value.includes(option)}
              onChange={(e) => {
                if (e.target.checked) onChange([...value, option]);
                else onChange(value.filter((item) => item !== option));
              }}
            />
          }
          label={option}
        />
      ))}
    </FormGroup>
  );
}

function formatBoolean(value: boolean | null): string {
  if (value === null) return 'Sin registrar';
  return value ? 'Sí' : 'No';
}

/** Chip de severidad reutilizado por dietQuality/physicalActivity/alcoholFrequency: mismo mapeo color↔severidad en los 3 campos. */
function HabitChip({
  label,
  severity,
  icon,
}: {
  label: string;
  severity: HabitSeverity | 'info';
  icon?: ReactElement;
}) {
  return (
    <Chip
      icon={icon}
      label={label}
      size="small"
      color={severity === 'default' ? undefined : severity}
      variant={severity === 'default' ? 'outlined' : 'filled'}
    />
  );
}

/** Ícono + número grande + subtítulo — para datos numéricos donde el valor en sí importa más que su color. */
function QuickStat({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          color: 'primary.main',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Stack>
  );
}

/**
 * Convierte un campo de texto libre (ej. "Diabetes, Hipertensión") en
 * chips individuales en vez de un párrafo — mismo ícono para todas las
 * entradas de un mismo campo, instanciado fresco por cada Chip (no se
 * reutiliza un único elemento de ícono entre varios Chips).
 */
function MedicalChipList({
  entries,
  color,
  icon: Icon,
}: {
  entries: string[];
  color: 'error' | 'warning';
  icon: typeof MonitorHeartOutlinedIcon;
}) {
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75}>
      {entries.map((entry) => (
        <Chip key={entry} label={entry} color={color} variant="outlined" size="small" icon={<Icon />} />
      ))}
    </Stack>
  );
}

function SummaryCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            color: 'primary.main',
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle2">{title}</Typography>
      </Stack>
      <Stack spacing={1}>{children}</Stack>
    </Paper>
  );
}

/**
 * Complemento de CleanStateBadge (shared/components), pero deliberadamente
 * NO se movió ahí: CleanStateBadge es siempre verde por diseño (para los
 * casos donde "ausencia de dato" SÍ es una buena noticia confirmada, ej.
 * HousingTab). Aquí, en cambio, la ausencia de dato es ambigua — puede
 * ser "confirmado sin riesgo" o "todavía no se preguntó" — así que este
 * badge es neutral (gris), nunca verde, para no repetir el falso
 * positivo que se está corrigiendo en este archivo.
 */
function PendingStateBadge({ label }: { label: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <HelpOutlineOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
      <Typography variant="body2" fontWeight={600} color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

function InfoLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}

export function HealthTab({ candidateId, health, captureMode, captureStatus }: HealthTabProps) {
  const { updateHealth } = useCandidateMutations();
  const [isEditing, setIsEditing] = useState(false);
  const isSaving = updateHealth.isPending;
  const canEdit = captureMode === 'MANUAL' && captureStatus === 'DRAFT';

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<HealthFormValues>({
    resolver: zodResolver(healthFormSchema),
    defaultValues: buildHealthFormDefaults(health),
  });

  const smokesValue = watch('smokes');
  const chronicDiseasesFamilyValue = watch('chronicDiseasesFamily');
  const usedDrugsValue = watch('usedDrugs');
  const pastDiseasesFlagValue = watch('pastDiseasesFlag');
  const surgeriesFlagValue = watch('surgeriesFlag');
  const healthcareAccessValue = watch('healthcareAccess');
  const alcoholTypesValue = watch('alcoholTypes');

  function handleStartEditing() {
    reset(buildHealthFormDefaults(health));
    setIsEditing(true);
  }

  async function onSubmit(values: HealthFormValues) {
    try {
      const payload = buildHealthPayload(values, dirtyFields);
      await updateHealth.mutateAsync({ id: candidateId, payload });
      setIsEditing(false);
    } catch {
      // El toast de error ya lo emite useCandidateMutations; el formulario
      // se queda abierto con lo que el usuario escribió, para reintentar.
    }
  }

  const { total, factors } = computeHealthRisk(health);
  const currentHealthMeter = classifyCurrentHealth(health.currentHealth);
  const physicalAspectSeverity = classifyPhysicalAspect(health.physicalAspect);
  const dietSeverity = classifyDietQuality(health.dietQuality);
  const physicalActivitySeverity = classifyPhysicalActivity(health.physicalActivity);
  const alcoholSeverity = classifyAlcoholFrequency(health.alcoholFrequency);
  // Tri-estado, no booleano: `null` (sin responder) nunca debe verse
  // igual que `false` (confirmado). Antes `isNonSmoker`/`hasNoDrugs`
  // trataban `health.smokes !== true`/`health.usedDrugs !== true` como
  // "no fuma"/"sin drogas" — eso incluía `null`, mostrando el badge
  // verde de "confirmado sin riesgo" aunque nunca se hubiera preguntado.
  const smokingStatus: 'pending' | 'no' | 'yes' =
    health.smokes === null ? 'pending' : health.smokes ? 'yes' : 'no';
  const drugsStatus: 'pending' | 'no' | 'yes' =
    health.usedDrugs === null ? 'pending' : health.usedDrugs ? 'yes' : 'no';
  // Sin un booleano equivalente para alcohol (solo texto libre + arreglo
  // de tipos), no hay forma de distinguir "confirmado sin consumo" de
  // "nunca se preguntó" — así que vacío siempre es Pendiente, nunca verde.
  const hasNoAlcoholData = isEmptyMedicalText(health.alcoholFrequency) && health.alcoholTypes.length === 0;
  const isRiskDataMissing = isHealthRiskDataMissing(health);
  const riskSeverity = isRiskDataMissing ? 'info' : total > 60 ? 'error' : total > 0 ? 'warning' : 'success';
  const riskTitle = isRiskDataMissing
    ? 'Evaluación pendiente'
    : riskSeverity === 'error'
      ? 'Riesgo de Salud Alto por Hábitos'
      : riskSeverity === 'warning'
        ? 'Riesgo moderado por hábitos'
        : 'Sin hábitos de riesgo detectados';
  const activeFactors = factors.filter((factor) => factor.active);

  if (isEditing) {
    return (
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Biometría y aspecto
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="Peso (kg)"
                  fullWidth
                  disabled={isSaving}
                  {...register('weight')}
                  error={!!errors.weight}
                  helperText={errors.weight?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="Estatura (cm)"
                  fullWidth
                  disabled={isSaving}
                  {...register('height')}
                  error={!!errors.height}
                  helperText={errors.height?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <FormLabel id="uses-glasses-label">Usa lentes</FormLabel>
                  <Controller
                    name="usesGlasses"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup row aria-labelledby="uses-glasses-label" {...field}>
                        <FormControlLabel value="yes" control={<Radio />} label="Sí" disabled={isSaving} />
                        <FormControlLabel value="no" control={<Radio />} label="No" disabled={isSaving} />
                      </RadioGroup>
                    )}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="Aspecto físico"
                  fullWidth
                  disabled={isSaving}
                  {...register('physicalAspect')}
                  error={!!errors.physicalAspect}
                  helperText={errors.physicalAspect?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Estado de salud actual"
                  fullWidth
                  disabled={isSaving}
                  {...register('currentHealth')}
                  error={!!errors.currentHealth}
                  helperText={errors.currentHealth?.message}
                >
                  <MenuItem value="">
                    <em>Sin especificar</em>
                  </MenuItem>
                  {CURRENT_HEALTH_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Enfermedades crónicas e historial médico
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormLabel id="chronic-diseases-family-label">¿Antecedentes familiares de enfermedades crónicas?</FormLabel>
                <Controller
                  name="chronicDiseasesFamily"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      row
                      aria-labelledby="chronic-diseases-family-label"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value === 'no') setValue('chronicDiseasesDetails', '');
                      }}
                    >
                      <FormControlLabel value="yes" control={<Radio />} label="Sí" disabled={isSaving} />
                      <FormControlLabel value="no" control={<Radio />} label="No" disabled={isSaving} />
                    </RadioGroup>
                  )}
                />
                {chronicDiseasesFamilyValue === 'yes' && (
                  <TextField
                    label="Detalle de antecedentes"
                    fullWidth
                    disabled={isSaving}
                    {...register('chronicDiseasesDetails')}
                    error={!!errors.chronicDiseasesDetails}
                    helperText={errors.chronicDiseasesDetails?.message}
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormLabel id="past-diseases-flag-label">¿Enfermedades pasadas?</FormLabel>
                <Controller
                  name="pastDiseasesFlag"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      row
                      aria-labelledby="past-diseases-flag-label"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value === 'no') setValue('pastDiseases', '', { shouldDirty: true });
                      }}
                    >
                      <FormControlLabel value="yes" control={<Radio />} label="Sí" disabled={isSaving} />
                      <FormControlLabel value="no" control={<Radio />} label="No" disabled={isSaving} />
                    </RadioGroup>
                  )}
                />
                {pastDiseasesFlagValue === 'yes' && (
                  <TextField
                    label="¿Cuáles?"
                    fullWidth
                    disabled={isSaving}
                    {...register('pastDiseases')}
                    error={!!errors.pastDiseases}
                    helperText={errors.pastDiseases?.message}
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormLabel id="surgeries-flag-label">¿Cirugías?</FormLabel>
                <Controller
                  name="surgeriesFlag"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      row
                      aria-labelledby="surgeries-flag-label"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value === 'no') setValue('surgeries', '', { shouldDirty: true });
                      }}
                    >
                      <FormControlLabel value="yes" control={<Radio />} label="Sí" disabled={isSaving} />
                      <FormControlLabel value="no" control={<Radio />} label="No" disabled={isSaving} />
                    </RadioGroup>
                  )}
                />
                {surgeriesFlagValue === 'yes' && (
                  <TextField
                    label="¿Cuáles?"
                    fullWidth
                    disabled={isSaving}
                    {...register('surgeries')}
                    error={!!errors.surgeries}
                    helperText={errors.surgeries?.message}
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Acceso a servicios de salud
            </Typography>
            <Controller
              name="healthcareAccess"
              control={control}
              render={({ field }) => (
                <CheckboxOptionGroup
                  options={[...HEALTHCARE_ACCESS_OPTIONS, OTHER_OPTION]}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSaving}
                />
              )}
            />
            {healthcareAccessValue.includes(OTHER_OPTION) && (
              <TextField
                label="Especifica el servicio de salud"
                fullWidth
                disabled={isSaving}
                {...register('healthcareAccessOther')}
                error={!!errors.healthcareAccessOther}
                helperText={errors.healthcareAccessOther?.message}
                sx={{ mt: 1 }}
              />
            )}
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Consumo de sustancias
            </Typography>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  label="Frecuencia de consumo de alcohol"
                  fullWidth
                  disabled={isSaving}
                  {...register('alcoholFrequency')}
                  error={!!errors.alcoholFrequency}
                  helperText={errors.alcoholFrequency?.message}
                />
                <Box sx={{ mt: 1 }}>
                  <Controller
                    name="alcoholTypes"
                    control={control}
                    render={({ field }) => (
                      <CheckboxOptionGroup
                        options={[...ALCOHOL_TYPE_OPTIONS, OTHER_OPTION]}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSaving}
                      />
                    )}
                  />
                  {alcoholTypesValue.includes(OTHER_OPTION) && (
                    <TextField
                      label="Especifica el tipo de bebida"
                      fullWidth
                      disabled={isSaving}
                      {...register('alcoholTypesOther')}
                      error={!!errors.alcoholTypesOther}
                      helperText={errors.alcoholTypesOther?.message}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormLabel id="smokes-label">¿Fuma?</FormLabel>
                <Controller
                  name="smokes"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      row
                      aria-labelledby="smokes-label"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value === 'no') {
                          setValue('cigarettesPerDay', '');
                          setValue('smokingExpensePerWeek', '');
                        }
                      }}
                    >
                      <FormControlLabel value="yes" control={<Radio />} label="Sí" disabled={isSaving} />
                      <FormControlLabel value="no" control={<Radio />} label="No" disabled={isSaving} />
                    </RadioGroup>
                  )}
                />
                {smokesValue === 'yes' && (
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      label="Cigarros/día"
                      fullWidth
                      disabled={isSaving}
                      {...register('cigarettesPerDay')}
                      error={!!errors.cigarettesPerDay}
                      helperText={errors.cigarettesPerDay?.message}
                    />
                    <TextField
                      label="Gasto semanal ($)"
                      fullWidth
                      disabled={isSaving}
                      {...register('smokingExpensePerWeek')}
                      error={!!errors.smokingExpensePerWeek}
                      helperText={errors.smokingExpensePerWeek?.message}
                    />
                  </Stack>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormLabel id="used-drugs-label">¿Ha consumido drogas?</FormLabel>
                <Controller
                  name="usedDrugs"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      row
                      aria-labelledby="used-drugs-label"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value === 'no') setValue('drugsDetails', '');
                      }}
                    >
                      <FormControlLabel value="yes" control={<Radio />} label="Sí" disabled={isSaving} />
                      <FormControlLabel value="no" control={<Radio />} label="No" disabled={isSaving} />
                    </RadioGroup>
                  )}
                />
                {usedDrugsValue === 'yes' && (
                  <TextField
                    label="Detalle de consumo"
                    fullWidth
                    disabled={isSaving}
                    {...register('drugsDetails')}
                    error={!!errors.drugsDetails}
                    helperText={errors.drugsDetails?.message}
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Hábitos de vida
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  select
                  label="Calidad de la alimentación"
                  fullWidth
                  disabled={isSaving}
                  {...register('dietQuality')}
                  error={!!errors.dietQuality}
                  helperText={errors.dietQuality?.message}
                >
                  <MenuItem value="">
                    <em>Sin especificar</em>
                  </MenuItem>
                  {DIET_QUALITY_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  select
                  label="Actividad física"
                  fullWidth
                  disabled={isSaving}
                  {...register('physicalActivity')}
                  error={!!errors.physicalActivity}
                  helperText={errors.physicalActivity?.message}
                >
                  <MenuItem value="">
                    <em>Sin especificar</em>
                  </MenuItem>
                  {PHYSICAL_ACTIVITY_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="Horas sedentarias al día"
                  fullWidth
                  disabled={isSaving}
                  {...register('sedentaryHours')}
                  error={!!errors.sedentaryHours}
                  helperText={errors.sedentaryHours?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="Horas de pantalla al día"
                  fullWidth
                  disabled={isSaving}
                  {...register('screenTimeHours')}
                  error={!!errors.screenTimeHours}
                  helperText={errors.screenTimeHours?.message}
                />
              </Grid>
            </Grid>
          </Paper>

          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained" size="small" disabled={isSaving}>
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
        </Stack>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {canEdit && (
        <Stack direction="row" justifyContent="flex-end">
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
              <OpacityOutlinedIcon fontSize="small" color="action" />
              <Typography variant="subtitle1">Riesgo acumulado por hábitos</Typography>
            </Stack>

            <Stack direction="row" spacing={3} alignItems="center">
              <RiskGlass total={total} factors={factors} />

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Alert severity={riskSeverity} variant="filled" sx={{ borderRadius: 3 }}>
                  <AlertTitle sx={{ fontWeight: 700 }}>{riskTitle}</AlertTitle>
                  {isRiskDataMissing
                    ? 'No hay información registrada sobre hábitos de riesgo.'
                    : activeFactors.length > 0
                      ? `Factores detectados: ${activeFactors.map((factor) => factor.label).join(', ')}.`
                      : 'No se detectaron hábitos de riesgo registrados.'}
                </Alert>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
              <MonitorWeightOutlinedIcon fontSize="small" color="action" />
              <Typography variant="subtitle1">Índice de Masa Corporal</Typography>
            </Stack>
            <BmiGauge weightKg={health.weight} heightCm={health.height} />
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard icon={<MedicalServicesOutlinedIcon fontSize="small" />} title="Enfermedades crónicas">
            <InfoLine label="Antecedentes familiares" value={formatBoolean(health.chronicDiseasesFamily)} />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Detalle
              </Typography>
              {isEmptyMedicalText(health.chronicDiseasesDetails) ? (
                <PendingStateBadge label="No registrado" />
              ) : (
                <MedicalChipList
                  entries={splitMedicalEntries(health.chronicDiseasesDetails)}
                  color="warning"
                  icon={MonitorHeartOutlinedIcon}
                />
              )}
            </Box>
          </SummaryCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard icon={<FactCheckOutlinedIcon fontSize="small" />} title="Historial médico">
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Enfermedades pasadas
              </Typography>
              {isEmptyMedicalText(health.pastDiseases) ? (
                <PendingStateBadge label="No registrado" />
              ) : (
                <MedicalChipList
                  entries={splitMedicalEntries(health.pastDiseases)}
                  color="warning"
                  icon={MonitorHeartOutlinedIcon}
                />
              )}
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Cirugías
              </Typography>
              {isEmptyMedicalText(health.surgeries) ? (
                <PendingStateBadge label="No registrado" />
              ) : (
                <MedicalChipList
                  entries={splitMedicalEntries(health.surgeries)}
                  color="error"
                  icon={LocalHospitalOutlinedIcon}
                />
              )}
            </Box>
          </SummaryCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard icon={<AccessibilityNewOutlinedIcon fontSize="small" />} title="Aspecto físico y condiciones">
            <Stack direction="row" spacing={1.25} alignItems="center">
              {health.usesGlasses === true ? (
                <VisibilityOutlinedIcon color="primary" fontSize="small" />
              ) : (
                <VisibilityOffOutlinedIcon sx={{ color: 'text.disabled' }} fontSize="small" />
              )}
              <Typography variant="body2">
                Usa lentes: <strong>{formatBoolean(health.usesGlasses)}</strong>
              </Typography>
            </Stack>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Aspecto físico
              </Typography>
              {isEmptyMedicalText(health.physicalAspect) ? (
                <Typography variant="body2" color="text.secondary">
                  Sin registrar
                </Typography>
              ) : (
                <Chip
                  label={health.physicalAspect}
                  size="small"
                  color={physicalAspectSeverity === 'default' ? undefined : physicalAspectSeverity}
                  variant={physicalAspectSeverity === 'default' ? 'outlined' : 'filled'}
                />
              )}
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography variant="caption" color="text.secondary">
                  Estado actual
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isEmptyMedicalText(health.currentHealth) ? 'Sin registrar' : health.currentHealth}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={currentHealthMeter.percent}
                color={currentHealthMeter.color}
                sx={{ mt: 0.5, height: 8, borderRadius: 4 }}
              />
            </Box>
          </SummaryCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard icon={<LocalHospitalOutlinedIcon fontSize="small" />} title="Acceso a servicios de salud">
            {health.healthcareAccess.length === 0 ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                <BusinessOutlinedIcon fontSize="small" />
                <Typography variant="body2">Sin cobertura registrada</Typography>
              </Stack>
            ) : (
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {health.healthcareAccess.map((service) => (
                  <Chip
                    key={service}
                    icon={<HealthAndSafetyOutlinedIcon />}
                    label={service}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            )}
          </SummaryCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard icon={<DirectionsRunOutlinedIcon fontSize="small" />} title="Hábitos de vida">
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Calidad de la alimentación
              </Typography>
              {isEmptyMedicalText(health.dietQuality) ? (
                <Typography variant="body2" color="text.secondary">
                  Sin registrar
                </Typography>
              ) : (
                <HabitChip label={health.dietQuality!} severity={dietSeverity} />
              )}
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Actividad física
              </Typography>
              {isEmptyMedicalText(health.physicalActivity) ? (
                <Typography variant="body2" color="text.secondary">
                  Sin registrar
                </Typography>
              ) : (
                <HabitChip label={health.physicalActivity!} severity={physicalActivitySeverity} />
              )}
            </Box>
            <QuickStat
              icon={<WeekendOutlinedIcon fontSize="small" />}
              value={health.sedentaryHours !== null ? `${health.sedentaryHours}h` : '—'}
              label="Horas sedentarias al día"
            />
            <QuickStat
              icon={<MonitorOutlinedIcon fontSize="small" />}
              value={health.screenTimeHours !== null ? `${health.screenTimeHours}h` : '—'}
              label="Horas de pantalla al día"
            />
          </SummaryCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard icon={<SmokingRoomsOutlinedIcon fontSize="small" />} title="Consumo de sustancias">
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Alcohol
              </Typography>
              {hasNoAlcoholData ? (
                <PendingStateBadge label="No registrado" />
              ) : (
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  {!isEmptyMedicalText(health.alcoholFrequency) && (
                    <HabitChip
                      label={health.alcoholFrequency!}
                      severity={alcoholSeverity}
                      icon={<WineBarOutlinedIcon />}
                    />
                  )}
                  {health.alcoholTypes.map((type) => (
                    <Chip key={type} icon={<WineBarOutlinedIcon />} label={type} size="small" variant="outlined" />
                  ))}
                </Stack>
              )}
            </Box>

            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Tabaco
              </Typography>
              {smokingStatus === 'pending' ? (
                <PendingStateBadge label="No registrado" />
              ) : smokingStatus === 'no' ? (
                <CleanStateBadge label="No fuma" icon={SmokeFreeOutlinedIcon} />
              ) : (
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  <Chip
                    icon={<SmokingRoomsOutlinedIcon />}
                    label={
                      health.cigarettesPerDay !== null
                        ? `${health.cigarettesPerDay} cigarros/día`
                        : 'Cantidad no especificada'
                    }
                    color="warning"
                    size="small"
                  />
                  {health.smokingExpensePerWeek !== null && (
                    <Chip
                      icon={<SmokingRoomsOutlinedIcon />}
                      label={`$${health.smokingExpensePerWeek}/semana`}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Stack>
              )}
            </Box>

            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Drogas
              </Typography>
              {drugsStatus === 'pending' ? (
                <PendingStateBadge label="No registrado" />
              ) : drugsStatus === 'no' ? (
                <CleanStateBadge label="Sin consumo de drogas" />
              ) : (
                <MedicalChipList
                  entries={
                    splitMedicalEntries(health.drugsDetails).length > 0
                      ? splitMedicalEntries(health.drugsDetails)
                      : ['Uso reportado']
                  }
                  color="error"
                  icon={MedicationOutlinedIcon}
                />
              )}
            </Box>
          </SummaryCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
