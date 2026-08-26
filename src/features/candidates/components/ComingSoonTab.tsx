import { Box, Paper, Typography } from '@mui/material';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import type { ReactNode } from 'react';

interface ComingSoonTabProps {
  sectionName: string;
  /** Ícono representativo de la sección; construcción genérica por default. */
  icon?: ReactNode;
}

/**
 * Placeholder para las secciones del expediente que se construirán a
 * fondo más adelante. Se reutiliza tal cual para los 3 sub-tabs nuevos
 * de "Comportamiento y Trayectoria" (Antecedentes, Referencias, Redes
 * Sociales) — cada uno solo cambia el ícono, no la estructura.
 */
export function ComingSoonTab({ sectionName, icon = <ConstructionOutlinedIcon /> }: ComingSoonTabProps) {
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
        {icon}
      </Box>
      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
        {sectionName}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
        Módulo en construcción. Esta sección se habilitará en una fase
        posterior del expediente.
      </Typography>
    </Paper>
  );
}
