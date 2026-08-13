import { useState } from 'react';
import { Box, Button, IconButton, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { useCandidateDetail } from '../hooks/useCandidateDetail';
import { CandidateStatusChip } from './CandidateStatusChip';
import { GeneralInfoTab } from './GeneralInfoTab';
import { ComingSoonTab } from './ComingSoonTab';
import { paths } from '@/routes/paths';
import { downloadPdf } from '@/shared/utils/pdf';
import { transformCandidateDetailForPdf } from '../services/candidateExport';

const tabs = [
  'Información General',
  'Documentación',
  'Estructura Familiar',
  'Estado de Salud',
  'Vivienda',
  'Economía Familiar',
] as const;

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { candidate, isLoading } = useCandidateDetail(id);
  const [activeTab, setActiveTab] = useState(0);

  if (isLoading) {
    return (
      <Box>
        <Skeleton width={220} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!candidate) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Candidato no encontrado
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Verifica el enlace o vuelve al listado de candidatos.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(paths.candidates)} size="small">
          <ArrowBackOutlinedIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" noWrap>
            {candidate.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {candidate.positionName} — {candidate.companyName}
          </Typography>
        </Box>
        <CandidateStatusChip status={candidate.status} />
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<PictureAsPdfOutlinedIcon fontSize="small" />}
          onClick={() =>
            downloadPdf(
              `candidate-${candidate.folio}-export.pdf`,
              'Información del candidato',
              transformCandidateDetailForPdf(candidate),
            )
          }
        >
          Exportar PDF
        </Button>
      </Stack>

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {tabs.map((label) => (
          <Tab key={label} label={label} sx={{ textTransform: 'none', fontWeight: 500 }} />
        ))}
      </Tabs>

      {activeTab === 0 && <GeneralInfoTab info={candidate.generalInfo} />}
      {activeTab > 0 && <ComingSoonTab sectionName={tabs[activeTab]} />}
    </Box>
  );
}
