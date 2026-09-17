import {
  Alert,
  AlertTitle,
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { VisuallyHidden } from '@/shared/components/VisuallyHidden';
import type { CandidateFamily, FamilyMember } from '../types/candidate.types';

const FAMILY_TABLE_COLUMNS = 5;
const NOT_SPECIFIED = 'No especificado';

interface FamilyTabProps {
  family: CandidateFamily;
  familyMembers: FamilyMember[];
}

interface FamilyChartDatum {
  /**
   * Clave única para el <XAxis dataKey>. Recharts indexa el payload del
   * Tooltip por el valor de esta clave — con `relationship` repetido
   * (dos "Hijo(a)"), varias barras comparten la misma categoría y el
   * tooltip mostraba siempre los datos de la PRIMERA que encontraba, sin
   * importar sobre cuál barra real estaba el cursor. El índice del
   * arreglo la vuelve única incluso si dos familiares tienen el mismo
   * parentesco Y el mismo nombre.
   */
  uniqueKey: string;
  /** Texto limpio para mostrar (eje y tooltip) — nunca `uniqueKey`, que lleva el índice pegado. */
  label: string;
  age: number;
  occupation: string | null;
  education: string | null;
}

/**
 * Tooltip a medida: el `payload` de Recharts trae por default solo el
 * valor graficado (`age`) — `payload[0].payload` es el ÚNICO camino para
 * llegar al resto del registro original (occupation/education), que es
 * justo lo que pidió el cliente mostrar al pasar el cursor. Lee el
 * nombre a mostrar desde `member.label` (no del `label` que Recharts
 * pasa por separado, que ahora es `uniqueKey` y no se ve limpio).
 *
 * Usa `sx` de MUI (no `contentStyle` con hex) porque al ser un
 * componente propio puede apoyarse en los tokens del theme directamente
 * — se ve bien en oscuro sin tener que resolver colores a mano.
 */
function FamilyAgeTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const member = payload[0].payload as FamilyChartDatum;

  return (
    <Paper
      elevation={4}
      sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', minWidth: 180 }}
    >
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {member.label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Edad: <strong>{member.age}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Ocupación: <strong>{member.occupation ?? NOT_SPECIFIED}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Escolaridad: <strong>{member.education ?? NOT_SPECIFIED}</strong>
      </Typography>
    </Paper>
  );
}

/**
 * 4 estados estrictos — antes `null` (sin capturar) se trataba igual que
 * `false` (sin riesgo confirmado), lo que producía un falso positivo
 * peligroso: un candidato sin ninguna información familiar registrada
 * mostraba el mismo banner verde "Sin riesgo" que uno con ambos campos
 * explícitamente en `false`. Ahora "sin datos" es su propio estado
 * neutral, nunca se colapsa a "sin riesgo".
 */
type FamilyRiskLevel = 'pending' | 'none' | 'caution' | 'high';

export function FamilyTab({ family, familyMembers }: FamilyTabProps) {
  const theme = useTheme();

  // Solo "sin riesgo" cuando AMBOS campos están explícitamente
  // capturados como `false` — si cualquiera de los dos sigue sin
  // responder (`null`/`undefined`), no hay evidencia suficiente para
  // afirmar que no hay exposición, así que el estado es "pendiente".
  const hasGovInfo = family.hasGovRelatives !== null && family.hasGovRelatives !== undefined;
  const hasPoliticalInfo = family.hasPoliticalPosts !== null && family.hasPoliticalPosts !== undefined;
  const isPending = !hasGovInfo || !hasPoliticalInfo;

  const hasGov = family.hasGovRelatives === true;
  const hasPolitical = family.hasPoliticalPosts === true;
  const riskCount = Number(hasGov) + Number(hasPolitical);

  const riskLevel: FamilyRiskLevel = isPending
    ? 'pending'
    : riskCount === 0
      ? 'none'
      : riskCount === 1
        ? 'caution'
        : 'high';

  const riskSeverity =
    riskLevel === 'pending'
      ? 'info'
      : riskLevel === 'none'
        ? 'success'
        : riskLevel === 'caution'
          ? 'warning'
          : 'error';
  const riskTitle =
    riskLevel === 'pending'
      ? 'Evaluación pendiente'
      : riskLevel === 'none'
        ? 'Sin riesgo detectado'
        : riskLevel === 'caution'
          ? 'Precaución'
          : 'Alerta de riesgo';
  const riskMessage =
    riskLevel === 'pending'
      ? 'No hay información registrada sobre familiares en gobierno o policía.'
      : riskLevel === 'none'
        ? 'Sin exposición a riesgo político/gubernamental.'
        : riskLevel === 'caution'
          ? `El candidato tiene familiares en ${hasGov ? 'el Gobierno' : 'Cargos Políticos'}.`
          : 'El candidato tiene familiares en el gobierno y con cargos políticos.';

  const chartData: FamilyChartDatum[] = familyMembers
    .filter((member) => member.age !== null)
    .map((member, index) => {
      const label = member.relationship ?? member.name;
      return {
        uniqueKey: `${label}-${index}`,
        label,
        age: member.age as number,
        occupation: member.occupation,
        education: member.education,
      };
    });

  const chartDescription = `Gráfica de barras con la edad de cada familiar registrado: ${chartData
    .map((entry) => `${entry.label}, ${entry.age} años`)
    .join('; ')}.`;

  return (
    <Stack spacing={3}>
      <Alert severity={riskSeverity} variant="filled" sx={{ borderRadius: 3 }}>
        <AlertTitle sx={{ fontWeight: 700 }}>{riskTitle}</AlertTitle>
        {riskMessage}
        {hasGov && (
          <Typography variant="body2" sx={{ mt: 0.75 }}>
            <strong>Gobierno:</strong> {family.govRelativesDetails ?? 'No se especificaron detalles.'}
          </Typography>
        )}
        {hasPolitical && (
          <Typography variant="body2" sx={{ mt: hasGov ? 0.25 : 0.75 }}>
            <strong>Cargos políticos:</strong>{' '}
            {family.politicalPostsDetails ?? 'No se especificaron detalles.'}
          </Typography>
        )}
      </Alert>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <BarChartOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Edades y dependientes</Typography>
        </Stack>

        {chartData.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No hay edades registradas para graficar.
            </Typography>
          </Box>
        ) : (
          <Box>
            <VisuallyHidden>{chartDescription}</VisuallyHidden>
            <ResponsiveContainer width="100%" height={260} aria-hidden="true">
              <BarChart data={chartData} margin={{ left: 0, right: 16, top: 8 }}>
                <CartesianGrid vertical={false} stroke={theme.palette.divider} />
                <XAxis
                  dataKey="uniqueKey"
                  tickFormatter={(_, index) => chartData[index]?.label ?? ''}
                  tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={FamilyAgeTooltip} cursor={{ fill: theme.palette.action.hover }} />
                <Bar dataKey="age" name="Edad" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
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
                  <TableCell>{member.relationship ?? NOT_SPECIFIED}</TableCell>
                  <TableCell>{member.age ?? NOT_SPECIFIED}</TableCell>
                  <TableCell>{member.occupation ?? NOT_SPECIFIED}</TableCell>
                  <TableCell>{member.education ?? NOT_SPECIFIED}</TableCell>
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
