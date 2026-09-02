import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import { ClearableTextField } from '@/shared/components/ClearableTextField';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import {
  EVALUATION_SECTION_LABEL,
  type CandidateInterviewerIntegration,
  type SectionEvaluation,
} from '../types/candidate.types';

interface InterviewerIntegrationTabProps {
  candidateId: string;
  interviewerIntegration: CandidateInterviewerIntegration;
  evaluations: SectionEvaluation[];
}

/**
 * Bajado de 5000 a 1000 a pedido explícito del usuario: este es el campo
 * de "Comentarios Finales" (el comentario de la entrevista/evaluación),
 * candidato más plausible a alimentar `conclusion` en el reporte PDF
 * (CandidateReportTemplate → "Resumen Ejecutivo", tarjeta de ancho fijo
 * A3) — no hay forma de confirmar ese mapeo exacto desde este repo porque
 * lo arma el backend, pero un tope más bajo aquí protege el layout de
 * cualquier forma.
 */
const COMMENT_MAX_LENGTH = 1000;

/** Punto final si no lo trae ya — para que cada nota concatenada quede como una oración completa. */
function formatEvaluatorComment(rawComment: string): string {
  const trimmed = rawComment.trim();
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
}

/**
 * A partir de este límite de 1000 caracteres el usuario pidió explícitamente
 * que no se pueda escribir más allá del tope (no solo advertirlo después) —
 * por eso el campo abajo SÍ lleva `slotProps.htmlInput.maxLength` nativo,
 * a diferencia del diseño anterior con 5000. Esta validación en JS se
 * conserva de todas formas porque `maxLength` nativo no cubre el
 * auto-llenado/"Importar notas" (`handleImportNotes`), que concatena
 * comentarios de otras secciones por código y puede superar el tope sin
 * que el usuario haya tecleado nada.
 */
function validateComment(value: string): string | null {
  if (!value.trim()) return null; // vacío ya lo cubre el disabled de Guardar, no es un error de formato
  if (value.length > COMMENT_MAX_LENGTH) {
    return `El texto no debe exceder los ${COMMENT_MAX_LENGTH} caracteres para mantener el formato del reporte.`;
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
  evaluations,
}: InterviewerIntegrationTabProps) {
  const { upsertInterviewerIntegration } = useCandidateMutations();
  const [form, setForm] = useState<CandidateInterviewerIntegration>(interviewerIntegration);
  const [isSaving, setIsSaving] = useState(false);

  // INTERVIEWER_INTEGRATION se excluye a propósito: es la nota del propio
  // SectionGrader de esta pestaña, mostrarla/copiarla aquí sería circular.
  const sectionsWithNotes = evaluations.filter(
    (evaluation) => evaluation.section !== 'INTERVIEWER_INTEGRATION' && evaluation.comments?.trim(),
  );

  // Solo al montar Y solo si el reclutador todavía no escribió nada
  // propio — si `form.comment` ya trae texto (guardado antes, o escrito y
  // no guardado todavía), este efecto no lo toca; para traer notas nuevas
  // en ese caso existe el botón "Importar notas" (control manual del
  // usuario, ver handleImportNotes).
  useEffect(() => {
    if (form.comment.trim()) return;
    if (sectionsWithNotes.length === 0) return;

    const combined = sectionsWithNotes
      .map((evaluation) => formatEvaluatorComment(evaluation.comments as string))
      .join('\n');
    setForm({ comment: combined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commentError = validateComment(form.comment);

  function handleChange(value: string) {
    setForm({ comment: value });
  }

  /**
   * A diferencia del auto-llenado de montaje, este botón SIEMPRE
   * concatena al final lo que haya en las secciones — sin revisar si ya
   * está incluido. El usuario asume la responsabilidad de borrar texto
   * viejo/duplicado si vuelve a importar.
   */
  function handleImportNotes() {
    if (sectionsWithNotes.length === 0) return;

    const appended = sectionsWithNotes
      .map((evaluation) => formatEvaluatorComment(evaluation.comments as string))
      .join('\n');

    setForm((prev) => ({
      comment: prev.comment.trim() ? `${prev.comment}\n${appended}` : appended,
    }));
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
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
          flexWrap="wrap"
          gap={1}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <RateReviewOutlinedIcon fontSize="small" color="action" />
            <Typography variant="subtitle1">Comentarios Finales</Typography>
          </Stack>
          <Tooltip title="Importar notas actualizadas">
            <Button
              variant="text"
              size="small"
              startIcon={<SyncOutlinedIcon fontSize="small" />}
              onClick={handleImportNotes}
              disabled={sectionsWithNotes.length === 0}
            >
              Importar notas
            </Button>
          </Tooltip>
        </Stack>

        <Accordion variant="outlined" sx={{ mb: 2, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
            <Typography variant="body2">Ver notas de secciones anteriores</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {sectionsWithNotes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Todavía no hay notas registradas en otras secciones.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {sectionsWithNotes.map((evaluation) => (
                  <Grid key={evaluation.section} size={{ xs: 12, sm: 6, md: 4 }} sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {EVALUATION_SECTION_LABEL[evaluation.section]}
                    </Typography>
                    <Tooltip title={evaluation.comments}>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {evaluation.comments}
                      </Typography>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            )}
          </AccordionDetails>
        </Accordion>

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
          slotProps={{ htmlInput: { maxLength: COMMENT_MAX_LENGTH } }}
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
