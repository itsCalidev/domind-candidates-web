import { useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { ClearableTextField } from '@/shared/components/ClearableTextField';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import type { CandidateInterviewerIntegration } from '../types/candidate.types';

interface InterviewerIntegrationTabProps {
  candidateId: string;
  interviewerIntegration: CandidateInterviewerIntegration;
}

const COMMENT_MAX_LENGTH = 5000;

/**
 * Sin `maxLength` nativo a propósito: un tope HTML truncaría el texto al
 * llegar a 5000 y el usuario nunca vería el error en tiempo real — en vez
 * de eso se deja escribir/pegar libremente y se valida en JS, igual que
 * `validateName`/`validatePhone` en ReferencesTab.
 */
function validateComment(value: string): string | null {
  if (!value.trim()) return null; // vacío ya lo cubre el disabled de Guardar, no es un error de formato
  if (value.length > COMMENT_MAX_LENGTH) {
    return `El comentario no puede superar los ${COMMENT_MAX_LENGTH} caracteres.`;
  }
  return null;
}

/**
 * Relación 1 a 1 igual que SocialNetworkTab: un solo campo en estado
 * local, sin `EditableEntry` ni casos de botón.
 */
export function InterviewerIntegrationTab({
  candidateId,
  interviewerIntegration,
}: InterviewerIntegrationTabProps) {
  const { upsertInterviewerIntegration } = useCandidateMutations();
  const [form, setForm] = useState<CandidateInterviewerIntegration>(interviewerIntegration);
  const [isSaving, setIsSaving] = useState(false);

  const commentError = validateComment(form.comment);

  function handleChange(value: string) {
    setForm({ comment: value });
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const saved = await upsertInterviewerIntegration.mutateAsync({
        id: candidateId,
        payload: { comment: form.comment },
      });
      setForm(saved);
    } catch {
      // El toast de error ya lo emite useCandidateMutations; el formulario
      // se queda con lo que el usuario escribió, para reintentar.
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <RateReviewOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Comentarios Finales</Typography>
        </Stack>

        <ClearableTextField
          label="Comentarios e integración del entrevistador"
          required
          fullWidth
          multiline
          minRows={10}
          maxRows={20}
          disabled={isSaving}
          value={form.comment}
          error={!!commentError}
          helperText={commentError ?? `${form.comment.length} / ${COMMENT_MAX_LENGTH} caracteres`}
          onChange={(e) => handleChange(e.target.value)}
          onClear={() => handleChange('')}
        />

        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="small"
            disabled={isSaving || !form.comment.trim() || !!commentError}
            onClick={handleSave}
          >
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Button>
        </Box>
      </Paper>
    </Stack>
  );
}
