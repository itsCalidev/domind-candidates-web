import { Alert, AlertTitle, Box, Chip, Grid, LinearProgress, Paper, Stack, Typography } from '@mui/material';
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
import type { ReactElement, ReactNode } from 'react';
import { RiskGlass } from './RiskGlass';
import { BmiGauge } from './BmiGauge';
import { computeHealthRisk } from '../utils/healthRisk';
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
import type { CandidateHealth } from '../types/candidate.types';

interface HealthTabProps {
  health: CandidateHealth;
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

export function HealthTab({ health }: HealthTabProps) {
  const { total, factors } = computeHealthRisk(health);
  const currentHealthMeter = classifyCurrentHealth(health.currentHealth);
  const physicalAspectSeverity = classifyPhysicalAspect(health.physicalAspect);
  const dietSeverity = classifyDietQuality(health.dietQuality);
  const physicalActivitySeverity = classifyPhysicalActivity(health.physicalActivity);
  const alcoholSeverity = classifyAlcoholFrequency(health.alcoholFrequency);
  const isNonSmoker = health.smokes !== true || !health.cigarettesPerDay;
  const hasNoDrugs = health.usedDrugs !== true;
  const hasNoAlcohol = isEmptyMedicalText(health.alcoholFrequency) && health.alcoholTypes.length === 0;
  const riskSeverity = total > 60 ? 'error' : total > 0 ? 'warning' : 'success';
  const riskTitle =
    riskSeverity === 'error'
      ? 'Riesgo de Salud Alto por Hábitos'
      : riskSeverity === 'warning'
        ? 'Riesgo moderado por hábitos'
        : 'Sin hábitos de riesgo detectados';
  const activeFactors = factors.filter((factor) => factor.active);

  return (
    <Stack spacing={3}>
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
                  {activeFactors.length > 0
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
            <BmiGauge weightKg={health.weight} heightM={health.height} />
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
                <CleanStateBadge label="Sin antecedentes" />
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
                <CleanStateBadge label="Historial limpio" />
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
                <CleanStateBadge label="Sin cirugías" />
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
              {hasNoAlcohol ? (
                <CleanStateBadge label="No consume alcohol" />
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
              {isNonSmoker ? (
                <CleanStateBadge label="No fuma" icon={SmokeFreeOutlinedIcon} />
              ) : (
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  <Chip
                    icon={<SmokingRoomsOutlinedIcon />}
                    label={`${health.cigarettesPerDay} cigarros/día`}
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
              {hasNoDrugs ? (
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
