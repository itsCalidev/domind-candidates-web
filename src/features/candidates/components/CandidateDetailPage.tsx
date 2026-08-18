import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate, useParams } from 'react-router-dom';
import { useCandidateDetail } from '../hooks/useCandidateDetail';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import { CandidateStatusChip } from './CandidateStatusChip';
import { GeneralInfoTab } from './GeneralInfoTab';
import { ComingSoonTab } from './ComingSoonTab';
import { FamilyTab } from './FamilyTab';
import { HealthTab } from './HealthTab';
import { HousingTab } from './HousingTab';
import { EconomyTab } from './EconomyTab';
import { AssignRecruiterDialog } from './AssignRecruiterDialog';
import { UpdateCandidateStatusDialog } from './UpdateCandidateStatusDialog';
import {
  ALL_CANDIDATE_STATUSES,
  EXCEL_REPORT_STATUSES,
  RECRUITER_EDITABLE_STATUSES,
  recruiterFullName,
} from '../types/candidate.types';
import { paths } from '@/routes/paths';
import { downloadPdf } from '@/shared/utils/pdf';
import { downloadBlob } from '@/shared/utils/downloadBlob';
import { transformCandidateDetailForPdf } from '../services/candidateExport';
import { ExportButton } from '@/shared/components/ExportButton';
import { useAuth } from '@/features/auth/context/AuthContext';
import { hasFullAccess, UserRole } from '@/features/auth/types/role.enum';

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
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const { user } = useAuth();
  const canAssignRecruiter = hasFullAccess(user?.role);
  const { exportExcel } = useCandidateMutations();

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

  // Cambiar estado: SYSTEM/ADMIN sobre cualquier candidato; RECRUITER
  // solo sobre el que tiene asignado — el flujo de negocio pedido es
  // "reclutador asignado → trabaja → cambia estado", no acceso abierto.
  const isAssignedToCurrentUser = candidate.assignedRecruiter?.id === user?.id;
  const canChangeStatus =
    canAssignRecruiter || (user?.role === UserRole.RECRUITER && isAssignedToCurrentUser);
  const statusOptions = canAssignRecruiter ? ALL_CANDIDATE_STATUSES : RECRUITER_EDITABLE_STATUSES;
  // El backend rechaza (400) asignar reclutador a un candidato archivado
  // y además lo desasigna automáticamente al archivarlo — la acción no
  // tiene sentido aquí, así que se deshabilita en vez de dejar que falle.
  const isArchived = candidate.status === 'ARCHIVED';
  const assignTooltip = isArchived ? 'No se puede asignar un candidato archivado' : '';

  // Regla de negocio: el reporte solo existe una vez que el expediente
  // "cerró" (ver EXCEL_REPORT_STATUSES) — antes de eso no hay nada
  // definitivo que exportar.
  const canDownloadReport = EXCEL_REPORT_STATUSES.includes(candidate.status);
  const isDownloadingReport = exportExcel.isPending;
  // Capturados como primitivos (no `candidate.id`/`candidate.folio`
  // directo dentro del closure de abajo): TS no conserva el
  // "candidate no es null" del guard de arriba dentro de una función
  // declarada más adelante en el mismo cuerpo del componente.
  const candidateId = candidate.id;
  const candidateFolio = candidate.folio;

  async function handleDownloadReport() {
    try {
      const blob = await exportExcel.mutateAsync(candidateId);
      downloadBlob(blob, `Reporte_${candidateFolio}.xlsx`);
    } catch {
      // El toast de error ya lo emite useCandidateMutations.
    }
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <IconButton
          onClick={() => navigate(paths.candidates)}
          size="small"
          aria-label="Volver al listado de candidatos"
        >
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
        {/* Reclutador asignado: visible para todos los roles; solo
            SYSTEM/ADMIN pueden abrir el diálogo para cambiarlo, y ni
            siquiera ellos si el candidato está archivado. */}
        <Tooltip title={assignTooltip} disableHoverListener={!isArchived}>
          <Chip
            icon={<AssignmentIndOutlinedIcon fontSize="small" />}
            label={recruiterFullName(candidate.assignedRecruiter)}
            variant="outlined"
            size="small"
            onClick={canAssignRecruiter && !isArchived ? () => setIsAssignOpen(true) : undefined}
            sx={{
              fontStyle: candidate.assignedRecruiter ? 'normal' : 'italic',
              color: candidate.assignedRecruiter ? 'text.primary' : 'text.disabled',
            }}
          />
        </Tooltip>
        {canAssignRecruiter && (
          <Tooltip title={assignTooltip} disableHoverListener={!isArchived}>
            <span>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<AssignmentIndOutlinedIcon fontSize="small" />}
                onClick={() => setIsAssignOpen(true)}
                disabled={isArchived}
              >
                {candidate.assignedRecruiter ? 'Cambiar reclutador' : 'Asignar reclutador'}
              </Button>
            </span>
          </Tooltip>
        )}
        <CandidateStatusChip status={candidate.status} />
        {canChangeStatus && (
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<SwapHorizOutlinedIcon fontSize="small" />}
            onClick={() => setIsStatusDialogOpen(true)}
          >
            Cambiar estado
          </Button>
        )}
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
        {canDownloadReport && (
          <ExportButton
            label="Descargar reporte"
            icon={
              isDownloadingReport ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <TableChartOutlinedIcon fontSize="small" />
              )
            }
            isExporting={isDownloadingReport}
            onExport={handleDownloadReport}
          />
        )}
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
      {activeTab === 1 && <ComingSoonTab sectionName={tabs[1]} />}
      {activeTab === 2 && (
        <FamilyTab family={candidate.family} familyMembers={candidate.familyMembers} />
      )}
      {activeTab === 3 && <HealthTab health={candidate.health} />}
      {activeTab === 4 && <HousingTab housing={candidate.housing} />}
      {activeTab === 5 && (
        <EconomyTab
          economy={candidate.economy}
          incomes={candidate.incomes}
          vehicles={candidate.vehicles}
          debts={candidate.debts}
          bankCards={candidate.bankCards}
        />
      )}

      <AssignRecruiterDialog
        open={isAssignOpen}
        candidate={candidate}
        onClose={() => setIsAssignOpen(false)}
      />

      <UpdateCandidateStatusDialog
        open={isStatusDialogOpen}
        candidate={candidate}
        availableStatuses={statusOptions}
        onClose={() => setIsStatusDialogOpen(false)}
      />
    </Box>
  );
}
