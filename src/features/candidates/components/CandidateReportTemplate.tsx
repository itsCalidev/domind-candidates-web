import type { Ref } from 'react';
import { alpha, Box, Chip, Divider, Grid, Stack, ThemeProvider, Typography, useTheme } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { buildTheme } from '@/theme';
import { RATING_COLOR, RATING_OPTIONS } from './SectionGrader';
import {
  CANDIDATE_STATUS_COLOR,
  CANDIDATE_STATUS_LABEL,
  EVALUATION_SECTION_LABEL,
  RISK_LEVEL_COLOR,
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

/** A4 a 96dpi (210mm * 96/25.4) — html2canvas necesita dimensiones reales para rasterizar, y fija el punto de quiebre del texto. */
const REPORT_WIDTH_PX = 794;

function ReliabilityGauge({ score, riskLevel }: { score: number; riskLevel: ReportSummaryResponse['riskLevel'] }) {
  const theme = useTheme();
  // `stroke` es un atributo SVG plano (no `sx`), necesita el hex/rgb
  // real del tema — no resuelve rutas de tema tipo "success.main" como
  // string literal, a diferencia del prop `color` de un ícono de MUI.
  const colorKey = RISK_LEVEL_COLOR[riskLevel];
  const strokeColor = theme.palette[colorKey].main;
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <Stack alignItems="center" spacing={1}>
      <Box sx={{ position: 'relative', width: 140, height: 140 }}>
        <svg width={140} height={140} viewBox="0 0 140 140">
          <circle cx={70} cy={70} r={60} fill="none" stroke="#E0E0E0" strokeWidth={12} />
          <circle
            cx={70}
            cy={70}
            r={60}
            fill="none"
            stroke={strokeColor}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 60}
            strokeDashoffset={2 * Math.PI * 60 * (1 - clamped / 100)}
            transform="rotate(-90 70 70)"
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
          <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1 }}>
            {clamped}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            / 100
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" fontWeight={600} sx={{ color: strokeColor }}>
        Índice de Confiabilidad
      </Typography>
    </Stack>
  );
}

function FindingsList({
  title,
  items,
  icon: Icon,
  color,
  emptyLabel,
}: {
  title: string;
  items: string[];
  icon: typeof CheckCircleOutlinedIcon;
  color: string;
  emptyLabel: string;
}) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyLabel}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {items.map((item, index) => (
            <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
              <Icon fontSize="small" sx={{ color, mt: 0.25 }} />
              <Typography variant="body2">{item}</Typography>
            </Stack>
          ))}
        </Stack>
      )}
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
  return (
    <ThemeProvider theme={reportTheme}>
      <Box ref={ref} sx={{ width: REPORT_WIDTH_PX, bgcolor: '#ffffff', color: '#1A1A1A', p: 5 }}>
        {data && (
          <>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              sx={{ borderBottom: '3px solid #004A98', pb: 2, mb: 3 }}
            >
              <Box>
                <Typography variant="h4" sx={{ color: '#004A98' }}>
                  {data.firstName} {data.lastName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#706F6F' }}>
                  Folio {data.folio}
                </Typography>
                <Typography variant="body2" sx={{ color: '#706F6F' }}>
                  {data.positionName} — {data.companyName}
                </Typography>
              </Box>
              <Chip
                label={CANDIDATE_STATUS_LABEL[data.status]}
                sx={{
                  bgcolor: alpha(CANDIDATE_STATUS_COLOR[data.status], 0.1),
                  color: CANDIDATE_STATUS_COLOR[data.status],
                  fontWeight: 600,
                }}
              />
            </Stack>

            <Grid container spacing={4} sx={{ mb: 4 }}>
              <Grid size={8}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Resumen Ejecutivo
                </Typography>
                <Typography variant="body2">
                  {data.conclusion?.trim() || 'El evaluador aún no capturó una conclusión final.'}
                </Typography>
              </Grid>
              <Grid size={4}>
                <ReliabilityGauge score={data.reliabilityScore} riskLevel={data.riskLevel} />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Verificación de Apartados
            </Typography>
            <Grid container spacing={1} sx={{ mb: 3 }}>
              {data.sections.map((s) => {
                const option = RATING_OPTIONS.find((o) => o.value === s.rating);
                const Icon = option?.icon ?? CheckCircleOutlinedIcon;
                return (
                  <Grid key={s.section} size={6}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ p: 1, border: '1px solid #E0E0E0', borderRadius: 1 }}
                    >
                      <Icon fontSize="small" color={RATING_COLOR[s.rating]} />
                      <Typography variant="body2">{EVALUATION_SECTION_LABEL[s.section]}</Typography>
                    </Stack>
                  </Grid>
                );
              })}
            </Grid>

            <Divider sx={{ mb: 3 }} />

            <FindingsList
              title="Hallazgos Relevantes"
              items={data.relevantFindings}
              icon={CheckCircleOutlinedIcon}
              color="#2E7D32"
              emptyLabel="Sin hallazgos relevantes registrados."
            />

            <Divider sx={{ my: 3 }} />

            <FindingsList
              title="Áreas de Atención"
              items={data.attentionAreas}
              icon={WarningAmberOutlinedIcon}
              color="#ED6C02"
              emptyLabel="Sin áreas de atención registradas."
            />
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}
