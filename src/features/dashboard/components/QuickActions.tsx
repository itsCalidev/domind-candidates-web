import { Button, Paper, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';

/**
 * "Nuevo candidato" sigue sin navegar a propósito: no existe todavía un
 * formulario de registro de candidatos (fuera de alcance, no se
 * construye desde el frontend por ahora). "Nuevo usuario" y "Ver
 * candidatos" sí navegan, vía el componente Link de react-router-dom
 * pasado como `component` a Button (patrón estándar de MUI + RRD).
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
          component={Link}
          to="/users"
          variant="outlined"
          startIcon={<GroupAddOutlinedIcon />}
          sx={{ justifyContent: 'flex-start' }}
        >
          Nuevo usuario
        </Button>
        <Button
          component={Link}
          to="/candidates"
          variant="outlined"
          startIcon={<AssessmentOutlinedIcon />}
          sx={{ justifyContent: 'flex-start' }}
        >
          Ver candidatos
        </Button>
      </Stack>
    </Paper>
  );
}
