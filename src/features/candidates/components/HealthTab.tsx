import { Alert, AlertTitle, Box, Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import AccessibilityNewOutlinedIcon from '@mui/icons-material/AccessibilityNewOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import SmokingRoomsOutlinedIcon from '@mui/icons-material/SmokingRoomsOutlined';
import MonitorWeightOutlinedIcon from '@mui/icons-material/MonitorWeightOutlined';
import OpacityOutlinedIcon from '@mui/icons-material/OpacityOutlined';
import type { ReactNode } from 'react';
import { RiskGlass } from './RiskGlass';
import { BmiGauge } from './BmiGauge';
import { computeHealthRisk } from '../utils/healthRisk';
import type { CandidateHealth } from '../types/candidate.types';

interface HealthTabProps {
  health: CandidateHealth;
}

const NOT_SPECIFIED = 'No especificado';

function formatBoolean(value: boolean | null): string {
  if (value === null) return NOT_SPECIFIED;
  return value ? 'Sí' : 'No';
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
            <InfoLine
              label="Detalle"
              value={health.chronicDiseasesDetails ?? 'No se especificaron detalles.'}
            />
          </SummaryCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard icon={<FactCheckOutlinedIcon fontSize="small" />} title="Historial médico">
            <InfoLine label="Enfermedades pasadas" value={health.pastDiseases ?? NOT_SPECIFIED} />
            <InfoLine label="Cirugías" value={health.surgeries ?? NOT_SPECIFIED} />
            <InfoLine label="Estado de salud actual" value={health.currentHealth ?? NOT_SPECIFIED} />
          </SummaryCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard icon={<AccessibilityNewOutlinedIcon fontSize="small" />} title="Aspecto físico">
            <InfoLine label="Aspecto físico" value={health.physicalAspect ?? NOT_SPECIFIED} />
            <InfoLine label="Usa lentes" value={formatBoolean(health.usesGlasses)} />
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
