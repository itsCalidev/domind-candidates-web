import { useEffect, useState } from 'react';
import { candidatesMock } from '../services/candidates.mock';
import type { CandidateDetail } from '../types/candidate.types';

export function useCandidateDetail(id: string | undefined) {
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    candidatesMock.getById(id).then((data) => {
      setCandidate(data);
      setIsLoading(false);
    });
  }, [id]);

  return { candidate, isLoading };
}
