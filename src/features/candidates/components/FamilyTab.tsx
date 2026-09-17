import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { VisuallyHidden } from '@/shared/components/VisuallyHidden';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import type {
  CandidateCaptureMode,
  CandidateCaptureStatus,
  CandidateFamily,
  FamilyMember,
  UpdateCandidateFamilyPayload,
} from '../types/candidate.types';
import {
  familyFormSchema,
  type FamilyFormValues,
  type FamilyMemberFormValues,
} from '../types/familyForm.schema';
import { HIGHEST_EDUCATION_OPTIONS } from '../types/personalInfo.schema';
import { maritalStatusLabels } from '../utils/maritalStatus';

const FAMILY_TABLE_COLUMNS = 6;
const NOT_SPECIFIED = 'No especificado';

interface FamilyTabProps {
  candidateId: string;
  family: CandidateFamily;
  familyMembers: FamilyMember[];
  captureMode: CandidateCaptureMode;
  captureStatus: CandidateCaptureStatus;
}

/**
 * Opciones sugeridas para los Select del formulario — el backend guarda
 * los 3 como texto libre (`String?`), confirmado por el usuario, así que
 * esta lista solo limita qué puede elegir el reclutador desde la UI, no
 * es un enum del backend. Estado Civil reutiliza las mismas 5 categorías
 * de Información General (como pidió el usuario), pero aquí el value
 * enviado es la etiqueta en español, no el código del enum `MaritalStatus`
 * — ese código solo aplica en `PersonalInfoPayload` (endpoint distinto).
 */
const RELATIONSHIP_OPTIONS = ['Padre', 'Madre', 'Cónyuge', 'Hijo(a)', 'Hermano(a)', 'Abuelo(a)', 'Otro'];
const EDUCATION_OPTIONS = HIGHEST_EDUCATION_OPTIONS;
const MARITAL_STATUS_OPTIONS = Object.values(maritalStatusLabels);

const EMPTY_MEMBER: FamilyMemberFormValues = {
  name: '',
  relationship: '',
  age: '',
  occupation: '',
  education: '',
  maritalStatus: '',
};

function buildFamilyFormDefaults(family: CandidateFamily, familyMembers: FamilyMember[]): FamilyFormValues {
  return {
    familyMembers: familyMembers.map((member) => ({
      name: member.name,
      relationship: member.relationship ?? '',
      age: member.age === null ? '' : String(member.age),
      occupation: member.occupation ?? '',
      education: member.education ?? '',
      maritalStatus: member.maritalStatus ?? '',
    })),
    hasGovRelatives: family.hasGovRelatives === null ? '' : family.hasGovRelatives ? 'yes' : 'no',
    govRelativesDetails: family.govRelativesDetails ?? '',
    hasPoliticalPosts: family.hasPoliticalPosts === null ? '' : family.hasPoliticalPosts ? 'yes' : 'no',
    politicalPostsDetails: family.politicalPostsDetails ?? '',
  };
}

/**
 * El backend reemplaza el arreglo `familyMembers` completo en cada PATCH
 * (no hace upsert individual) — por eso aquí SIEMPRE se manda cada
 * integrante entero, sin diffing de campos "dirty" (a diferencia de
 * `updatePersonalInfo`, donde sí aplica).
 */
function buildFamilyPayload(values: FamilyFormValues): UpdateCandidateFamilyPayload {
  return {
    familyMembers: values.familyMembers.map((member) => ({
      name: member.name,
      ...(member.relationship ? { relationship: member.relationship } : {}),
      ...(member.age ? { age: Number(member.age) } : {}),
      ...(member.occupation ? { occupation: member.occupation } : {}),
      ...(member.education ? { education: member.education } : {}),
      ...(member.maritalStatus ? { maritalStatus: member.maritalStatus } : {}),
    })),
    ...(values.hasGovRelatives !== '' ? { hasGovRelatives: values.hasGovRelatives === 'yes' } : {}),
    ...(values.hasGovRelatives === 'yes' && values.govRelativesDetails
      ? { govRelativesDetails: values.govRelativesDetails }
      : {}),
    ...(values.hasPoliticalPosts !== '' ? { hasPoliticalPosts: values.hasPoliticalPosts === 'yes' } : {}),
    ...(values.hasPoliticalPosts === 'yes' && values.politicalPostsDetails
      ? { politicalPostsDetails: values.politicalPostsDetails }
      : {}),
  };
}

