import { Alert, AlertTitle, Box, Grid, Paper, Stack, Typography, alpha } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import WeekendOutlinedIcon from '@mui/icons-material/WeekendOutlined';
import TableRestaurantOutlinedIcon from '@mui/icons-material/TableRestaurantOutlined';
import KitchenOutlinedIcon from '@mui/icons-material/KitchenOutlined';
import YardOutlinedIcon from '@mui/icons-material/YardOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import ElectricBoltOutlinedIcon from '@mui/icons-material/ElectricBoltOutlined';
import WifiOutlinedIcon from '@mui/icons-material/WifiOutlined';
import PlumbingOutlinedIcon from '@mui/icons-material/PlumbingOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import type { ReactNode } from 'react';
import { CleanStateBadge } from '@/shared/components/CleanStateBadge';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { assessArraigo } from '../utils/housingArraigo';
import type { CandidateHousing } from '../types/candidate.types';

interface HousingTabProps {
  housing: CandidateHousing;
}

const NOT_SPECIFIED = 'No especificado';

/** Ícono + número grande + etiqueta — estilo "ficha Airbnb" para conteos de espacios. */
function PropertyStat({ icon, value, label }: { icon: ReactNode; value: number | null; label: string }) {
  return (
    <Stack alignItems="center" spacing={0.5} sx={{ textAlign: 'center' }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>
        {value ?? '—'}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

function OwnerFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box sx={{ color: 'action.active', display: 'flex' }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={500}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

/**
 * Coincidencia por palabra clave, no por igualdad exacta: publicServices
 * es texto libre del backend ("Agua potable", "Energía eléctrica"), no
 * un enum — mismo criterio que dietQuality/alcoholFrequency en
 * healthQualitative.ts.
 */
const PUBLIC_SERVICE_DEFINITIONS = [
  { label: 'Agua', icon: WaterDropOutlinedIcon, keywords: ['agua'] },
  { label: 'Luz', icon: ElectricBoltOutlinedIcon, keywords: ['luz', 'electric'] },
  { label: 'Internet', icon: WifiOutlinedIcon, keywords: ['internet', 'wifi'] },
  { label: 'Drenaje', icon: PlumbingOutlinedIcon, keywords: ['drenaje', 'alcantarillado'] },
];

function hasServiceKeyword(services: string[], keywords: string[]): boolean {
  return services.some((service) => keywords.some((keyword) => service.toLowerCase().includes(keyword)));
}

export function HousingTab({ housing }: HousingTabProps) {
  const arraigo = assessArraigo(housing.housingConditions, housing.hasInfonavitDebt);

  return (
    <Stack spacing={3}>
      <Alert severity={arraigo.severity} variant="filled" sx={{ borderRadius: 3 }}>
        <AlertTitle sx={{ fontWeight: 700 }}>{arraigo.title}</AlertTitle>
        {arraigo.message}
      </Alert>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <HomeOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Distribución de la propiedad</Typography>
        </Stack>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          {housing.housingType ?? 'Tipo de vivienda no especificado'}
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <PropertyStat icon={<BedOutlinedIcon />} value={housing.roomsCount} label="Habitaciones" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <PropertyStat icon={<BathtubOutlinedIcon />} value={housing.bathroomsCount} label="Baños" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <PropertyStat icon={<WeekendOutlinedIcon />} value={housing.livingRoomCount} label="Salas" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <PropertyStat icon={<TableRestaurantOutlinedIcon />} value={housing.diningRoomCount} label="Comedores" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <PropertyStat icon={<KitchenOutlinedIcon />} value={housing.kitchenCount} label="Cocinas" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <PropertyStat icon={<YardOutlinedIcon />} value={housing.patioCount} label="Patios" />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <OwnerFact
              icon={<HandshakeOutlinedIcon fontSize="small" />}
              label="Propietario"
              value={housing.propertyOwner ?? NOT_SPECIFIED}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <OwnerFact
              icon={<AccessTimeOutlinedIcon fontSize="small" />}
              label="Tiempo viviendo ahí"
              value={housing.timeLivingThere ?? NOT_SPECIFIED}
            />
          </Grid>
          {housing.previousAddress && (
            <Grid size={{ xs: 12, sm: 4 }}>
              <OwnerFact
                icon={<HomeOutlinedIcon fontSize="small" />}
                label="Domicilio anterior"
                value={housing.previousAddress}
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Servicios públicos
        </Typography>
        <Grid container spacing={2}>
          {PUBLIC_SERVICE_DEFINITIONS.map((service) => {
            const active = hasServiceKeyword(housing.publicServices, service.keywords);
            const Icon = service.icon;
            return (
              <Grid key={service.label} size={{ xs: 6, sm: 3 }}>
                <Stack
                  alignItems="center"
                  spacing={0.75}
                  sx={{
                    py: 2,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: active ? 'primary.main' : 'divider',
                    bgcolor: active ? (theme) => alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    opacity: active ? 1 : 0.5,
                  }}
                >
                  <Icon sx={{ fontSize: 30, color: active ? 'primary.main' : 'text.disabled' }} />
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color={active ? 'text.primary' : 'text.secondary'}
                  >
                    {service.label}
                  </Typography>
                </Stack>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {housing.hasInfonavitDebt === true ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'warning.main',
            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
            <RequestQuoteOutlinedIcon color="warning" fontSize="small" />
            <Typography variant="subtitle1">Deuda Infonavit / Hipotecaria</Typography>
          </Stack>
          <Typography variant="h4" fontWeight={700} color="warning.dark">
            {formatCurrency(housing.infonavitAmount)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Número de crédito: {housing.infonavitCreditNumber ?? NOT_SPECIFIED}
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
          <CleanStateBadge label="Sin deuda hipotecaria / Infonavit" />
        </Paper>
      )}
    </Stack>
  );
}
