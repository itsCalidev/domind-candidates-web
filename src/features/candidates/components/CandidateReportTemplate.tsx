import type { ReactNode, Ref } from 'react';
import { alpha, Box, Chip, Divider, Grid, Paper, Stack, ThemeProvider, Typography, useTheme } from '@mui/material';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import FamilyRestroomOutlinedIcon from '@mui/icons-material/FamilyRestroomOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { buildTheme } from '@/theme';
import { RATING_COLOR } from './SectionGrader';
import {
  CANDIDATE_STATUS_COLOR,
  CANDIDATE_STATUS_LABEL,
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
 * A3 horizontal a 96dpi (420mm * 96/25.4 ≈ 1587, 297mm * 96/25.4 ≈ 1123).
 * `minHeight`, no alto fijo: un alto fijo recorta textos largos (el
 * Resumen Ejecutivo en particular) porque html2canvas captura
 * exactamente el tamaño del contenedor — con minHeight + sin
 * `overflow: hidden`, el contenido puede crecer hacia abajo y el canvas
 * (y por lo tanto el PDF, ver useCandidateReportPdf.ts) crece con él.
 */
const REPORT_WIDTH_PX = 1587;
const REPORT_MIN_HEIGHT_PX = 1123;

interface ReportSectionRow {
  id: number;
  sourceKey: EvaluationSection;
  label: string;
  icon: typeof BadgeOutlinedIcon;
}

/**
 * Los 9 apartados originales del reporte, dados explícitamente por el
 * usuario en este orden y redacción exactos (revierte la expansión
 * temporal a 14 puntos comerciales de un turno anterior). `sourceKey`
 * corregido contra el union real de `EvaluationSection`
 * (`candidate.types.ts`): el usuario escribió 'PERSONAL_INFO' y
 * 'SOCIAL_NETWORKS', que no existen ahí — los valores reales son
 * 'PERSONAL' y 'SOCIAL_NETWORK'.
 */
const REPORT_SECTIONS: ReportSectionRow[] = [
  { id: 1, sourceKey: 'IDENTITY', label: '1. IDENTIDAD Y DOCUMENTACIÓN', icon: BadgeOutlinedIcon },
  { id: 2, sourceKey: 'PERSONAL', label: '2. CONSISTENCIA DE INFORMACIÓN', icon: PersonOutlineOutlinedIcon },
  { id: 3, sourceKey: 'WORK_HISTORY', label: '3. EXPERIENCIA Y TRAYECTORIA LABORAL', icon: WorkOutlineOutlinedIcon },
  { id: 4, sourceKey: 'REFERENCES', label: '4. REFERENCIAS LABORALES Y DESEMPEÑO', icon: AssignmentIndOutlinedIcon },
  { id: 5, sourceKey: 'ECONOMY', label: '5. INGRESOS Y CAPACIDAD FINANCIERA', icon: MonetizationOnOutlinedIcon },
  { id: 6, sourceKey: 'HOUSING', label: '6. DOMICILIO Y ENTORNO VECINAL', icon: HomeOutlinedIcon },
  { id: 7, sourceKey: 'FAMILY', label: '7. ESTRUCTURA FAMILIAR', icon: FamilyRestroomOutlinedIcon },
  { id: 8, sourceKey: 'HEALTH', label: '8. ESTILO DE VIDA Y SALUD', icon: FavoriteBorderOutlinedIcon },
  { id: 9, sourceKey: 'SOCIAL_NETWORK', label: '9. REDES SOCIALES Y PRESENCIA DIGITAL', icon: ShareOutlinedIcon },
];

function findSectionRating(sections: ReportSummaryResponse['sections'], sourceKey: EvaluationSection) {
  return sections.find((s) => s.section === sourceKey)?.rating ?? null;
}

/** Ícono de validación a la derecha de cada apartado — bandera roja (no el ícono "Report") para que combine con el bloque de Banderas Rojas. */
const RATING_ICON: Record<EvaluationRating, typeof CheckCircleOutlinedIcon> = {
  GREEN: CheckCircleOutlinedIcon,
  YELLOW: WarningAmberOutlinedIcon,
  RED: FlagOutlinedIcon,
};

interface ReliabilityTier {
  color: 'success' | 'warning' | 'error';
  label: 'BAJO' | 'MEDIO' | 'ALTO';
  message: string;
}

/**
 * Color, Chip y texto del Índice de Confiabilidad se calculan ESTRICTAMENTE
 * a partir de `reliabilityScore` (0-100) — `data.riskLevel` se ignora a
 * propósito por instrucción explícita del usuario, para que nunca vuelva a
 * pasar que un score de 90 se pinte de amarillo porque el veredicto crudo
 * del backend diga MEDIO. Rangos y textos dados exactos por el usuario.
 */
function getReliabilityTier(score: number): ReliabilityTier {
  if (score >= 80) {
    return {
      color: 'success',
      label: 'BAJO',
      message: 'El candidato muestra información consistente y sin hallazgos relevantes de riesgo.',
    };
  }
  if (score >= 60) {
    return {
      color: 'warning',
      label: 'MEDIO',
      message:
        'Se identificaron algunas inconsistencias o áreas de atención que requieren supervisión, aunque no son críticas.',
    };
  }
  return {
    color: 'error',
    label: 'ALTO',
    message: 'El perfil presenta banderas rojas o riesgos significativos que comprometen la viabilidad para la posición.',
  };
}

/**
 * Tarjeta corporativa reutilizada por cada bloque del dashboard — título
 * en mayúsculas vía `textTransform` manual (no variant="overline": ese
 * variant es demasiado tenue/pequeño para el contraste que pide el
 * usuario), borde y radio consistentes. Sin `height`/`maxHeight`/`overflow`:
 * el contenido interno es el que dicta la altura, a propósito (ver
 * REPORT_MIN_HEIGHT_PX).
 */
function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{
          color: '#0F2A4A',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          display: 'block',
          mb: 1,
        }}
      >
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function ReliabilityGauge({ score, color }: { score: number; color: ReliabilityTier['color'] }) {
  const theme = useTheme();
  // `stroke` es un atributo SVG plano (no `sx`), necesita el hex/rgb real
  // del tema — no resuelve rutas de tema tipo "success.main" como string
  // literal, a diferencia del prop `color` de un ícono/Chip de MUI. El
  // `color` que llega aquí ya viene calculado por rango desde
  // `getReliabilityTier(score)`, nunca de `riskLevel`.
  const strokeColor = theme.palette[color].main;
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <Box sx={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
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
  const reliabilityTier = data ? getReliabilityTier(data.reliabilityScore) : null;

  return (
    <ThemeProvider theme={reportTheme}>
      <Box
        ref={ref}
        sx={{
          width: REPORT_WIDTH_PX,
          minHeight: REPORT_MIN_HEIGHT_PX,
          bgcolor: '#ffffff',
          color: '#1A1A1A',
          p: 3,
        }}
      >
        {data && reliabilityTier && (
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
              <Grid size={6}>
                <SectionCard title="Resumen Ejecutivo">
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
                    {data.conclusion?.trim() || 'El evaluador aún no capturó una conclusión final.'}
                  </Typography>
                </SectionCard>
              </Grid>
              <Grid size={3}>
                <SectionCard title="Índice de Confiabilidad">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <ReliabilityGauge score={data.reliabilityScore} color={reliabilityTier.color} />
                    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={700} sx={{ color: '#706F6F' }}>
                        NIVEL DE RIESGO
                      </Typography>
                      <Box>
                        <Chip
                          size="small"
                          label={reliabilityTier.label}
                          color={reliabilityTier.color}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#37474F' }}>
                        {reliabilityTier.message}
                      </Typography>
                    </Stack>
                  </Stack>
                </SectionCard>
              </Grid>
              <Grid size={3}>
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
                    {REPORT_SECTIONS.map((item) => {
                      const rating = findSectionRating(data.sections, item.sourceKey);
                      const RatingIcon = rating ? RATING_ICON[rating] : null;
                      const SectionIcon = item.icon;
                      return (
                        <Stack
                          key={item.id}
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.5,
                                bgcolor: '#0F2A4A',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <SectionIcon sx={{ fontSize: 18, color: '#ffffff' }} />
                            </Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {item.label}
                            </Typography>
                          </Stack>
                          {RatingIcon && rating ? (
                            <RatingIcon fontSize="small" color={RATING_COLOR[rating]} />
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              Sin datos
                            </Typography>
                          )}
                        </Stack>
                      );
                    })}
                  </Stack>
                </SectionCard>
              </Grid>

              <Grid size={5}>
                <SectionCard title="Banderas Rojas">
                  {data.redFlags.length > 0 ? (
                    <Stack spacing={1}>
                      {data.redFlags.map((flag, index) => (
                        <Stack key={index} direction="row" alignItems="flex-start" spacing={1}>
                          <FlagOutlinedIcon fontSize="small" color="error" sx={{ mt: 0.25, flexShrink: 0 }} />
                          <Typography variant="body2">{flag}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
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
                  )}
                </SectionCard>
              </Grid>
            </Grid>

            {/* Bloque de firmas — separado con margen superior generoso del resto del contenido. */}
            <Box sx={{ mt: 20 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                <Box sx={{ width: '35%' }}>
                  <Divider sx={{ borderColor: 'text.primary', borderBottomWidth: 1, mb: 1 }} />
                  <Typography variant="body2" textAlign="center">
                    Nombre y firma del evaluador
                  </Typography>
                </Box>
                <Box sx={{ width: '35%' }}>
                  <Divider sx={{ borderColor: 'text.primary', borderBottomWidth: 1, mb: 1 }} />
                  <Typography variant="body2" textAlign="center">
                    Vo.Bo. del responsable
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}
