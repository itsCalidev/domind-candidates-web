import { Chip } from '@mui/material';
import {
  CANDIDATE_STATUS_COLOR,
  CANDIDATE_STATUS_LABEL,
  type CandidateStatus,
} from '../types/candidate.types';

interface CandidateStatusChipProps {
  status: CandidateStatus;
}

export function CandidateStatusChip({ status }: CandidateStatusChipProps) {
  const color = CANDIDATE_STATUS_COLOR[status];

  return (
    <Chip
      label={CANDIDATE_STATUS_LABEL[status]}
      size="small"
      sx={{
        bgcolor: `${color}1A`,
        color,
        fontWeight: 600,
        border: 'none',
      }}
    />
  );
}
