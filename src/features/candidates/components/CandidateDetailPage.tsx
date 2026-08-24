import { useEffect, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
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
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import ContactsOutlinedIcon from '@mui/icons-material/ContactsOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate, useParams } from 'react-router-dom';
import { useCandidateDetail } from '../hooks/useCandidateDetail';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import { CandidateStatusChip } from './CandidateStatusChip';
import { GeneralInfoTab } from './GeneralInfoTab';
import { ComingSoonTab } from './ComingSoonTab';
import { DocumentationTab } from './DocumentationTab';
import { FamilyTab } from './FamilyTab';
import { HealthTab } from './HealthTab';
import { HousingTab } from './HousingTab';
import { EconomyTab } from './EconomyTab';
import { CandidateSubTabs, type SubTabDefinition } from './CandidateSubTabs';
import { SectionGrader } from './SectionGrader';
import { AssignRecruiterDialog } from './AssignRecruiterDialog';
import { UpdateCandidateStatusDialog } from './UpdateCandidateStatusDialog';
import {
  ALL_CANDIDATE_STATUSES,
  EXCEL_REPORT_STATUSES,
  RECRUITER_EDITABLE_STATUSES,
  REQUIRED_EVALUATION_SECTIONS,
  recruiterFullName,
  type EvaluationSection,
  type SectionEvaluation,
} from '../types/candidate.types';
import { paths } from '@/routes/paths';
import { downloadPdf } from '@/shared/utils/pdf';
import { downloadBlob } from '@/shared/utils/downloadBlob';
import { transformCandidateDetailForPdf } from '../services/candidateExport';
import { ExportButton } from '@/shared/components/ExportButton';
import { useAuth } from '@/features/auth/context/AuthContext';
import { hasFullAccess, UserRole } from '@/features/auth/types/role.enum';

/**
 * Estructura de navegación en 2 niveles: 3 pestañas principales, cada
 * una con sus propias sub-pestañas (ver CandidateSubTabs). Vive dentro
 * del componente (no a nivel de módulo, como el antiguo arreglo plano
 * `tabs`) porque el contenido de cada sub-tab necesita `candidate`.
 */
interface MainTabGroup {
  label: string;
  subTabs: SubTabDefinition[];
}

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { candidate, isLoading } = useCandidateDetail(id);
  const [activeMainTab, setActiveMainTab] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const { user } = useAuth();
  const canAssignRecruiter = hasFullAccess(user?.role);
  const { exportExcel } = useCandidateMutations();
  const [evaluations, setEvaluations] = useState<Partial<Record<EvaluationSection, SectionEvaluation>>>({});

  // Se sincroniza SOLO cuando cambia el candidato (navegar a otro id),
  // no en cada refetch/invalidación del mismo candidato: no hay forma
  // confirmada de que GET /candidates/:id devuelva `evaluations`
  // todavía (ver candidateService.ts), así que si dependiera de
  // `candidate.evaluations` un refetch después de guardar podría borrar
  // el progreso que SectionGrader acaba de reportar vía onSaved.
  useEffect(() => {
    if (!candidate) return;
    const map: Partial<Record<EvaluationSection, SectionEvaluation>> = {};
    for (const evaluation of candidate.evaluations) {
      map[evaluation.section] = evaluation;
    }
    setEvaluations(map);
  }, [candidate?.id]);

  function handleSectionSaved(evaluation: SectionEvaluation) {
    setEvaluations((prev) => ({ ...prev, [evaluation.section]: evaluation }));
  }

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

  // Máquina de estados del dictamen: un RECRUITER no puede marcar
  // Completo hasta calificar las 6 secciones, ni elegir Recomendable/No
  // recomendable hasta que el expediente ya esté Completo. SYSTEM/ADMIN
  // no tienen esta restricción (ALL_CANDIDATE_STATUSES, sin filtrar).
  const evaluatedSections = REQUIRED_EVALUATION_SECTIONS.filter((section) => evaluations[section]);
  const missingSectionsCount = REQUIRED_EVALUATION_SECTIONS.length - evaluatedSections.length;
  const allSectionsEvaluated = missingSectionsCount === 0;
  const recruiterStatusOptions = RECRUITER_EDITABLE_STATUSES.filter((status) => {
    if (status === 'COMPLETED') return allSectionsEvaluated;
    if (status === 'RECOMMENDED' || status === 'NOT_RECOMMENDED') return candidate.status === 'COMPLETED';
    return true;
  });
  const statusOptions = canAssignRecruiter ? ALL_CANDIDATE_STATUSES : recruiterStatusOptions;
  // Barra de progreso: solo tiene sentido para el reclutador asignado, y
  // solo mientras el dictamen no se haya emitido — una vez
  // Recomendable/No recomendable, calificar secciones ya no aplica.
  const showEvaluationProgress =
    !canAssignRecruiter && canChangeStatus && candidate.status !== 'RECOMMENDED' && candidate.status !== 'NOT_RECOMMENDED';
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

  /**
   * Cada sub-pestaña con datos reales lleva su SectionGrader al final
   * del contenido (ver requerimiento) — las 3 de "Comportamiento y
   * Trayectoria" no, porque no tienen EvaluationSection correspondiente
   * (son cascarones sin datos reales que calificar todavía).
   */
  function withGrader(section: EvaluationSection, content: ReactNode) {
    return (
      <Stack spacing={3}>
        {content}
        <SectionGrader
          candidateId={candidateId}
          section={section}
          initialEvaluation={evaluations[section] ?? null}
          onSaved={handleSectionSaved}
        />
      </Stack>
    );
  }

  const mainTabGroups: MainTabGroup[] = [
    {
      label: 'Identidad y Entorno',
      subTabs: [
        {
          label: 'Información General',
          content: withGrader('PERSONAL', <GeneralInfoTab info={candidate.generalInfo} />),
        },
        { label: 'Documentación', content: withGrader('IDENTITY', <DocumentationTab />) },
        {
          label: 'Estructura Familiar',
          content: withGrader(
            'FAMILY',
            <FamilyTab family={candidate.family} familyMembers={candidate.familyMembers} />,
          ),
        },
      ],
    },
    {
      label: 'Estabilidad y Calidad de Vida',
      subTabs: [
        { label: 'Estado de Salud', content: withGrader('HEALTH', <HealthTab health={candidate.health} />) },
        { label: 'Vivienda', content: withGrader('HOUSING', <HousingTab housing={candidate.housing} />) },
        {
          label: 'Economía Familiar',
          content: withGrader(
            'ECONOMY',
            <EconomyTab
              economy={candidate.economy}
              incomes={candidate.incomes}
              vehicles={candidate.vehicles}
              debts={candidate.debts}
              bankCards={candidate.bankCards}
            />,
          ),
        },
      ],
    },
    {
      label: 'Comportamiento y Trayectoria',
      subTabs: [
        {
          label: 'Antecedentes Laborales',
          content: (
            <ComingSoonTab
              sectionName="Antecedentes Laborales"
              icon={<WorkOutlineOutlinedIcon />}
            />
          ),
        },
        {
          label: 'Referencias Personales',
          content: (
            <ComingSoonTab sectionName="Referencias Personales" icon={<ContactsOutlinedIcon />} />
          ),
        },
        {
          label: 'Redes Sociales',
          content: <ComingSoonTab sectionName="Redes Sociales" icon={<ShareOutlinedIcon />} />,
        },
      ],
    },
  ];

  function handleMainTabChange(index: number) {
    setActiveMainTab(index);
    // Cada pestaña principal arranca en su primera sub-pestaña — evita
    // que, por ejemplo, "Comportamiento y Trayectoria" abra directo en
    // "Redes Sociales" solo porque esa fue la sub-pestaña 3 de la
    // pestaña anterior.
    setActiveSubTab(0);
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

      {showEvaluationProgress && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Progreso de evaluación por sección
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {evaluatedSections.length}/{REQUIRED_EVALUATION_SECTIONS.length}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(evaluatedSections.length / REQUIRED_EVALUATION_SECTIONS.length) * 100}
            color={allSectionsEvaluated ? 'success' : 'primary'}
            sx={{ height: 8, borderRadius: 4, mb: 0.75 }}
          />
          <Typography
            variant="caption"
            fontWeight={600}
            color={allSectionsEvaluated ? 'success.main' : 'text.secondary'}
          >
            {allSectionsEvaluated
              ? 'Todas las secciones evaluadas — ya puedes marcar el expediente como Completo.'
              : `Faltan ${missingSectionsCount} sección${missingSectionsCount === 1 ? '' : 'es'} por evaluar antes de poder completar el dictamen.`}
          </Typography>
        </Box>
      )}

      <Tabs
        value={activeMainTab}
        onChange={(_, value: number) => handleMainTabChange(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 1, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {mainTabGroups.map((group) => (
          <Tab key={group.label} label={group.label} sx={{ textTransform: 'none', fontWeight: 600 }} />
        ))}
      </Tabs>

      <CandidateSubTabs
        tabs={mainTabGroups[activeMainTab].subTabs}
        activeIndex={activeSubTab}
        onChange={setActiveSubTab}
      />

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