/**
 * `education`/`maritalStatus`/`relationship` son texto libre: un
 * integrante ya guardado puede tener un valor que no está en la lista de
 * opciones sugeridas. Sin esto, el Select de MUI mostraría un
 * "out-of-range value" y ocultaría el dato real en vez de solo permitir
 * elegir uno de los sugeridos — mismo criterio ya usado en GeneralInfoTab.
 */
function withCurrentValueOption(options: readonly string[], currentValue: string): string[] {
  if (!currentValue || options.includes(currentValue)) return [...options];
  return [currentValue, ...options];
}

interface FamilyChartDatum {
  /**
   * Clave única para el <XAxis dataKey>. Recharts indexa el payload del
   * Tooltip por el valor de esta clave — con `relationship` repetido
   * (dos "Hijo(a)"), varias barras comparten la misma categoría y el
   * tooltip mostraba siempre los datos de la PRIMERA que encontraba, sin
   * importar sobre cuál barra real estaba el cursor. El índice del
   * arreglo la vuelve única incluso si dos familiares tienen el mismo
   * parentesco Y el mismo nombre.
   */
  uniqueKey: string;
  /** Texto limpio para mostrar (eje y tooltip) — nunca `uniqueKey`, que lleva el índice pegado. */
  label: string;
  age: number;
  occupation: string | null;
  education: string | null;
}

/**
 * Tooltip a medida: el `payload` de Recharts trae por default solo el
 * valor graficado (`age`) — `payload[0].payload` es el ÚNICO camino para
 * llegar al resto del registro original (occupation/education), que es
 * justo lo que pidió el cliente mostrar al pasar el cursor. Lee el
 * nombre a mostrar desde `member.label` (no del `label` que Recharts
 * pasa por separado, que ahora es `uniqueKey` y no se ve limpio).
 *
 * Usa `sx` de MUI (no `contentStyle` con hex) porque al ser un
 * componente propio puede apoyarse en los tokens del theme directamente
 * — se ve bien en oscuro sin tener que resolver colores a mano.
 */
function FamilyAgeTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const member = payload[0].payload as FamilyChartDatum;

  return (
    <Paper
      elevation={4}
      sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', minWidth: 180 }}
    >
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {member.label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Edad: <strong>{member.age}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Ocupación: <strong>{member.occupation ?? NOT_SPECIFIED}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Escolaridad: <strong>{member.education ?? NOT_SPECIFIED}</strong>
      </Typography>
    </Paper>
  );
}

/**
 * 4 estados estrictos — antes `null` (sin capturar) se trataba igual que
 * `false` (sin riesgo confirmado), lo que producía un falso positivo
 * peligroso: un candidato sin ninguna información familiar registrada
 * mostraba el mismo banner verde "Sin riesgo" que uno con ambos campos
 * explícitamente en `false`. Ahora "sin datos" es su propio estado
 * neutral, nunca se colapsa a "sin riesgo".
 */
type FamilyRiskLevel = 'pending' | 'none' | 'caution' | 'high';

