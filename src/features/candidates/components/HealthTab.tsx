import { Grid, Paper, Stack, Typography } from '@mui/material';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import LocalBarOutlinedIcon from '@mui/icons-material/LocalBarOutlined';
import type { CandidateHealth } from '../types/candidate.types';
import { ChipListField, DetailField } from './DetailField';

interface HealthTabProps {
  health: CandidateHealth;
}

export function HealthTab({ health }: HealthTabProps) {
  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <FavoriteBorderOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Salud general</Typography>
        </Stack>
        <Grid container spacing={3}>
          <DetailField label="Estatura (m)" value={health.height} />
          <DetailField label="Peso (kg)" value={health.weight} />
          <DetailField label="Usa lentes" value={health.usesGlasses} />
          <DetailField label="Aspecto físico" value={health.physicalAspect} />
          <DetailField
            label="Estado de salud actual"
            value={health.currentHealth}
            size={{ xs: 12, sm: 6, md: 8 }}
          />
          <DetailField
            label="Enfermedades pasadas"
            value={health.pastDiseases}
            size={{ xs: 12, sm: 6, md: 6 }}
          />
          <DetailField label="Cirugías" value={health.surgeries} size={{ xs: 12, sm: 6, md: 6 }} />
          <DetailField label="Enfermedades crónicas en la familia" value={health.chronicDiseasesFamily} />
          <DetailField
            label="Detalle de enfermedades crónicas"
            value={health.chronicDiseasesDetails}
            size={{ xs: 12, sm: 6, md: 8 }}
          />
          <ChipListField label="Acceso a servicios de salud" values={health.healthcareAccess} />
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <LocalBarOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Hábitos</Typography>
        </Stack>
        <Grid container spacing={3}>
          <DetailField label="Frecuencia de consumo de alcohol" value={health.alcoholFrequency} />
          <ChipListField label="Tipo de bebidas" values={health.alcoholTypes} />
          <DetailField label="Fuma" value={health.smokes} />
          <DetailField label="Cigarros al día" value={health.cigarettesPerDay} />
          <DetailField label="Gasto semanal en cigarros" value={health.smokingExpensePerWeek} />
          <DetailField label="Ha usado drogas" value={health.usedDrugs} />
          <DetailField
            label="Detalle de uso de drogas"
            value={health.drugsDetails}
            size={{ xs: 12, sm: 6, md: 8 }}
          />
        </Grid>
      </Paper>
    </Stack>
  );
}
