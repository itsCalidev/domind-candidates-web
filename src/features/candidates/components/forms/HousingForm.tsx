import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import WeekendOutlinedIcon from '@mui/icons-material/WeekendOutlined';
import TableRestaurantOutlinedIcon from '@mui/icons-material/TableRestaurantOutlined';
import KitchenOutlinedIcon from '@mui/icons-material/KitchenOutlined';
import YardOutlinedIcon from '@mui/icons-material/YardOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import ElectricBoltOutlinedIcon from '@mui/icons-material/ElectricBoltOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import WifiOutlinedIcon from '@mui/icons-material/WifiOutlined';
import PlumbingOutlinedIcon from '@mui/icons-material/PlumbingOutlined';
import TvOutlinedIcon from '@mui/icons-material/TvOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import { CleanStateBadge } from '@/shared/components/CleanStateBadge';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { assessArraigo } from '../../utils/housingArraigo';
import { EvidenceGallery } from '../EvidenceGallery';
import { useCandidateMutations } from '../../hooks/useCandidateMutations';
import type {
  CandidateCaptureMode,
  CandidateCaptureStatus,
  CandidateHousing,
  CandidateHousingPayload,
} from '../../types/candidate.types';
import {
  HOUSING_CONDITIONS_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  PUBLIC_SERVICES_OPTIONS,
  housingFormSchema,
  type HousingFormValues,
} from '../../types/housingForm.schema';

/**
 * Único formulario de "Vivienda" — combina lo que antes eran HousingTab
 * (panel admin) y CandidateHousingStep (Wizard) en un solo componente con
 * un solo esquema Zod (`housingFormSchema`, el original y estricto del
 * panel admin). Resuelve la deuda técnica detectada en la auditoría
 * previa: ya no existen dos schemas de Vivienda divergentes.
 */
type HousingFormProps =
  | {
      mode: 'admin';
      candidateId: string;
      housing: CandidateHousing;
      captureMode: CandidateCaptureMode;
      captureStatus: CandidateCaptureStatus;
    }
  | {
      mode: 'candidate';
      candidateId: string;
      housing: CandidateHousing | null;
      /** Avisa al Wizard que este paso se guardó — desbloquea el siguiente. */
      onSaved: () => void;
    };

