import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import type { EvaluationRating, EvaluationSection, SectionEvaluation } from '../types/candidate.types';

interface SectionGraderProps {
  candidateId: string;
  section: EvaluationSection;
  /**
   * Debe venir de useGetEvaluations (fuente única de verdad, no estado
   * local levantado en el padre) — así, tras un guardado exitoso, la
   * invalidación de esa query trae el valor fresco solo, sin que este
   * componente tenga que reportar nada hacia arriba.
   *
   * IMPORTANTE: quien renderiza <SectionGrader> debe pasarle
   * `key={section}` — sin eso, al cambiar de sub-pestaña React reutiliza
   * la misma instancia (mismo tipo, misma posición en el árbol) y el
   * rating/notas de la sección anterior se filtran a la nueva.
   */
  initialEvaluation: SectionEvaluation | null;
}

const RATING_OPTIONS: { value: EvaluationRating; label: string; icon: typeof CheckCircleOutlinedIcon }[] = [
  { value: 'GREEN', label: 'Sin riesgo', icon: CheckCircleOutlinedIcon },
  { value: 'YELLOW', label: 'Precaución', icon: WarningAmberOutlinedIcon },
  { value: 'RED', label: 'Riesgo alto', icon: ReportOutlinedIcon },
];

const RATING_COLOR: Record<EvaluationRating, 'success' | 'warning' | 'error'> = {
  GREEN: 'success',
  YELLOW: 'warning',
  RED: 'error',
};

/**
 * Widget al final de cada sub-pestaña con datos reales (ver
 * CandidateDetailPage, donde se compone junto al contenido de cada
 * sección) para que el reclutador califique esa sección explícitamente.
 * Llama a PUT /candidates/:id/evaluations/:section — contrato confirmado
 * por el usuario: `{ rating: 'GREEN'|'YELLOW'|'RED', comments?: string }`.
 */
export function SectionGrader({ candidateId, section, initialEvaluation }: SectionGraderProps) {
  const { evaluateSection } = useCandidateMutations();
  const [rating, setRating] = useState<EvaluationRating | null>(initialEvaluation?.rating ?? null);
  const [comments, setComments] = useState(initialEvaluation?.comments ?? '');

  const isPending = evaluateSection.isPending;
  const isAlreadyEvaluated = initialEvaluation !== null;
  // Comparado contra la prop (la última evaluación confirmada por el
  // servidor), no contra una copia en estado local: tras guardar, la
  // invalidación de useGetEvaluations trae un `initialEvaluation` nuevo
  // que coincide con lo recién guardado, así que esta comparación vuelve
  // a `false` sola — sin necesidad de que el componente se entere "a mano".
  const hasChanges =
    rating !== (initialEvaluation?.rating ?? null) || comments.trim() !== (initialEvaluation?.comments ?? '');

  async function handleSave() {
    if (!rating) return;
    try {
      await evaluateSection.mutateAsync({
        id: candidateId,
        section,
        rating,
        comments: comments.trim() || undefined,
      });
    } catch {
      // El toast de error ya lo emite useCandidateMutations.
    }
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <RateReviewOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Calificación del evaluador</Typography>
        </Stack>

        {isAlreadyEvaluated && !hasChanges && (
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ color: 'success.main' }}>
            <TaskAltOutlinedIcon fontSize="small" />
            <Typography variant="caption" fontWeight={600}>
              Sección evaluada
            </Typography>
          </Stack>
        )}
      </Stack>

      <ToggleButtonGroup
        value={rating}
        exclusive
        size="small"
        onChange={(_, value: EvaluationRating | null) => value && setRating(value)}
        sx={{ mb: 2, flexWrap: 'wrap' }}
      >
        {RATING_OPTIONS.map((option) => {
          const Icon = option.icon;
          const color = RATING_COLOR[option.value];
          return (
            <ToggleButton
              key={option.value}
              value={option.value}
              sx={{
                textTransform: 'none',
                gap: 0.75,
                px: 2,
                '&.Mui-selected': {
                  bgcolor: `${color}.main`,
                  color: `${color}.contrastText`,
                  '&:hover': { bgcolor: `${color}.dark` },
                },
              }}
            >
              <Icon fontSize="small" />
              {option.label}
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>

      <TextField
        label="Notas del evaluador *"
        placeholder="Observaciones sobre esta sección…"
        multiline
        minRows={2}
        fullWidth
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box>
        <Button
          variant="contained"
          size="small"
          disabled={!rating || isPending || !hasChanges || !comments.trim()}
          onClick={handleSave}
        >
          {isPending ? 'Guardando…' : isAlreadyEvaluated ? 'Actualizar calificación' : 'Guardar calificación'}
        </Button>
      </Box>
    </Paper>
  );
}
