import { Box, Paper, Typography } from '@mui/material';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';

interface ComingSoonTabProps {
  sectionName: string;
}

/**
 * Placeholder para las secciones del expediente que se construirán a
 * fondo más adelante (Documentación, Familia, Salud, Vivienda, Economía).
 * Mantiene el recorrido del detalle visualmente completo sin adelantar
 * formularios grandes que aún no corresponden a esta fase.
 */
export function ComingSoonTab({ sectionName }: ComingSoonTabProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 6,
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0,74,152,0.08)',
          color: 'primary.main',
          mb: 2,
        }}
      >
        <ConstructionOutlinedIcon />
      </Box>
      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
        {sectionName}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
        Esta sección se construirá cuando desarrollemos el expediente completo
        del candidato.
      </Typography>
    </Paper>
  );
}