const NOT_SPECIFIED = 'No especificado';
/** Regla estricta de negocio: HOUSING solo acepta fotografías, nunca PDF. */
const HOUSING_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function PropertyStat({ icon, value, label }: { icon: ReactNode; value: number | null; label: string }) {
  return (
    <Stack alignItems="center" spacing={0.5} sx={{ textAlign: 'center' }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>
        {value ?? '—'}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

function OwnerFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box sx={{ color: 'action.active', display: 'flex' }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={500}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

/**
 * Diccionario ícono↔servicio para los 6 valores exactos del catálogo
 * (`PUBLIC_SERVICES_OPTIONS`) — la vista de solo lectura empareja por
 * igualdad, no por palabra clave.
 */
const PUBLIC_SERVICE_ICONS: Record<string, typeof WaterDropOutlinedIcon> = {
  Agua: WaterDropOutlinedIcon,
  Luz: ElectricBoltOutlinedIcon,
  Gas: LocalFireDepartmentOutlinedIcon,
  Drenaje: PlumbingOutlinedIcon,
  Internet: WifiOutlinedIcon,
  Telecable: TvOutlinedIcon,
};

function getPublicServiceIcon(service: string): typeof WaterDropOutlinedIcon {
  return PUBLIC_SERVICE_ICONS[service] ?? CheckCircleOutlineOutlinedIcon;
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

const EMPTY_HOUSING: CandidateHousing = {
  housingType: null,
  housingConditions: null,
  propertyOwner: null,
  timeLivingThere: null,
  previousAddress: null,
  roomsCount: null,
  bathroomsCount: null,
  livingRoomCount: null,
  diningRoomCount: null,
  kitchenCount: null,
  patioCount: null,
  publicServices: [],
  hasInfonavitDebt: null,
  infonavitAmount: null,
  infonavitCreditNumber: null,
};

function buildHousingFormDefaults(housing: CandidateHousing | null): HousingFormValues {
  const safeHousing = housing ?? EMPTY_HOUSING;
  return {
    housingType: pickOption(HOUSING_TYPE_OPTIONS, safeHousing.housingType),
    housingConditions: pickOption(HOUSING_CONDITIONS_OPTIONS, safeHousing.housingConditions),
    propertyOwner: safeHousing.propertyOwner ?? '',
    timeLivingThere: safeHousing.timeLivingThere ?? '',
    previousAddress: safeHousing.previousAddress ?? '',
    roomsCount: toFormNumber(safeHousing.roomsCount),
    bathroomsCount: toFormNumber(safeHousing.bathroomsCount),
    livingRoomCount: toFormNumber(safeHousing.livingRoomCount),
    diningRoomCount: toFormNumber(safeHousing.diningRoomCount),
    kitchenCount: toFormNumber(safeHousing.kitchenCount),
    patioCount: toFormNumber(safeHousing.patioCount),
    publicServices: safeHousing.publicServices,
    hasInfonavitDebt: toTriState(safeHousing.hasInfonavitDebt),
    infonavitAmount: toFormNumber(safeHousing.infonavitAmount),
    infonavitCreditNumber: safeHousing.infonavitCreditNumber ?? '',
  };
}

function toNumberOrUndefined(value: string | undefined): number | undefined {
  return value ? Number(value) : undefined;
}

/**
 * Solo incluye los campos que react-hook-form marcó como `dirty` — mismo
 * criterio de PATCH parcial que el resto de los formularios de esta
 * familia, sin importar si lo dispara el reclutador o el candidato.
 */
function buildHousingPayload(
  values: HousingFormValues,
  dirtyFields: Partial<Record<keyof HousingFormValues, unknown>>,
): Partial<CandidateHousingPayload> {
  const payload: Partial<CandidateHousingPayload> = {};
  if (dirtyFields.housingType) payload.housingType = values.housingType;
  if (dirtyFields.housingConditions) payload.housingConditions = values.housingConditions;
  if (dirtyFields.propertyOwner) payload.propertyOwner = values.propertyOwner;
  if (dirtyFields.timeLivingThere) payload.timeLivingThere = values.timeLivingThere;
  if (dirtyFields.previousAddress) payload.previousAddress = values.previousAddress;
  if (dirtyFields.roomsCount) payload.roomsCount = toNumberOrUndefined(values.roomsCount);
  if (dirtyFields.bathroomsCount) payload.bathroomsCount = toNumberOrUndefined(values.bathroomsCount);
  if (dirtyFields.livingRoomCount) payload.livingRoomCount = toNumberOrUndefined(values.livingRoomCount);
  if (dirtyFields.diningRoomCount) payload.diningRoomCount = toNumberOrUndefined(values.diningRoomCount);
  if (dirtyFields.kitchenCount) payload.kitchenCount = toNumberOrUndefined(values.kitchenCount);
  if (dirtyFields.patioCount) payload.patioCount = toNumberOrUndefined(values.patioCount);
  if (dirtyFields.publicServices) payload.publicServices = values.publicServices;
  if (dirtyFields.hasInfonavitDebt && values.hasInfonavitDebt !== '') {
    payload.hasInfonavitDebt = values.hasInfonavitDebt === 'yes';
  }
  if (dirtyFields.infonavitAmount) payload.infonavitAmount = toNumberOrUndefined(values.infonavitAmount);
  if (dirtyFields.infonavitCreditNumber) payload.infonavitCreditNumber = values.infonavitCreditNumber;
  return payload;
}

export function HousingForm(props: HousingFormProps) {
  const { candidateId } = props;
  const { updateHousing } = useCandidateMutations();
  const [isEditing, setIsEditing] = useState(false);
  const isSaving = updateHousing.isPending;

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<HousingFormValues>({
    resolver: zodResolver(housingFormSchema),
    defaultValues: buildHousingFormDefaults(props.housing),
  });

  const hasInfonavitDebtValue = watch('hasInfonavitDebt');

  function handleStartEditing() {
    reset(buildHousingFormDefaults(props.housing));
    setIsEditing(true);
  }

  async function onSubmit(values: HousingFormValues) {
    try {
      const payload = buildHousingPayload(values, dirtyFields);
      await updateHousing.mutateAsync({ id: candidateId, payload });
      if (props.mode === 'admin') {
        setIsEditing(false);
      } else {
        props.onSaved();
      }
    } catch {
      // El toast de error ya lo emite useCandidateMutations; el formulario
      // se queda abierto con lo que el usuario escribió, para reintentar.
    }
  }

  const formContent = (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Información general
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="housingType"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Tipo de vivienda"
                  fullWidth
                  disabled={isSaving}
                  error={!!errors.housingType}
                  helperText={errors.housingType?.message}
                >
                  <MenuItem value="">
                    <em>Sin especificar</em>
                  </MenuItem>
                  {HOUSING_TYPE_OPTIONS.map((option) => (
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
              name="housingConditions"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Condiciones"
                  fullWidth
                  disabled={isSaving}
                  error={!!errors.housingConditions}
                  helperText={errors.housingConditions?.message}
                >
                  <MenuItem value="">
                    <em>Sin especificar</em>
                  </MenuItem>
                  {HOUSING_CONDITIONS_OPTIONS.map((option) => (
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
              label="Propietario"
              fullWidth
              disabled={isSaving}
              {...register('propertyOwner')}
              error={!!errors.propertyOwner}
              helperText={errors.propertyOwner?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Tiempo de vivir ahí"
              fullWidth
              disabled={isSaving}
              {...register('timeLivingThere')}
              error={!!errors.timeLivingThere}
              helperText={errors.timeLivingThere?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Domicilio anterior"
              fullWidth
              disabled={isSaving}
              {...register('previousAddress')}
              error={!!errors.previousAddress}
              helperText={errors.previousAddress?.message}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Distribución de la propiedad
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <TextField
              label="Habitaciones"
              fullWidth
              disabled={isSaving}
              {...register('roomsCount')}
              error={!!errors.roomsCount}
              helperText={errors.roomsCount?.message}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 3 } }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <TextField
              label="Baños"
              fullWidth
              disabled={isSaving}
              {...register('bathroomsCount')}
              error={!!errors.bathroomsCount}
              helperText={errors.bathroomsCount?.message}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 3 } }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <TextField
              label="Salas"
              fullWidth
              disabled={isSaving}
              {...register('livingRoomCount')}
              error={!!errors.livingRoomCount}
              helperText={errors.livingRoomCount?.message}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 3 } }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <TextField
              label="Comedores"
              fullWidth
              disabled={isSaving}
              {...register('diningRoomCount')}
              error={!!errors.diningRoomCount}
              helperText={errors.diningRoomCount?.message}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 3 } }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <TextField
              label="Cocinas"
              fullWidth
              disabled={isSaving}
              {...register('kitchenCount')}
              error={!!errors.kitchenCount}
              helperText={errors.kitchenCount?.message}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 3 } }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <TextField
              label="Patios"
              fullWidth
              disabled={isSaving}
              {...register('patioCount')}
              error={!!errors.patioCount}
              helperText={errors.patioCount?.message}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 3 } }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
          Servicios públicos
        </Typography>
        <Controller
          name="publicServices"
          control={control}
          render={({ field }) => (
            <FormGroup row>
              {PUBLIC_SERVICES_OPTIONS.map((option) => (
                <FormControlLabel
                  key={option}
                  disabled={isSaving}
                  control={
                    <Checkbox
                      checked={field.value.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) field.onChange([...field.value, option]);
                        else field.onChange(field.value.filter((item) => item !== option));
                      }}
                    />
                  }
                  label={option}
                />
              ))}
            </FormGroup>
          )}
        />
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
          Deuda Infonavit / Hipotecaria
        </Typography>
        <FormLabel id="has-infonavit-debt-label">¿Tiene deuda Infonavit o hipotecaria?</FormLabel>
        <Controller
          name="hasInfonavitDebt"
          control={control}
          render={({ field }) => (
            <RadioGroup row aria-labelledby="has-infonavit-debt-label" {...field}>
              <FormControlLabel value="yes" control={<Radio />} label="Sí" disabled={isSaving} />
              <FormControlLabel value="no" control={<Radio />} label="No" disabled={isSaving} />
            </RadioGroup>
          )}
        />
        {hasInfonavitDebtValue === 'yes' && (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Monto"
                fullWidth
                disabled={isSaving}
                {...register('infonavitAmount')}
                error={!!errors.infonavitAmount}
                helperText={errors.infonavitAmount?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Número de crédito"
                fullWidth
                disabled={isSaving}
                {...register('infonavitCreditNumber')}
                error={!!errors.infonavitCreditNumber}
                helperText={errors.infonavitCreditNumber?.message}
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <EvidenceGallery
          candidateId={candidateId}
          category="HOUSING"
          readOnly={false}
          allowPdf={false}
          maxImageBytes={HOUSING_MAX_IMAGE_BYTES}
        />
      </Paper>
    </Stack>
  );

  if (props.mode === 'candidate') {
    return (
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={3}>
          {formContent}
          <Stack direction="row" justifyContent="flex-end">
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar y continuar'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  const canEdit = props.captureMode === 'MANUAL' && props.captureStatus === 'DRAFT';

  if (isEditing) {
    return (
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={3}>
          {formContent}
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

  const housing = props.housing;
  const arraigo = assessArraigo(housing.housingConditions, housing.hasInfonavitDebt);

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

      <Alert severity={arraigo.severity} variant="filled" sx={{ borderRadius: 3 }}>
        <AlertTitle sx={{ fontWeight: 700 }}>{arraigo.title}</AlertTitle>
        {arraigo.message}
      </Alert>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <HomeOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Distribución de la propiedad</Typography>
        </Stack>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          {housing.housingType ?? 'Tipo de vivienda no especificado'}
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <PropertyStat icon={<BedOutlinedIcon />} value={housing.roomsCount} label="Habitaciones" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <PropertyStat icon={<BathtubOutlinedIcon />} value={housing.bathroomsCount} label="Baños" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <PropertyStat icon={<WeekendOutlinedIcon />} value={housing.livingRoomCount} label="Salas" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <PropertyStat icon={<TableRestaurantOutlinedIcon />} value={housing.diningRoomCount} label="Comedores" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <PropertyStat icon={<KitchenOutlinedIcon />} value={housing.kitchenCount} label="Cocinas" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <PropertyStat icon={<YardOutlinedIcon />} value={housing.patioCount} label="Patios" />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <OwnerFact icon={<HandshakeOutlinedIcon fontSize="small" />} label="Propietario" value={housing.propertyOwner ?? NOT_SPECIFIED} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <OwnerFact
              icon={<AccessTimeOutlinedIcon fontSize="small" />}
              label="Tiempo viviendo ahí"
              value={housing.timeLivingThere ?? NOT_SPECIFIED}
            />
          </Grid>
          {housing.previousAddress && (
            <Grid size={{ xs: 12, sm: 4 }}>
              <OwnerFact icon={<HomeOutlinedIcon fontSize="small" />} label="Domicilio anterior" value={housing.previousAddress} />
            </Grid>
          )}
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Servicios públicos
        </Typography>
        {housing.publicServices.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Sin servicios públicos registrados
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {housing.publicServices.map((service) => {
              const Icon = getPublicServiceIcon(service);
              return (
                <Grid key={service} size={{ xs: 6, sm: 4, lg: 2 }}>
                  <Stack
                    alignItems="center"
                    spacing={0.75}
                    sx={{
                      py: 2,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'primary.main',
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    }}
                  >
                    <Icon sx={{ fontSize: 30, color: 'primary.main' }} />
                    <Typography variant="caption" fontWeight={600} color="text.primary">
                      {service}
                    </Typography>
                  </Stack>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>

      {housing.hasInfonavitDebt === true ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'warning.main',
            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
            <RequestQuoteOutlinedIcon color="warning" fontSize="small" />
            <Typography variant="subtitle1">Deuda Infonavit / Hipotecaria</Typography>
          </Stack>
          <Typography variant="h4" fontWeight={700} color="warning.dark">
            {formatCurrency(housing.infonavitAmount)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Número de crédito: {housing.infonavitCreditNumber ?? NOT_SPECIFIED}
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
          <CleanStateBadge label="Sin deuda hipotecaria / Infonavit" />
        </Paper>
      )}

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <EvidenceGallery
          candidateId={candidateId}
          category="HOUSING"
          readOnly
          emptyMessage="El candidato no adjuntó evidencia fotográfica de la vivienda."
          allowPdf={false}
          maxImageBytes={HOUSING_MAX_IMAGE_BYTES}
        />
      </Paper>
    </Stack>
  );
}
