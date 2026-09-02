import { useEffect, useState } from 'react';
import { Box, Skeleton, type SxProps, type Theme } from '@mui/material';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import { candidatesService } from '../services/candidateService';

interface SecureImageProps {
  /** Ruta relativa (ej. `/candidates/evidence/1A2B3C`), no una URL absoluta pública. */
  url: string;
  alt: string;
  sx?: SxProps<Theme>;
  onClick?: () => void;
}

/**
 * `url` requiere Authorization Bearer para responder — un `<img src>` plano
 * no puede mandar ese header, así que este componente pide el blob por su
 * cuenta (vía `candidatesService.getEvidenceImageBlob`, que ya usa
 * `apiClient` y por lo tanto ya inyecta el token) y arma un object URL para
 * el `<img>`. Lo revoca al desmontar o si `url` cambia, para no filtrar
 * memoria con blobs huérfanos. Reutilizado tal cual por la miniatura
 * (`object-fit: cover`) y el lightbox (`object-fit: contain`) — solo
 * cambia el `sx` que recibe.
 */
export function SecureImage({ url, alt, sx, onClick }: SecureImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;
    setObjectUrl(null);
    setFailed(false);

    candidatesService
      .getEvidenceImageBlob(url)
      .then((blob) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [url]);

  if (failed) {
    return (
      <Box sx={sx} display="flex" alignItems="center" justifyContent="center" bgcolor="action.hover">
        <BrokenImageOutlinedIcon color="disabled" />
      </Box>
    );
  }

  if (!objectUrl) {
    return <Skeleton variant="rectangular" sx={sx} />;
  }

  return <Box component="img" src={objectUrl} alt={alt} onClick={onClick} sx={sx} />;
}
