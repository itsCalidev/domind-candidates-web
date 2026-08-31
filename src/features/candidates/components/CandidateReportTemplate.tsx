import type { ReactNode, Ref } from 'react';
import { alpha, Box, Chip, Grid, Paper, Stack, ThemeProvider, Typography, useTheme } from '@mui/material';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import FamilyRestroomOutlinedIcon from '@mui/icons-material/FamilyRestroomOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import ContactsOutlinedIcon from '@mui/icons-material/ContactsOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { buildTheme } from '@/theme';
import { RATING_COLOR } from './SectionGrader';
import {
  CANDIDATE_STATUS_COLOR,
  CANDIDATE_STATUS_LABEL,
  RISK_LEVEL_COLOR,
  type EvaluationRating,
  type EvaluationSection,
  type ReportSummaryResponse,
} from '../types/candidate.types';

interface CandidateReportTemplateProps {
  data: ReportSummaryResponse | null;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Construido una sola vez, siempre en modo claro — el reporte no debe
 * verse distinto según si quien lo genera tiene el modo oscuro de
 * AccessibilityContext activado en su sesión; un documento descargado no
 * respeta preferencias de accesibilidad de pantalla.
 */
const reportTheme = buildTheme('light');

/**
 * A4 horizontal a 96dpi (297mm * 96/25.4 ≈ 1123, 210mm * 96/25.4 ≈ 794).
 * Alto FIJO (no minHeight): el reporte se diseña para caber en una sola
 * página — si el contenido creciera más allá de esto, html2canvas lo
 * recortaría en vez de estirar la página, así que el layout de abajo
 * debe mantenerse compacto.
 */
const REPORT_WIDTH_PX = 1123;
const REPORT_HEIGHT_PX = 794;

/**
 * Diccionario de mapeo comercial: el backend manda claves técnicas
 * (EvaluationSection) que nunca deben imprimirse crudas. El orden/número
 * de cada apartado y sus 3 anclas (Identidad=1, Ingresos=5,
 * Domicilio=6) fueron dados explícitamente; el resto de los números y
 * textos son mi propuesta para completar las 10 secciones — ajústalos
 * si el mockup real pide otro orden o redacción.
 */
const SECTION_REPORT_META: Record<EvaluationSection, { label: string; icon: typeof BadgeOutlinedIcon }> = {
  IDENTITY: { label: '1. Identidad', icon: BadgeOutlinedIcon },
  PERSONAL: { label: '2. Información Personal', icon: PersonOutlineOutlinedIcon },
  FAMILY: { label: '3. Estructura Familiar', icon: FamilyRestroomOutlinedIcon },
  HEALTH: { label: '4. Salud', icon: HealthAndSafetyOutlinedIcon },
  ECONOMY: { label: '5. Ingresos', icon: MonetizationOnOutlinedIcon },
  HOUSING: { label: '6. Domicilio', icon: HomeOutlinedIcon },
  WORK_HISTORY: { label: '7. Antecedentes Laborales', icon: WorkOutlineOutlinedIcon },
  REFERENCES: { label: '8. Referencias', icon: ContactsOutlinedIcon },
  SOCIAL_NETWORK: { label: '9. Redes Sociales', icon: ShareOutlinedIcon },
  INTERVIEWER_INTEGRATION: { label: '10. Comentarios Finales', icon: RateReviewOutlinedIcon },
};

/** Ícono de validación a la derecha de cada apartado — bandera roja (no el ícono "Report") para que combine con el bloque de Banderas Rojas. */
const RATING_ICON: Record<EvaluationRating, typeof CheckCircleOutlinedIcon> = {
  GREEN: CheckCircleOutlinedIcon,
  YELLOW: WarningAmberOutlinedIcon,
  RED: FlagOutlinedIcon,
};

/** Tarjeta corporativa reutilizada por cada bloque del dashboard — título en mayúsculas (variant="overline" ya lo hace), borde y radio consistentes. */
function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, height: '100%' }}>
      <Typography variant="overline" fontWeight={700} sx={{ color: '#37474F', display: 'block', mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function ReliabilityGauge({ score, riskLevel }: { score: number; riskLevel: ReportSummaryResponse['riskLevel'] }) {
  const theme = useTheme();
  // `stroke` es un atributo SVG plano (no `sx`), necesita el hex/rgb
  // real del tema — no resuelve rutas de tema tipo "success.main" como
  // string literal, a diferencia del prop `color` de un ícono de MUI.
  const colorKey = RISK_LEVEL_COLOR[riskLevel];
  const strokeColor = theme.palette[colorKey].main;
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <Stack alignItems="center" spacing={0.5}>
      <Box sx={{ position: 'relative', width: 110, height: 110 }}>
        <svg width={110} height={110} viewBox="0 0 110 110">
          <circle cx={55} cy={55} r={46} fill="none" stroke="#E0E0E0" strokeWidth={10} />
          <circle
            cx={55}
            cy={55}
            r={46}
            fill="none"
            stroke={strokeColor}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - clamped / 100)}
            transform="rotate(-90 55 55)"
          />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>
            {clamped}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            / 100
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}

