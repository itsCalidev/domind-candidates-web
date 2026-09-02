import { useRef, useState, type ChangeEvent } from 'react';
import { Box, CircularProgress, Dialog, DialogContent, IconButton, Stack, Typography } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { useToast } from '@/shared/context/ToastContext';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import { useGetEvidence } from '../hooks/useCandidateEvidence';
import type { EvidencePhoto } from '../types/candidate.types';
import { SecureImage } from './SecureImage';

interface EvidenceGalleryProps {
  candidateId: string;
}

const SLOT_COUNT = 3;
const SLOT_SIZE = 140;
const MAX_EVIDENCE_BYTES = 500 * 1024;

/**
 * 3 slots cuadrados de evidencia fotográfica para "Redes Sociales" — sube
 * directo al backend (POST /candidates/:id/evidence) por selección, sin
 * depender del botón "Guardar" del resto del formulario (facebook/
 * linkedin/instagram/profileComments van por otro PUT, ver
 * SocialNetworkTab). Los slots se derivan de `useGetEvidence`, no de
 * estado local: una subida exitosa invalida esa query (ver
 * useCandidateMutations.uploadEvidence) y la cuadrícula se refresca sola.
 */
export function EvidenceGallery({ candidateId }: EvidenceGalleryProps) {
  const { showToast } = useToast();
  const { uploadEvidence } = useCandidateMutations();
  const { data: evidenceList } = useGetEvidence(candidateId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSlotIndex, setPendingSlotIndex] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<EvidencePhoto | null>(null);

  // Sin campo de posición/slot en EvidencePhoto: el índice del arreglo ES
  // el índice del slot (elemento 0 → slot 0, etc.), tal como lo describió
  // el usuario al dar este contrato.
  const slots: (EvidencePhoto | null)[] = Array.from(
    { length: SLOT_COUNT },
    (_, index) => evidenceList?.[index] ?? null,
  );

  function handleSlotClick(index: number, photo: EvidencePhoto | null) {
    if (photo) {
      setSelectedImage(photo);
      return;
    }
    setPendingSlotIndex(index);
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite re-seleccionar el mismo archivo si el usuario corrige y reintenta

    if (!file || pendingSlotIndex === null) return;

    if (file.size > MAX_EVIDENCE_BYTES) {
      showToast(`La imagen no debe superar los ${MAX_EVIDENCE_BYTES / 1024}KB.`, 'error');
      return;
    }

    uploadEvidence.mutate({ id: candidateId, file, section: 'SOCIAL_NETWORK' });
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Evidencia fotográfica
      </Typography>

      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />

      <Stack direction="row" spacing={2}>
        {slots.map((photo, index) => (
          <Box
            key={index}
            onClick={() => handleSlotClick(index, photo)}
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
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: photo ? 'transparent' : 'action.hover',
            }}
          >
            {photo ? (
              <SecureImage
                url={photo.url}
                alt={photo.fileName}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <AddPhotoAlternateOutlinedIcon color="action" fontSize="large" />
            )}

            {uploadEvidence.isPending && pendingSlotIndex === index && (
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
    </Box>
  );
}
