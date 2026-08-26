import { useState } from 'react';
import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import { ClearableTextField } from '@/shared/components/ClearableTextField';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import type { CandidateSocialNetwork } from '../types/candidate.types';

interface SocialNetworkTabProps {
  candidateId: string;
  socialNetwork: CandidateSocialNetwork;
}

/**
 * A diferencia de WorkHistoryTab/ReferencesTab, aquí no hay una lista de
 * tarjetas — es una relación 1 a 1 contra PUT /candidates/:id/social-network
 * (upsert), así que el formulario es un solo objeto en estado local, sin
 * `EditableEntry`/`localKey` ni casos de botón. Por limitación técnica
 * actual se omite la sección de Fotografías.
 */
export function SocialNetworkTab({ candidateId, socialNetwork }: SocialNetworkTabProps) {
  const { upsertSocialNetwork } = useCandidateMutations();
  const [form, setForm] = useState<CandidateSocialNetwork>(socialNetwork);
  const [isSaving, setIsSaving] = useState(false);

  function handleFieldChange(field: keyof CandidateSocialNetwork, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const saved = await upsertSocialNetwork.mutateAsync({
        id: candidateId,
        payload: {
          facebook: form.facebook,
          linkedin: form.linkedin,
          instagram: form.instagram,
          profileComments: form.profileComments,
        },
      });
      setForm(saved);
    } catch {
      // El toast de error ya lo emite useCandidateMutations; el formulario
      // se queda con lo que el usuario escribió, para reintentar.
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <ShareOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Redes Sociales</Typography>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <ClearableTextField
              label="Facebook"
              fullWidth
              disabled={isSaving}
              value={form.facebook}
              onChange={(e) => handleFieldChange('facebook', e.target.value)}
              onClear={() => handleFieldChange('facebook', '')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <ClearableTextField
              label="LinkedIn"
              fullWidth
              disabled={isSaving}
              value={form.linkedin}
              onChange={(e) => handleFieldChange('linkedin', e.target.value)}
              onClear={() => handleFieldChange('linkedin', '')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <ClearableTextField
              label="Instagram"
              fullWidth
              disabled={isSaving}
              value={form.instagram}
              onChange={(e) => handleFieldChange('instagram', e.target.value)}
              onClear={() => handleFieldChange('instagram', '')}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <ClearableTextField
              label="Perfil de Redes Sociales"
              fullWidth
              multiline
              minRows={4}
              disabled={isSaving}
              value={form.profileComments}
              onChange={(e) => handleFieldChange('profileComments', e.target.value)}
              onClear={() => handleFieldChange('profileComments', '')}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Button variant="contained" size="small" disabled={isSaving} onClick={handleSave}>
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Button>
        </Box>
      </Paper>
    </Stack>
  );
}
