import {
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import type { CandidateFamily, FamilyMember } from '../types/candidate.types';
import { DetailField } from './DetailField';

const FAMILY_TABLE_COLUMNS = 5;

interface FamilyTabProps {
  family: CandidateFamily;
  familyMembers: FamilyMember[];
}

export function FamilyTab({ family, familyMembers }: FamilyTabProps) {
  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Grid container spacing={3}>
          <DetailField label="Familiares en el gobierno" value={family.hasGovRelatives} />
          <DetailField
            label="Detalle de familiares en el gobierno"
            value={family.govRelativesDetails}
            size={{ xs: 12, sm: 6, md: 8 }}
          />
          <DetailField label="Familiares con cargo político" value={family.hasPoliticalPosts} />
          <DetailField
            label="Detalle de cargo político"
            value={family.politicalPostsDetails}
            size={{ xs: 12, sm: 6, md: 8 }}
          />
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <GroupsOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Estructura familiar</Typography>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell scope="col">Nombre</TableCell>
                <TableCell scope="col">Parentesco</TableCell>
                <TableCell scope="col">Edad</TableCell>
                <TableCell scope="col">Ocupación</TableCell>
                <TableCell scope="col">Escolaridad</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {familyMembers.map((member, index) => (
                <TableRow key={`${member.name}-${index}`}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.relationship ?? 'No especificado'}</TableCell>
                  <TableCell>{member.age ?? 'No especificado'}</TableCell>
                  <TableCell>{member.occupation ?? 'No especificado'}</TableCell>
                  <TableCell>{member.education ?? 'No especificado'}</TableCell>
                </TableRow>
              ))}

              {familyMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={FAMILY_TABLE_COLUMNS} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay integrantes de la familia registrados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}
