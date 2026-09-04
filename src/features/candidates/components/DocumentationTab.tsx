import { Box, Link, Paper, Stack, Typography } from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import { EvidenceGallery } from './EvidenceGallery';

interface DocumentationTabProps {
  candidateId: string;
  /**
   * No existe todavía un campo en el contrato de GET /candidates/:id
   * para esto (ver el comentario de `identity` en candidateService.ts:
   * tampoco hay endpoint que confirme ese bloque). Se deja como prop
   * opcional para no inventar el campo — hoy el llamador siempre pasa
   * `undefined`, y el componente ya sabe mostrar el enlace real en
   * cuanto el backend lo exponga, sin tener que tocar esta pieza.
   */
  driveUrl?: string | null;
}

export function DocumentationTab({ candidateId, driveUrl }: DocumentationTabProps) {
  return (
    <Stack spacing={3}>
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
          <FolderOutlinedIcon />
        </Box>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          Expediente de Documentación
        </Typography>
        {driveUrl ? (
          <Link href={driveUrl} target="_blank" rel="noopener noreferrer" sx={{ mt: 0.5 }}>
            Abrir en Google Drive
          </Link>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
            Enlace no disponible
          </Typography>
        )}
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <EvidenceGallery candidateId={candidateId} category="DOCUMENT" />
      </Paper>
    </Stack>
  );
}
