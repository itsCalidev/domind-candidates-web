import { Button, Paper, Stack, Typography } from '@mui/material';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';

/**
 * Botones sin handlers reales todavía: navegarán a sus rutas
 * correspondientes cuando esos módulos existan (Candidatos, Usuarios,
 * Reportes). Hoy son visualmente funcionales pero no navegan.
 */
export function QuickActions() {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Acciones rápidas
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button
          variant="outlined"
          startIcon={<PersonAddAltOutlinedIcon />}
          sx={{ justifyContent: 'flex-start' }}
        >
          Nuevo candidato
        </Button>
        <Button
          variant="outlined"
          startIcon={<GroupAddOutlinedIcon />}
          sx={{ justifyContent: 'flex-start' }}
        >
          Nuevo usuario
        </Button>
        <Button
          variant="outlined"
          startIcon={<AssessmentOutlinedIcon />}
          sx={{ justifyContent: 'flex-start' }}
        >
          Ver reportes
        </Button>
      </Stack>
    </Paper>
  );
}
