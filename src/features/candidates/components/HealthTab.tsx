import { Alert, AlertTitle, Box, Chip, Grid, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import AccessibilityNewOutlinedIcon from '@mui/icons-material/AccessibilityNewOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import SmokingRoomsOutlinedIcon from '@mui/icons-material/SmokingRoomsOutlined';
import MonitorWeightOutlinedIcon from '@mui/icons-material/MonitorWeightOutlined';
import OpacityOutlinedIcon from '@mui/icons-material/OpacityOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import type { ReactNode } from 'react';
import { RiskGlass } from './RiskGlass';
import { BmiGauge } from './BmiGauge';
import { computeHealthRisk } from '../utils/healthRisk';
import {
  classifyCurrentHealth,
  classifyPhysicalAspect,
  isEmptyMedicalText,
  splitMedicalEntries,
} from '../utils/healthQualitative';
import type { CandidateHealth } from '../types/candidate.types';

interface HealthTabProps {
  health: CandidateHealth;
}

const NOT_SPECIFIED = 'No especificado';

function formatBoolean(value: boolean | null): string {
  if (value === null) return 'Sin registrar';
  return value ? 'Sí' : 'No';
}

/**
 * Estado vacío "que transmita salud" para pastDiseases/surgeries/
 * chronicDiseasesDetails cuando no hay nada que reportar — reemplaza el
 * antiguo texto plano "No especificado", que el cliente pidió sacar de
 * esta vista por completo.
 */
function CleanHistoryBadge({ label }: { label: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <HealthAndSafetyOutlinedIcon fontSize="small" color="success" />
      <Typography variant="body2" fontWeight={600} color="success.main">
        {label}
      </Typography>
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
                <CleanHistoryBadge label="Sin antecedentes" />
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
                <CleanHistoryBadge label="Historial limpio" />
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
                <CleanHistoryBadge label="Sin cirugías" />
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
              <Typography variant="body2" fontWeight={500}>
                {NOT_SPECIFIED}
              </Typography>
            ) : (
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {health.healthcareAccess.map((service) => (
                  <Chip key={service} label={service} size="small" variant="outlined" />
                ))}
              </Stack>
            )}
          </SummaryCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard icon={<DirectionsRunOutlinedIcon fontSize="small" />} title="Hábitos de vida">
            <InfoLine label="Calidad de la alimentación" value={health.dietQuality ?? NOT_SPECIFIED} />
            <InfoLine label="Actividad física" value={health.physicalActivity ?? NOT_SPECIFIED} />
            <InfoLine
              label="Horas sedentarias al día"
              value={health.sedentaryHours ?? NOT_SPECIFIED}
            />
            <InfoLine
              label="Horas de pantalla al día"
              value={health.screenTimeHours ?? NOT_SPECIFIED}
            />
          </SummaryCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard icon={<SmokingRoomsOutlinedIcon fontSize="small" />} title="Consumo de sustancias">
            <InfoLine label="Frecuencia de alcohol" value={health.alcoholFrequency ?? NOT_SPECIFIED} />
            {health.alcoholTypes.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {health.alcoholTypes.map((type) => (
                  <Chip key={type} label={type} size="small" variant="outlined" />
                ))}
              </Stack>
            )}
            <InfoLine label="Cigarros al día" value={health.cigarettesPerDay ?? NOT_SPECIFIED} />
            <InfoLine
              label="Gasto semanal en cigarros"
              value={health.smokingExpensePerWeek ?? NOT_SPECIFIED}
            />
            <InfoLine label="Detalle de uso de drogas" value={health.drugsDetails ?? NOT_SPECIFIED} />
          </SummaryCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
