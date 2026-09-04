import { useRef, useState, type ChangeEvent } from 'react';
import { Box, CircularProgress, Dialog, DialogContent, IconButton, Stack, Typography } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useToast } from '@/shared/context/ToastContext';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import { useGetEvidence } from '../hooks/useCandidateEvidence';
import { candidatesService } from '../services/candidateService';
import type { EvidenceCategory, EvidencePhoto } from '../types/candidate.types';
import { SecureImage } from './SecureImage';

interface EvidenceGalleryProps {
  candidateId: string;
  category: EvidenceCategory;
}

const SLOT_COUNT = 3;
const SLOT_SIZE = 140;
const IMAGE_MAX_BYTES = 500 * 1024;
const PDF_MAX_BYTES = 1024 * 1024;

/**
 * Qué archivo se está por crear (slot vacío) o reemplazar (slot lleno) —
 * el mismo `<input type="file">` oculto sirve para ambos flujos, y
 * `handleFileChange` decide `uploadEvidence` vs `updateEvidence` según
 * esto.
 */
type PendingAction = { type: 'create'; slotIndex: number } | { type: 'replace'; evidenceId: string };

/**
 * `EvidencePhoto` no trae MIME type — se infiere por extensión. Si el
 * backend no garantiza una extensión real en `fileName`, esta heurística
 * dejaría de funcionar y habría que pedirle ese dato explícito.
 */
function isPdf(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.pdf');
}

function validateFile(file: File): string | null {
  if (file.type === 'application/pdf') {
    return file.size > PDF_MAX_BYTES ? `El PDF no debe superar los ${PDF_MAX_BYTES / 1024}KB.` : null;
  }
  if (file.type.startsWith('image/')) {
    return file.size > IMAGE_MAX_BYTES ? `La imagen no debe superar los ${IMAGE_MAX_BYTES / 1024}KB.` : null;
  }
  return 'Solo se aceptan imágenes o archivos PDF.';
}

/**
 * 3 slots cuadrados de evidencia (imagen o PDF) para una categoría dada —
 * sube/reemplaza/borra directo contra el backend por selección, sin
 * depender del botón "Guardar" del resto de cada formulario. Los slots se
 * derivan de `useGetEvidence(candidateId, category)`, no de estado local:
 * crear/editar/borrar invalida esa query y la cuadrícula se refresca sola.
 */
export function EvidenceGallery({ candidateId, category }: EvidenceGalleryProps) {
  const { showToast } = useToast();
  const { uploadEvidence, updateEvidence, deleteEvidence } = useCandidateMutations();
  const { data: evidenceList } = useGetEvidence(candidateId, category);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [selectedImage, setSelectedImage] = useState<EvidencePhoto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EvidencePhoto | null>(null);

  // Sin campo de posición/slot en EvidencePhoto: el índice del arreglo ES
  // el índice del slot (elemento 0 → slot 0, etc.), tal como lo describió
  // el usuario al dar este contrato.
  const slots: (EvidencePhoto | null)[] = Array.from(
    { length: SLOT_COUNT },
    (_, index) => evidenceList?.[index] ?? null,
  );

  async function handleOpenPdf(photo: EvidencePhoto) {
    try {
      const blob = await candidatesService.getEvidenceImageBlob(photo.url);
      window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
    } catch {
      showToast('No se pudo abrir el archivo.', 'error');
    }
  }

  function handleSlotClick(index: number, photo: EvidencePhoto | null) {
    if (!photo) {
      setPendingAction({ type: 'create', slotIndex: index });
      fileInputRef.current?.click();
      return;
    }
    if (isPdf(photo.fileName)) {
      handleOpenPdf(photo);
    } else {
      setSelectedImage(photo);
    }
  }

  function handleEditClick(photo: EvidencePhoto) {
    setPendingAction({ type: 'replace', evidenceId: photo.id });
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite re-seleccionar el mismo archivo si el usuario corrige y reintenta

    if (!file || !pendingAction) return;

    const error = validateFile(file);
    if (error) {
      showToast(error, 'error');
      return;
    }

    if (pendingAction.type === 'create') {
      uploadEvidence.mutate({ id: candidateId, file, category });
    } else {
      updateEvidence.mutate({ id: candidateId, evidenceId: pendingAction.evidenceId, file });
    }
  }

  function isSlotBusy(index: number, photo: EvidencePhoto | null): boolean {
    if (pendingAction?.type === 'create') {
      return pendingAction.slotIndex === index && uploadEvidence.isPending;
    }
    if (pendingAction?.type === 'replace' && photo) {
      return pendingAction.evidenceId === photo.id && updateEvidence.isPending;
    }
    return false;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Evidencias
      </Typography>

      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" hidden onChange={handleFileChange} />

      <Stack direction="row" spacing={2}>
        {slots.map((photo, index) => (
          <Box
            key={index}
            sx={{
              width: SLOT_SIZE,
              height: SLOT_SIZE,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: photo ? 'transparent' : 'action.hover',
              p: photo && isPdf(photo.fileName) ? 1 : 0,
            }}
            onClick={() => handleSlotClick(index, photo)}
          >
            {photo ? (
              isPdf(photo.fileName) ? (
                <Stack alignItems="center" spacing={0.5} sx={{ width: '100%' }}>
                  <PictureAsPdfOutlinedIcon color="error" fontSize="large" />
                  <Typography variant="caption" noWrap sx={{ maxWidth: '100%', textAlign: 'center' }}>
                    {photo.fileName}
                  </Typography>
                </Stack>
              ) : (
                <SecureImage
                  url={photo.url}
                  alt={photo.fileName}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )
            ) : (
              <AddPhotoAlternateOutlinedIcon color="action" fontSize="large" />
            )}

            {photo && (
              <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 4, right: 4 }}>
                <IconButton
                  size="small"
                  aria-label="Reemplazar evidencia"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleEditClick(photo);
                  }}
                  sx={{ bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#fff' } }}
                >
                  <EditOutlinedIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Eliminar evidencia"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteTarget(photo);
                  }}
                  sx={{ bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#fff' } }}
                >
                  <DeleteForeverOutlinedIcon sx={{ fontSize: 16, color: 'error.main' }} />
                </IconButton>
              </Stack>
            )}

            {isSlotBusy(index, photo) && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.4)',
                }}
              >
                <CircularProgress size={28} sx={{ color: '#fff' }} />
              </Box>
            )}
          </Box>
        ))}
      </Stack>

      <Dialog open={!!selectedImage} onClose={() => setSelectedImage(null)} maxWidth="lg">
        <IconButton
          onClick={() => setSelectedImage(null)}
          aria-label="Cerrar"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: '#fff',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
          }}
        >
          <CloseOutlinedIcon />
        </IconButton>
        <DialogContent
          sx={{ p: 0, bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {selectedImage && (
            <SecureImage
              url={selectedImage.url}
              alt={selectedImage.fileName}
              sx={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', display: 'block' }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar evidencia"
        description={
          deleteTarget
            ? `¿Confirmas que deseas eliminar "${deleteTarget.fileName}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        severity="error"
        loading={deleteEvidence.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteEvidence.mutate(
            { id: candidateId, evidenceId: deleteTarget.id },
            { onSuccess: () => setDeleteTarget(null) },
          );
        }}
      />
    </Box>
  );
}