export function FamilyTab({ candidateId, family, familyMembers, captureMode, captureStatus }: FamilyTabProps) {
  const theme = useTheme();
  const { updateFamily } = useCandidateMutations();
  const [isEditing, setIsEditing] = useState(false);
  const isSaving = updateFamily.isPending;
  const canEdit = captureMode === 'MANUAL' && captureStatus === 'DRAFT';

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FamilyFormValues>({
    resolver: zodResolver(familyFormSchema),
    defaultValues: buildFamilyFormDefaults(family, familyMembers),
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'familyMembers' });

  const hasGovValue = watch('hasGovRelatives');
  const hasPoliticalValue = watch('hasPoliticalPosts');

  function handleStartEditing() {
    reset(buildFamilyFormDefaults(family, familyMembers));
    setIsEditing(true);
  }

  async function onSubmit(values: FamilyFormValues) {
    try {
      const payload = buildFamilyPayload(values);
      await updateFamily.mutateAsync({ id: candidateId, payload });
      setIsEditing(false);
    } catch {
      // El toast de error ya lo emite useCandidateMutations; el formulario
      // se queda abierto con lo que el usuario escribió, para reintentar.
    }
  }

  // Solo "sin riesgo" cuando AMBOS campos están explícitamente
  // capturados como `false` — si cualquiera de los dos sigue sin
  // responder (`null`/`undefined`), no hay evidencia suficiente para
  // afirmar que no hay exposición, así que el estado es "pendiente".
  const hasGovInfo = family.hasGovRelatives !== null && family.hasGovRelatives !== undefined;
  const hasPoliticalInfo = family.hasPoliticalPosts !== null && family.hasPoliticalPosts !== undefined;
  const isPending = !hasGovInfo || !hasPoliticalInfo;

  const hasGov = family.hasGovRelatives === true;
  const hasPolitical = family.hasPoliticalPosts === true;
  const riskCount = Number(hasGov) + Number(hasPolitical);

  const riskLevel: FamilyRiskLevel = isPending
    ? 'pending'
    : riskCount === 0
      ? 'none'
      : riskCount === 1
        ? 'caution'
        : 'high';

  const riskSeverity =
    riskLevel === 'pending'
      ? 'info'
      : riskLevel === 'none'
        ? 'success'
        : riskLevel === 'caution'
          ? 'warning'
          : 'error';
  const riskTitle =
    riskLevel === 'pending'
      ? 'Evaluación pendiente'
      : riskLevel === 'none'
        ? 'Sin riesgo detectado'
        : riskLevel === 'caution'
          ? 'Precaución'
          : 'Alerta de riesgo';
  const riskMessage =
    riskLevel === 'pending'
      ? 'No hay información registrada sobre familiares en gobierno o policía.'
      : riskLevel === 'none'
        ? 'Sin exposición a riesgo político/gubernamental.'
        : riskLevel === 'caution'
          ? `El candidato tiene familiares en ${hasGov ? 'el Gobierno' : 'Cargos Políticos'}.`
          : 'El candidato tiene familiares en el gobierno y con cargos políticos.';

  const chartData: FamilyChartDatum[] = familyMembers
    .filter((member) => member.age !== null)
    .map((member, index) => {
      const label = member.relationship ?? member.name;
      return {
        uniqueKey: `${label}-${index}`,
        label,
        age: member.age as number,
        occupation: member.occupation,
        education: member.education,
      };
    });

  const chartDescription = `Gráfica de barras con la edad de cada familiar registrado: ${chartData
    .map((entry) => `${entry.label}, ${entry.age} años`)
    .join('; ')}.`;

  if (isEditing) {
    return (
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
              <GroupsOutlinedIcon fontSize="small" color="action" />
              <Typography variant="subtitle1">Preguntas de riesgo</Typography>
            </Stack>

            <Stack spacing={2.5}>
              <Box>
                <FormLabel id="has-gov-relatives-label">¿Tienes familiares en gobierno?</FormLabel>
                <Controller
                  name="hasGovRelatives"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      row
                      aria-labelledby="has-gov-relatives-label"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value === 'no') setValue('govRelativesDetails', '');
                      }}
                    >
                      <FormControlLabel value="yes" control={<Radio />} label="Sí" disabled={isSaving} />
                      <FormControlLabel value="no" control={<Radio />} label="No" disabled={isSaving} />
                    </RadioGroup>
                  )}
                />
                {hasGovValue === 'yes' && (
                  <TextField
                    label="¿Quién?"
                    fullWidth
                    disabled={isSaving}
                    {...register('govRelativesDetails')}
                    error={!!errors.govRelativesDetails}
                    helperText={errors.govRelativesDetails?.message}
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>

              <Box>
                <FormLabel id="has-political-posts-label">¿Ha ocupado cargos políticos?</FormLabel>
                <Controller
                  name="hasPoliticalPosts"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      row
                      aria-labelledby="has-political-posts-label"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value === 'no') setValue('politicalPostsDetails', '');
                      }}
                    >
                      <FormControlLabel value="yes" control={<Radio />} label="Sí" disabled={isSaving} />
                      <FormControlLabel value="no" control={<Radio />} label="No" disabled={isSaving} />
                    </RadioGroup>
                  )}
                />
                {hasPoliticalValue === 'yes' && (
                  <TextField
                    label="¿Cuál?"
                    fullWidth
                    disabled={isSaving}
                    {...register('politicalPostsDetails')}
                    error={!!errors.politicalPostsDetails}
                    helperText={errors.politicalPostsDetails?.message}
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <GroupsOutlinedIcon fontSize="small" color="action" />
                <Typography variant="subtitle1">Estructura familiar</Typography>
              </Stack>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddCircleOutlinedIcon fontSize="small" />}
                disabled={isSaving}
                onClick={() => append(EMPTY_MEMBER)}
              >
                Agregar integrante
              </Button>
            </Stack>

            <Stack spacing={2}>
              {fields.map((field, index) => (
                <Paper key={field.id} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative' }}>
                  <IconButton
                    size="small"
                    aria-label="Eliminar integrante"
                    disabled={isSaving}
                    onClick={() => remove(index)}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    <DeleteForeverOutlinedIcon fontSize="small" color="error" />
                  </IconButton>

                  <Grid container spacing={2} sx={{ pr: 4 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        label="Nombre"
                        fullWidth
                        disabled={isSaving}
                        {...register(`familyMembers.${index}.name`)}
                        error={!!errors.familyMembers?.[index]?.name}
                        helperText={errors.familyMembers?.[index]?.name?.message}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Controller
                        name={`familyMembers.${index}.relationship`}
                        control={control}
                        render={({ field: relationshipField }) => (
                          <TextField
                            {...relationshipField}
                            select
                            label="Parentesco"
                            fullWidth
                            disabled={isSaving}
                            error={!!errors.familyMembers?.[index]?.relationship}
                            helperText={errors.familyMembers?.[index]?.relationship?.message}
                          >
                            <MenuItem value="">
                              <em>Sin especificar</em>
                            </MenuItem>
                            {withCurrentValueOption(RELATIONSHIP_OPTIONS, relationshipField.value ?? '').map(
                              (option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ),
                            )}
                          </TextField>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        label="Edad"
                        fullWidth
                        disabled={isSaving}
                        {...register(`familyMembers.${index}.age`)}
                        error={!!errors.familyMembers?.[index]?.age}
                        helperText={errors.familyMembers?.[index]?.age?.message}
                        slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 3 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        label="Ocupación"
                        fullWidth
                        disabled={isSaving}
                        {...register(`familyMembers.${index}.occupation`)}
                        error={!!errors.familyMembers?.[index]?.occupation}
                        helperText={errors.familyMembers?.[index]?.occupation?.message}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Controller
                        name={`familyMembers.${index}.education`}
                        control={control}
                        render={({ field: educationField }) => (
                          <TextField
                            {...educationField}
                            select
                            label="Escolaridad"
                            fullWidth
                            disabled={isSaving}
                            error={!!errors.familyMembers?.[index]?.education}
                            helperText={errors.familyMembers?.[index]?.education?.message}
                          >
                            <MenuItem value="">
                              <em>Sin especificar</em>
                            </MenuItem>
                            {withCurrentValueOption(EDUCATION_OPTIONS, educationField.value ?? '').map((option) => (
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
                        name={`familyMembers.${index}.maritalStatus`}
                        control={control}
                        render={({ field: maritalField }) => (
                          <TextField
                            {...maritalField}
                            select
                            label="Estado Civil"
                            fullWidth
                            disabled={isSaving}
                            error={!!errors.familyMembers?.[index]?.maritalStatus}
                            helperText={errors.familyMembers?.[index]?.maritalStatus?.message}
                          >
                            <MenuItem value="">
                              <em>Sin especificar</em>
                            </MenuItem>
                            {withCurrentValueOption(MARITAL_STATUS_OPTIONS, maritalField.value ?? '').map((option) => (
                              <MenuItem key={option} value={option}>
                                {option}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              {fields.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No hay integrantes agregados. Usa "Agregar integrante" para capturar uno.
                </Typography>
              )}
            </Stack>
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
      <Alert severity={riskSeverity} variant="filled" sx={{ borderRadius: 3 }}>
        <AlertTitle sx={{ fontWeight: 700 }}>{riskTitle}</AlertTitle>
        {riskMessage}
        {hasGov && (
          <Typography variant="body2" sx={{ mt: 0.75 }}>
            <strong>Gobierno:</strong> {family.govRelativesDetails ?? 'No se especificaron detalles.'}
          </Typography>
        )}
        {hasPolitical && (
          <Typography variant="body2" sx={{ mt: hasGov ? 0.25 : 0.75 }}>
            <strong>Cargos políticos:</strong>{' '}
            {family.politicalPostsDetails ?? 'No se especificaron detalles.'}
          </Typography>
        )}
      </Alert>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <BarChartOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Edades y dependientes</Typography>
        </Stack>

        {chartData.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No hay edades registradas para graficar.
            </Typography>
          </Box>
        ) : (
          <Box>
            <VisuallyHidden>{chartDescription}</VisuallyHidden>
            <ResponsiveContainer width="100%" height={260} aria-hidden="true">
              <BarChart data={chartData} margin={{ left: 0, right: 16, top: 8 }}>
                <CartesianGrid vertical={false} stroke={theme.palette.divider} />
                <XAxis
                  dataKey="uniqueKey"
                  tickFormatter={(_, index) => chartData[index]?.label ?? ''}
                  tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={FamilyAgeTooltip} cursor={{ fill: theme.palette.action.hover }} />
                <Bar dataKey="age" name="Edad" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <GroupsOutlinedIcon fontSize="small" color="action" />
            <Typography variant="subtitle1">Estructura familiar</Typography>
          </Stack>
          {canEdit && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<EditOutlinedIcon fontSize="small" />}
              onClick={handleStartEditing}
            >
              Editar
            </Button>
          )}
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell scope="col">Nombre</TableCell>
                <TableCell scope="col">Parentesco</TableCell>
                <TableCell scope="col">Edad</TableCell>
                <TableCell scope="col">Ocupación</TableCell>
                <TableCell scope="col">Escolaridad</TableCell>
                <TableCell scope="col">Estado Civil</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {familyMembers.map((member, index) => (
                <TableRow key={`${member.name}-${index}`}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.relationship ?? NOT_SPECIFIED}</TableCell>
                  <TableCell>{member.age ?? NOT_SPECIFIED}</TableCell>
                  <TableCell>{member.occupation ?? NOT_SPECIFIED}</TableCell>
                  <TableCell>{member.education ?? NOT_SPECIFIED}</TableCell>
                  <TableCell>{member.maritalStatus ?? 'No registrado'}</TableCell>
                </TableRow>
              ))}

              {familyMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={FAMILY_TABLE_COLUMNS} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay integrantes de la familia registrados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}
