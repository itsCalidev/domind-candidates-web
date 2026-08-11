import { useState, useEffect } from 'react';
import { candidatesService } from '../services/candidateService';
import type { CandidateDetail } from '../types/candidate.types';

export function useCandidateDetail(id: string | undefined) {
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    candidatesService
      .getById(id)
      .then((data) => {
        if (isMounted) {
          setCandidate(data);
        }
      })
      .catch((error) => {
        console.error('Error al obtener el detalle del candidato:', error);
        if (isMounted) {
          setCandidate(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { candidate, isLoading };
}