/**
 * Hidden fuera de pantalla (ver el Box con position:fixed en
 * CandidateDetailPage) y rasterizado con html2canvas para producir el
 * PDF — ver useCandidateReportPdf.ts para la orquestación completa.
 * `data` puede ser null: el contenedor se monta siempre para tener un
 * ref estable, antes de que exista una respuesta.
 */
export function CandidateReportTemplate({ data, ref }: CandidateReportTemplateProps) {
  return (
    <ThemeProvider theme={reportTheme}>
      <Box
        ref={ref}
        sx={{
          width: REPORT_WIDTH_PX,
          height: REPORT_HEIGHT_PX,
          bgcolor: '#ffffff',
          color: '#1A1A1A',
          p: 3,
          overflow: 'hidden',
        }}
      >
        {data && (
          <>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              sx={{ borderBottom: '3px solid #004A98', pb: 1, mb: 2 }}
            >
              <Box>
                <Typography variant="h5" sx={{ color: '#004A98' }}>
                  {data.firstName} {data.lastName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#706F6F' }}>
                  Folio {data.folio} — {data.positionName} — {data.companyName}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={CANDIDATE_STATUS_LABEL[data.status]}
                sx={{
                  bgcolor: alpha(CANDIDATE_STATUS_COLOR[data.status], 0.1),
                  color: CANDIDATE_STATUS_COLOR[data.status],
                  fontWeight: 600,
                }}
              />
            </Stack>

            {/* Fila superior: Resumen Ejecutivo / Índice de Confiabilidad / Conclusión */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={5}>
                <SectionCard title="Resumen Ejecutivo">
                  <Typography variant="body2">
                    {data.conclusion?.trim() || 'El evaluador aún no capturó una conclusión final.'}
                  </Typography>
                </SectionCard>
              </Grid>
              <Grid size={3}>
                <SectionCard title="Índice de Confiabilidad">
                  <ReliabilityGauge score={data.reliabilityScore} riskLevel={data.riskLevel} />
                </SectionCard>
              </Grid>
              <Grid size={4}>
                <SectionCard title="Conclusión">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      textAlign: 'center',
                      bgcolor: alpha(CANDIDATE_STATUS_COLOR[data.status], 0.1),
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ color: CANDIDATE_STATUS_COLOR[data.status] }}
                    >
                      {CANDIDATE_STATUS_LABEL[data.status]}
                    </Typography>
                  </Box>
                </SectionCard>
              </Grid>
            </Grid>

            {/* Fila inferior: Verificación de Apartados / Banderas Rojas */}
            <Grid container spacing={2}>
              <Grid size={7}>
                <SectionCard title="Verificación de Apartados">
                  <Stack>
                    {data.sections.map((s) => {
                      const meta = SECTION_REPORT_META[s.section];
                      const SectionIcon = meta.icon;
                      const RatingIcon = RATING_ICON[s.rating];
                      return (
                        <Stack
                          key={s.section}
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1.25}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1,
                                bgcolor: '#37474F',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <SectionIcon sx={{ fontSize: 16, color: '#ffffff' }} />
                            </Box>
                            <Typography variant="body2">{meta.label}</Typography>
                          </Stack>
                          <RatingIcon fontSize="small" color={RATING_COLOR[s.rating]} />
                        </Stack>
                      );
                    })}
                  </Stack>
                </SectionCard>
              </Grid>

              <Grid size={5}>
                <SectionCard title="Banderas Rojas">
                  {/* Mockup temporal: la lógica híbrida (mitad sistema, mitad
                      evaluador) todavía no existe en el backend — placeholder
                      estático mientras se implementa. */}
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={1}
                    sx={{ p: 2, border: '1px dashed #E0E0E0', borderRadius: 1, minHeight: 100 }}
                  >
                    <FlagOutlinedIcon sx={{ color: '#BDBDBD' }} />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Sin banderas rojas registradas todavía.
                    </Typography>
                  </Stack>
                </SectionCard>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}
