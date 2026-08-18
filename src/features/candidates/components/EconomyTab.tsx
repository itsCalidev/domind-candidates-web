import {
  Box,
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
  useTheme,
} from '@mui/material';
import PieChartOutlineOutlinedIcon from '@mui/icons-material/PieChartOutlineOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { accentColors, brandColors } from '@/theme/palette';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { VisuallyHidden } from '@/shared/components/VisuallyHidden';
import type { BankCard, CandidateEconomy, Debt, Income, Vehicle } from '../types/candidate.types';
import { DetailField } from './DetailField';

interface EconomyTabProps {
  economy: CandidateEconomy;
  incomes: Income[];
  vehicles: Vehicle[];
  debts: Debt[];
  bankCards: BankCard[];
}

const EXPENSE_CATEGORIES: { key: keyof CandidateEconomy; label: string }[] = [
  { key: 'expensesFood', label: 'Alimentación' },
  { key: 'expensesLight', label: 'Luz' },
  { key: 'expensesGas', label: 'Gas' },
  { key: 'expensesPhone', label: 'Teléfono' },
  { key: 'expensesTransport', label: 'Transporte' },
  { key: 'expensesEducation', label: 'Educación' },
  { key: 'expensesMedical', label: 'Médico' },
  { key: 'expensesRentOther', label: 'Renta / Otros' },
  { key: 'expensesExtra', label: 'Extras' },
];

const EXPENSE_CHART_COLORS = [
  accentColors.skyBlue,
  accentColors.teal,
  accentColors.green,
  accentColors.yellow,
  accentColors.orange,
  accentColors.purple,
  brandColors.bluePrimary,
  brandColors.blueSecondary,
  '#B0BEC5',
];

function EmptyTableState({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 5 }}>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

