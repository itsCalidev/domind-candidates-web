import { Grid, Paper, Typography } from '@mui/material';
import type { CandidateGeneralInfo } from '../types/candidate.types';

interface GeneralInfoTabProps {
  info: CandidateGeneralInfo;
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

export function GeneralInfoTab({ info }: GeneralInfoTabProps) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      <Grid container spacing={3}>
        <Field label="Nombre completo" value={info.fullName} />
        <Field label="Puesto solicitado" value={info.positionApplied} />
        <Field label="Estado civil" value={info.civilStatus} />
        <Field label="Domicilio" value={info.address} />
        <Field label="Colonia" value={info.neighborhood} />
        <Field label="Código postal" value={info.postalCode} />
        <Field label="Teléfono" value={info.phone} />
        <Field label="Correo electrónico" value={info.email} />
        <Field label="Fecha de nacimiento" value={info.birthDate} />
        <Field label="Lugar de nacimiento" value={info.birthPlace} />
      </Grid>
    </Paper>
  );
}
