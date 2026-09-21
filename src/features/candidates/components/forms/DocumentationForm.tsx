import { useRef, useState, type ChangeEvent } from 'react';
import { Box, Button, Chip, CircularProgress, Grid, Paper, Stack, Typography } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useToast } from '@/shared/context/ToastContext';
import { useCandidateMutations } from '../../hooks/useCandidateMutations';
import { useGetEvidence } from '../../hooks/useCandidateEvidence';
import { openEvidenceFile } from '../../utils/openEvidenceFile';
import type { CandidateCaptureMode, CandidateCaptureStatus, DocumentType, EvidencePhoto } from '../../types/candidate.types';
import { DOCUMENT_DEFINITIONS } from '../../utils/documentCatalog';

/**
 * Único formulario de "Documentación" — compartido entre DocumentationTab
 * (panel admin, `mode="admin"`) y el paso correspondiente del Wizard de
 * Autollenado (`mode="candidate"`). A diferencia del resto de la familia
 * de formularios, no hay `useForm`/Zod ni un botón "Guardar": cada
 * documento se sube/reemplaza de inmediato al elegir el archivo (mismo
 * criterio que ya tenía DocumentationTab), así que `mode="candidate"`
 * solo agrega un botón "Guardar y Continuar" que avanza el Wizard —
 * nunca dispara una petición, porque no hay nada pendiente que enviar.
 */
type DocumentationFormProps =
  | {
      mode: 'admin';
      candidateId: string;
      captureMode: CandidateCaptureMode;
      captureStatus: CandidateCaptureStatus;
    }
  | {
      mode: 'candidate';
      candidateId: string;
      /** Avisa al Wizard que este paso se completó — desbloquea el siguiente. */
      onSaved: () => void;
    };

const PDF_MAX_BYTES = 1048576; // 1MB — límite exacto dado por el usuario
const ACCEPTED_FILE_TYPES = 'application/pdf';

/**
 * El atributo `accept` del input es solo una sugerencia del navegador —
 * esta es la validación real, la única que decide si se dispara la
 * mutación. Regla estricta: para `category === 'DOCUMENT'` el backend
 * solo acepta PDF.
 */
function validateDocumentFile(file: File): string | null {
  if (file.type !== 'application/pdf') {
    return 'Solo se aceptan archivos PDF.';
  }
  if (file.size > PDF_MAX_BYTES) {
    return `El PDF no debe superar ${PDF_MAX_BYTES / 1024}KB.`;
  }
  return null;
}

function DocumentCard({
  label,
  type,
  evidence,
  isEditing,
  isBusy,
  disabled,
  onPickFile,
}: {
  label: string;
  type: DocumentType;
  evidence: EvidencePhoto | undefined;
  isEditing: boolean;
  isBusy: boolean;
  disabled: boolean;
  onPickFile: (type: DocumentType) => void;
}) {
  const { showToast } = useToast();
  const [isOpening, setIsOpening] = useState(false);

  async function handleOpen() {
    if (!evidence) return;
    setIsOpening(true);
    const ok = await openEvidenceFile(evidence.url);
    if (!ok) showToast('No se pudo abrir el documento.', 'error');
    setIsOpening(false);
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1,
        opacity: evidence ? 1 : 0.6,
        position: 'relative',
      }}
    >
      <DescriptionOutlinedIcon color={evidence ? 'primary' : 'disabled'} fontSize="large" />
      <Typography variant="subtitle2" fontWeight={600}>
        {label}
      </Typography>

      {evidence ? (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" disabled={isOpening} onClick={handleOpen}>
            {isOpening ? 'Abriendo…' : 'Ver Documento'}
          </Button>
          {isEditing && (
            <Button size="small" variant="text" disabled={disabled} onClick={() => onPickFile(type)}>
              Reemplazar
            </Button>
          )}
        </Stack>
      ) : isEditing ? (
        <Button size="small" variant="contained" disabled={disabled} onClick={() => onPickFile(type)}>
          Subir
        </Button>
      ) : (
        <Chip size="small" label="Pendiente" color="warning" variant="outlined" />
      )}

      {isBusy && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.75)',
            borderRadius: 3,
          }}
        >
          <CircularProgress size={28} />
        </Box>
      )}
    </Paper>
  );
}

export function DocumentationForm(props: DocumentationFormProps) {
  const { candidateId } = props;
  const { showToast } = useToast();
  const { uploadEvidence, updateEvidence } = useCandidateMutations();
  const { data: evidenceList } = useGetEvidence(candidateId, 'DOCUMENT');
  const [isEditing, setIsEditing] = useState(false);
  const [pendingType, setPendingType] = useState<DocumentType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMutating = uploadEvidence.isPending || updateEvidence.isPending;
  // En modo candidato la subida siempre está activa — no hay una vista
  // de "solo lectura" previa que alternar, el Wizard ya es el modo edición.
  const canUpload = props.mode === 'candidate' || isEditing;

  function handlePickFile(type: DocumentType) {
    setPendingType(type);
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite re-seleccionar el mismo archivo si el usuario corrige y reintenta
    const type = pendingType;

    if (!file || !type) {
      setPendingType(null);
      return;
    }

    const error = validateDocumentFile(file);
    if (error) {
      showToast(error, 'error');
      setPendingType(null);
      return;
    }

    const existing = evidenceList?.find((item) => item.documentType === type);
    const onSettled = () => setPendingType(null);

    if (existing) {
      updateEvidence.mutate({ id: candidateId, evidenceId: existing.id, file }, { onSettled });
    } else {
      uploadEvidence.mutate({ id: candidateId, file, category: 'DOCUMENT', documentType: type }, { onSettled });
    }
  }

  const cards = (
    <Grid container spacing={2}>
      {DOCUMENT_DEFINITIONS.map((def) => {
        const evidence = evidenceList?.find((item) => item.documentType === def.type);
        return (
          <Grid key={def.type} size={{ xs: 12, sm: 6, md: 4 }}>
            <DocumentCard
              label={def.label}
              type={def.type}
              evidence={evidence}
              isEditing={canUpload}
              isBusy={pendingType === def.type && isMutating}
              disabled={isMutating}
              onPickFile={handlePickFile}
            />
          </Grid>
        );
      })}
    </Grid>
  );

  const fileInput = canUpload && (
    <input ref={fileInputRef} type="file" accept={ACCEPTED_FILE_TYPES} hidden onChange={handleFileChange} />
  );

  if (props.mode === 'candidate') {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Documentación
        </Typography>
        {fileInput}
        {cards}
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="contained" disabled={isMutating} onClick={props.onSaved}>
            Guardar y continuar
          </Button>
        </Stack>
      </Paper>
    );
  }

  const canEdit = props.captureMode === 'MANUAL' && props.captureStatus === 'DRAFT';

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Documentos del expediente
        </Typography>
        {canEdit && (
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<EditOutlinedIcon fontSize="small" />}
            onClick={() => setIsEditing((prev) => !prev)}
          >
            {isEditing ? 'Terminar edición' : 'Editar'}
          </Button>
        )}
      </Stack>

      {fileInput}
      {cards}
    </Paper>
  );
}