export function EconomyTab({ economy, incomes, vehicles, debts, bankCards }: EconomyTabProps) {
  const theme = useTheme();

  const expenseData = EXPENSE_CATEGORIES.map((category, index) => ({
    name: category.label,
    value: (economy[category.key] as number | null) ?? 0,
    color: EXPENSE_CHART_COLORS[index],
  })).filter((entry) => entry.value > 0);

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = economy.expensesTotal;

  const comparisonData = [
    { label: 'Ingresos', value: totalIncome, color: theme.palette.success.main },
    { label: 'Egresos', value: totalExpenses ?? 0, color: theme.palette.error.main },
  ];

  // Recharts pinta todo en <svg>: un lector de pantalla no tiene nada que
  // leer ahí dentro. Este texto (ver <VisuallyHidden>, más abajo) es la
  // transcripción que sí puede anunciar.
  const expenseChartDescription = `Gráfica de dona que muestra el desglose de egresos mensuales por categoría, con un total de ${formatCurrency(
    expenseData.reduce((sum, entry) => sum + entry.value, 0),
  )}.`;
  const financialHealthDescription = `Gráfica de barras que compara el total de ingresos (${formatCurrency(totalIncome)}) contra el total de egresos (${formatCurrency(totalExpenses)}).`;

  const financialHealth =
    totalExpenses === null
      ? null
      : totalIncome >= totalExpenses
        ? { label: 'Superávit', amount: totalIncome - totalExpenses, color: 'success.main' as const }
        : { label: 'Déficit', amount: totalExpenses - totalIncome, color: 'error.main' as const };

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <RequestQuoteOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Egresos mensuales</Typography>
        </Stack>
        <Grid container spacing={3}>
          {EXPENSE_CATEGORIES.map((category) => (
            <DetailField
              key={category.key}
              label={category.label}
              value={formatCurrency(economy[category.key] as number | null)}
            />
          ))}
          <DetailField label="Total de egresos" value={formatCurrency(economy.expensesTotal)} />
          <DetailField label="Tiene otros ingresos" value={economy.hasOtherIncome} />
          <DetailField
            label="Detalle de otros ingresos"
            value={economy.otherIncomeDetails}
            size={{ xs: 12, sm: 6, md: 8 }}
          />
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
              <PieChartOutlineOutlinedIcon fontSize="small" color="action" />
              <Typography variant="subtitle1">Desglose de egresos</Typography>
            </Stack>

            {expenseData.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No hay egresos registrados para graficar.
                </Typography>
              </Box>
            ) : (
              <Box>
                <VisuallyHidden>{expenseChartDescription}</VisuallyHidden>
                <ResponsiveContainer width="100%" height={300} aria-hidden="true">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={2}
                    >
                      {expenseData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke={theme.palette.background.paper} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.primary,
                      }}
                      labelStyle={{ color: theme.palette.text.primary }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={48}
                      wrapperStyle={{ fontSize: 12, color: theme.palette.text.secondary }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
              <BarChartOutlinedIcon fontSize="small" color="action" />
              <Typography variant="subtitle1">Salud financiera</Typography>
            </Stack>

            <VisuallyHidden>{financialHealthDescription}</VisuallyHidden>
            <ResponsiveContainer width="100%" height={180} aria-hidden="true">
              <BarChart data={comparisonData} layout="vertical" margin={{ left: 16, right: 24 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={70}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: theme.palette.text.secondary }}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.primary,
                  }}
                  labelStyle={{ color: theme.palette.text.primary }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                  {comparisonData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <Stack spacing={0.5} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Ingresos totales: <strong>{formatCurrency(totalIncome)}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Egresos totales: <strong>{formatCurrency(totalExpenses)}</strong>
              </Typography>
              {financialHealth ? (
                <Typography variant="body2" fontWeight={600} color={financialHealth.color} sx={{ mt: 0.5 }}>
                  {financialHealth.label}: {formatCurrency(financialHealth.amount)}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  No hay egresos totales registrados para comparar.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
          <PaymentsOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Ingresos</Typography>
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell scope="col">Fuente</TableCell>
                <TableCell scope="col" align="right">Monto</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incomes.map((income, index) => (
                <TableRow key={`${income.source}-${index}`}>
                  <TableCell>{income.source}</TableCell>
                  <TableCell align="right">{formatCurrency(income.amount)}</TableCell>
                </TableRow>
              ))}
              {incomes.length === 0 && (
                <EmptyTableState colSpan={2} message="No hay ingresos registrados." />
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
              <DirectionsCarFilledOutlinedIcon fontSize="small" color="action" />
              <Typography variant="subtitle1">Vehículos</Typography>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell scope="col">Modelo</TableCell>
                    <TableCell scope="col" align="right">Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehicles.map((vehicle, index) => (
                    <TableRow key={`${vehicle.model}-${index}`}>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell align="right">{formatCurrency(vehicle.value)}</TableCell>
                    </TableRow>
                  ))}
                  {vehicles.length === 0 && (
                    <EmptyTableState colSpan={2} message="No hay vehículos registrados." />
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
              <CreditCardOutlinedIcon fontSize="small" color="action" />
              <Typography variant="subtitle1">Tarjetas bancarias</Typography>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell scope="col">Banco</TableCell>
                    <TableCell scope="col" align="right">Límite de crédito</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bankCards.map((card, index) => (
                    <TableRow key={`${card.bank}-${index}`}>
                      <TableCell>{card.bank}</TableCell>
                      <TableCell align="right">{formatCurrency(card.creditLimit)}</TableCell>
                    </TableRow>
                  ))}
                  {bankCards.length === 0 && (
                    <EmptyTableState colSpan={2} message="No hay tarjetas bancarias registradas." />
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Deudas
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell scope="col">Acreedor</TableCell>
                <TableCell scope="col" align="right">Monto</TableCell>
                <TableCell scope="col" align="right">Pago mensual</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {debts.map((debt, index) => (
                <TableRow key={`${debt.creditor}-${index}`}>
                  <TableCell>{debt.creditor}</TableCell>
                  <TableCell align="right">{formatCurrency(debt.amount)}</TableCell>
                  <TableCell align="right">{formatCurrency(debt.monthlyPayment)}</TableCell>
                </TableRow>
              ))}
              {debts.length === 0 && <EmptyTableState colSpan={3} message="No hay deudas registradas." />}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}
