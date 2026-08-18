import { Grid, Paper, Stack, Typography } from '@mui/material';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import type { CandidateHousing } from '../types/candidate.types';
import { ChipListField, DetailField } from './DetailField';

interface HousingTabProps {
  housing: CandidateHousing;
}

export function HousingTab({ housing }: HousingTabProps) {
  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <HomeWorkOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Vivienda</Typography>
        </Stack>
        <Grid container spacing={3}>
          <DetailField label="Propietario" value={housing.propertyOwner} />
          <DetailField label="Tiempo viviendo ahí" value={housing.timeLivingThere} />
          <DetailField label="Tipo de vivienda" value={housing.housingType} />
          <DetailField
            label="Domicilio anterior"
            value={housing.previousAddress}
            size={{ xs: 12, sm: 6, md: 8 }}
          />
          <DetailField
            label="Condiciones de la vivienda"
            value={housing.housingConditions}
            size={{ xs: 12, sm: 6, md: 8 }}
          />
          <ChipListField label="Servicios públicos" values={housing.publicServices} />
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Distribución de espacios
        </Typography>
        <Grid container spacing={3}>
          <DetailField label="Habitaciones" value={housing.roomsCount} size={{ xs: 6, sm: 4, md: 2 }} />
          <DetailField label="Salas" value={housing.livingRoomCount} size={{ xs: 6, sm: 4, md: 2 }} />
          <DetailField label="Comedores" value={housing.diningRoomCount} size={{ xs: 6, sm: 4, md: 2 }} />
          <DetailField label="Cocinas" value={housing.kitchenCount} size={{ xs: 6, sm: 4, md: 2 }} />
          <DetailField label="Baños" value={housing.bathroomsCount} size={{ xs: 6, sm: 4, md: 2 }} />
          <DetailField label="Patios" value={housing.patioCount} size={{ xs: 6, sm: 4, md: 2 }} />
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Infonavit
        </Typography>
        <Grid container spacing={3}>
          <DetailField label="Tiene deuda de Infonavit" value={housing.hasInfonavitDebt} />
          <DetailField label="Monto de la deuda" value={formatCurrency(housing.infonavitAmount)} />
          <DetailField label="Número de crédito" value={housing.infonavitCreditNumber} />
        </Grid>
      </Paper>
    </Stack>
  );
}
