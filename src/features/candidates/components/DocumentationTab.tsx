import { useState } from 'react';
import { Box, Button, Chip, Grid, Link, Paper, Stack, Typography } from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useToast } from '@/shared/context/ToastContext';
import { useGetEvidence } from '../hooks/useCandidateEvidence';
import { openEvidenceFile } from '../utils/openEvidenceFile';
import type { DocumentType, EvidencePhoto } from '../types/candidate.types';

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

/**
 * Los 5 documentos esperados del expediente, en el orden dado por el
 * usuario. El candidato es quien sube estos archivos en su registro (ver
 * la misma regla de negocio ya aplicada en HousingTab): el reclutador
 * solo visualiza, nunca sube/reemplaza/borra desde aquí.
 */
const DOCUMENT_DEFINITIONS: { type: DocumentType; label: string }[] = [
  { type: 'INE', label: 'INE' },
  { type: 'ACTA_NACIMIENTO', label: 'Acta de Nacimiento' },
  { type: 'COMPROBANTE_DOMICILIO', label: 'Comprobante de Domicilio' },
  { type: 'ANTECEDENTES_PENALES', label: 'Antecedentes Penales' },
  { type: 'COMPROBANTE_ESTUDIOS', label: 'Comprobante de Estudios' },
];

function DocumentCard({ label, evidence }: { label: string; evidence: EvidencePhoto | undefined }) {
  const { showToast } = useToast();
  const [isOpening, setIsOpening] = useState(false);

  async function handleOpen() {
    if (!evidence) return;
    setIsOpening(true);
    const ok = await openEvidenceFile(evidence.url);
    if (!ok) showToast('No se pudo abrir el documento.', 'error');
    setIsOpening(false);
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1,
        opacity: evidence ? 1 : 0.6,
      }}
    >
      <DescriptionOutlinedIcon color={evidence ? 'primary' : 'disabled'} fontSize="large" />
      <Typography variant="subtitle2" fontWeight={600}>
        {label}
      </Typography>
      {evidence ? (
        <Button size="small" variant="outlined" disabled={isOpening} onClick={handleOpen}>
          {isOpening ? 'Abriendo…' : 'Ver Documento'}
        </Button>
      ) : (
        <Chip size="small" label="Pendiente" color="warning" variant="outlined" />
      )}
    </Paper>
  );
}

export function DocumentationTab({ candidateId, driveUrl }: DocumentationTabProps) {
  const { data: evidenceList } = useGetEvidence(candidateId, 'DOCUMENT');

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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Documentos del expediente
        </Typography>
        <Grid container spacing={2}>
          {DOCUMENT_DEFINITIONS.map((def) => {
            const evidence = evidenceList?.find((item) => item.documentType === def.type);
            return (
              <Grid key={def.type} size={{ xs: 12, sm: 6, md: 4 }}>
                <DocumentCard label={def.label} evidence={evidence} />
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Stack>
  );
}
