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
  initialEvaluation: SectionEvaluation | null;
  /** CandidateDetailPage necesita enterarse del guardado para actualizar el progreso del dictamen. */
  onSaved: (evaluation: SectionEvaluation) => void;
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
export function SectionGrader({ candidateId, section, initialEvaluation, onSaved }: SectionGraderProps) {
  const { evaluateSection } = useCandidateMutations();
  const [rating, setRating] = useState<EvaluationRating | null>(initialEvaluation?.rating ?? null);
  const [comments, setComments] = useState(initialEvaluation?.comments ?? '');
  const [savedEvaluation, setSavedEvaluation] = useState<SectionEvaluation | null>(initialEvaluation);

  const isPending = evaluateSection.isPending;
  const hasUnsavedChanges =
    rating !== (savedEvaluation?.rating ?? null) || comments.trim() !== (savedEvaluation?.comments ?? '');

  async function handleSave() {
    if (!rating) return;
    const trimmedComments = comments.trim();
    try {
      await evaluateSection.mutateAsync({
        id: candidateId,
        section,
        rating,
        comments: trimmedComments || undefined,
      });
      const evaluation: SectionEvaluation = {
        section,
        rating,
        comments: trimmedComments || null,
      };
      setSavedEvaluation(evaluation);
      onSaved(evaluation);
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

        {savedEvaluation && !hasUnsavedChanges && (
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
        label="Notas del evaluador (opcional)"
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
          disabled={!rating || isPending || !hasUnsavedChanges}
          onClick={handleSave}
        >
          {isPending ? 'Guardando…' : 'Guardar calificación'}
        </Button>
      </Box>
    </Paper>
  );
}
