import { Button, Paper, Stack, Typography } from '@mui/material';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { Link } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/AuthContext';
import { hasFullAccess } from '@/features/auth/types/role.enum';

export function QuickActions() {
  const { user } = useAuth();
  const isFullAccess = hasFullAccess(user?.role);

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Acciones rápidas
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        
        {isFullAccess && (
          <Button
            component={Link}
            to="/users"
            variant="outlined"
            startIcon={<GroupAddOutlinedIcon />}
            sx={{ justifyContent: 'flex-start' }}
          >
            Nuevo usuario
          </Button>
        )}
        
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