import { useState, type ReactNode } from 'react';
import { Controller, useFieldArray, useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import PieChartOutlineOutlinedIcon from '@mui/icons-material/PieChartOutlineOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
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
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import type {
  BankCard,
  CandidateCaptureMode,
  CandidateCaptureStatus,
  CandidateEconomy,
  Debt,
  Income,
  OtherExpense,
  UpdateCandidateEconomyPayload,
  Vehicle,
} from '../types/candidate.types';
import { economyFormSchema, type EconomyFormValues } from '../types/economyForm.schema';
import { DetailField } from './DetailField';

interface EconomyTabProps {
  candidateId: string;
  economy: CandidateEconomy;
  incomes: Income[];
  vehicles: Vehicle[];
  debts: Debt[];
  bankCards: BankCard[];
  otherExpenses: OtherExpense[];
  captureMode: CandidateCaptureMode;
  captureStatus: CandidateCaptureStatus;
}

/** Decorador `$` para todos los inputs monetarios del formulario. */
const CURRENCY_ADORNMENT = <InputAdornment position="start">$</InputAdornment>;
const currencySlotProps = { input: { startAdornment: CURRENCY_ADORNMENT } };

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

/** Nombres del formulario para las 9 categorías de gasto, en el mismo orden que EXPENSE_CATEGORIES. */
const EXPENSE_FORM_FIELDS = [
  'expensesFood',
  'expensesLight',
  'expensesGas',
  'expensesPhone',
  'expensesTransport',
  'expensesEducation',
  'expensesMedical',
  'expensesRentOther',
  'expensesExtra',
] as const;

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

function toFormAmount(value: number): string {
  return String(value);
}

function toNumber(value: string | undefined): number {
  return value ? Number(value) : 0;
}

function buildEconomyFormDefaults(
  economy: CandidateEconomy,
  incomes: Income[],
  vehicles: Vehicle[],
  debts: Debt[],
  bankCards: BankCard[],
  otherExpenses: OtherExpense[],
): EconomyFormValues {
  return {
    expensesFood: economy.expensesFood === null ? '' : String(economy.expensesFood),
    expensesLight: economy.expensesLight === null ? '' : String(economy.expensesLight),
    expensesGas: economy.expensesGas === null ? '' : String(economy.expensesGas),
    expensesPhone: economy.expensesPhone === null ? '' : String(economy.expensesPhone),
    expensesTransport: economy.expensesTransport === null ? '' : String(economy.expensesTransport),
    expensesEducation: economy.expensesEducation === null ? '' : String(economy.expensesEducation),
    expensesMedical: economy.expensesMedical === null ? '' : String(economy.expensesMedical),
    expensesRentOther: economy.expensesRentOther === null ? '' : String(economy.expensesRentOther),
    expensesExtra: economy.expensesExtra === null ? '' : String(economy.expensesExtra),
    hasOtherExpenses: economy.hasOtherExpenses ? 'yes' : 'no',
    hasVehicles: economy.hasVehicles ? 'yes' : 'no',
    hasBankCards: economy.hasBankCards ? 'yes' : 'no',
    hasDebts: economy.hasDebts ? 'yes' : 'no',
    incomes: incomes.map((income) => ({ source: income.source, amount: toFormAmount(income.amount) })),
    vehicles: vehicles.map((vehicle) => ({ model: vehicle.model, value: toFormAmount(vehicle.value) })),
    debts: debts.map((debt) => ({
      creditor: debt.creditor,
      amount: toFormAmount(debt.amount),
      monthlyPayment: toFormAmount(debt.monthlyPayment),
    })),
    bankCards: bankCards.map((card) => ({ bank: card.bank, creditLimit: toFormAmount(card.creditLimit) })),
    otherExpenses: otherExpenses.map((expense) => ({
      concept: expense.concept,
      amount: toFormAmount(expense.amount),
    })),
  };
}

/**
 * Siempre construye el objeto completo, nunca un PATCH parcial: el
 * backend reemplaza los 4 arreglos por completo en cada guardado
 * (confirmado por el usuario), así que enviar solo lo "dirty" borraría
 * filas no tocadas en esta edición. `expensesTotal` se calcula aquí
 * mismo sumando las 9 categorías — el backend no lo calcula.
 */
function buildEconomyPayload(values: EconomyFormValues): UpdateCandidateEconomyPayload {
  const expensesFood = toNumber(values.expensesFood);
  const expensesLight = toNumber(values.expensesLight);
  const expensesGas = toNumber(values.expensesGas);
  const expensesPhone = toNumber(values.expensesPhone);
  const expensesTransport = toNumber(values.expensesTransport);
  const expensesEducation = toNumber(values.expensesEducation);
  const expensesMedical = toNumber(values.expensesMedical);
  const expensesRentOther = toNumber(values.expensesRentOther);
  const expensesExtra = toNumber(values.expensesExtra);

  return {
    expensesFood,
    expensesLight,
    expensesGas,
    expensesPhone,
    expensesTransport,
    expensesEducation,
    expensesMedical,
    expensesRentOther,
    expensesExtra,
    expensesTotal:
      expensesFood +
      expensesLight +
      expensesGas +
      expensesPhone +
      expensesTransport +
      expensesEducation +
      expensesMedical +
      expensesRentOther +
      expensesExtra,
    hasOtherExpenses: values.hasOtherExpenses === 'yes',
    hasVehicles: values.hasVehicles === 'yes',
    hasBankCards: values.hasBankCards === 'yes',
    hasDebts: values.hasDebts === 'yes',
    incomes: values.incomes.map((income) => ({ source: income.source, amount: toNumber(income.amount) })),
    vehicles:
      values.hasVehicles === 'yes'
        ? values.vehicles.map((vehicle) => ({ model: vehicle.model, value: toNumber(vehicle.value) }))
        : [],
    debts:
      values.hasDebts === 'yes'
        ? values.debts.map((debt) => ({
            creditor: debt.creditor,
            amount: toNumber(debt.amount),
            monthlyPayment: toNumber(debt.monthlyPayment),
          }))
        : [],
    bankCards:
      values.hasBankCards === 'yes'
        ? values.bankCards.map((card) => ({ bank: card.bank, creditLimit: toNumber(card.creditLimit) }))
        : [],
    otherExpenses:
      values.hasOtherExpenses === 'yes'
        ? values.otherExpenses.map((expense) => ({ concept: expense.concept, amount: toNumber(expense.amount) }))
        : [],
  };
}

/** Envoltura común de las 4 tablas dinámicas: título, botón "Agregar fila" y estado vacío — cada tabla solo aporta sus propias filas como children. */
/**
 * RadioGroup Sí/No compartido por Vehículos/Tarjetas/Deudas — al pasar a
 * "No" vacía el arreglo correspondiente de inmediato (mismo criterio que
 * `hasOtherExpenses` con `otherExpensesArray.replace([])`).
 */
function HasItemsToggle({
  labelId,
  question,
  name,
  control,
  disabled,
  onClear,
}: {
  labelId: string;
  question: string;
  name: 'hasVehicles' | 'hasBankCards' | 'hasDebts';
  control: Control<EconomyFormValues>;
  disabled: boolean;
  onClear: () => void;
}) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3 }}>
      <FormLabel id={labelId}>{question}</FormLabel>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <RadioGroup
            row
            aria-labelledby={labelId}
            value={field.value}
            onChange={(e) => {
              field.onChange(e.target.value);
              if (e.target.value === 'no') onClear();
            }}
          >
            <FormControlLabel value="yes" control={<Radio />} label="Sí" disabled={disabled} />
            <FormControlLabel value="no" control={<Radio />} label="No" disabled={disabled} />
          </RadioGroup>
        )}
      />
    </Paper>
  );
}

function DynamicListSection({
  icon,
  title,
  addLabel,
  onAdd,
  disabled,
  isEmpty,
  emptyMessage,
  children,
}: {
  icon: ReactNode;
  title: string;
  addLabel: string;
  onAdd: () => void;
  disabled: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          {icon}
          <Typography variant="subtitle1">{title}</Typography>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddCircleOutlinedIcon fontSize="small" />}
          disabled={disabled}
          onClick={onAdd}
        >
          {addLabel}
        </Button>
      </Stack>
      <Stack spacing={2}>
        {children}
        {isEmpty && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            {emptyMessage}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

export function EconomyTab({
  candidateId,
  economy,
  incomes,
  vehicles,
  debts,
  bankCards,
  otherExpenses,
  captureMode,
  captureStatus,
}: EconomyTabProps) {
  const theme = useTheme();
  const { updateEconomy } = useCandidateMutations();
  const [isEditing, setIsEditing] = useState(false);
  const isSaving = updateEconomy.isPending;
  const canEdit = captureMode === 'MANUAL' && captureStatus === 'DRAFT';

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EconomyFormValues>({
    resolver: zodResolver(economyFormSchema),
    defaultValues: buildEconomyFormDefaults(economy, incomes, vehicles, debts, bankCards, otherExpenses),
  });

  const incomesArray = useFieldArray({ control, name: 'incomes' });
  const vehiclesArray = useFieldArray({ control, name: 'vehicles' });
  const debtsArray = useFieldArray({ control, name: 'debts' });
  const bankCardsArray = useFieldArray({ control, name: 'bankCards' });
  const otherExpensesArray = useFieldArray({ control, name: 'otherExpenses' });

  const hasOtherExpensesValue = watch('hasOtherExpenses');
  const hasVehiclesValue = watch('hasVehicles');
  const hasBankCardsValue = watch('hasBankCards');
  const hasDebtsValue = watch('hasDebts');
  const expenseValues = watch(EXPENSE_FORM_FIELDS);
  const calculatedTotal = expenseValues.reduce((sum, value) => sum + toNumber(value), 0);

  function handleStartEditing() {
    reset(buildEconomyFormDefaults(economy, incomes, vehicles, debts, bankCards, otherExpenses));
    setIsEditing(true);
  }

  async function onSubmit(values: EconomyFormValues) {
    try {
      const payload = buildEconomyPayload(values);
      await updateEconomy.mutateAsync({ id: candidateId, payload });
      setIsEditing(false);
    } catch {
      // El toast de error ya lo emite useCandidateMutations; el formulario
      // se queda abierto con lo que el usuario escribió, para reintentar.
    }
  }

  if (isEditing) {
    return (
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
              <RequestQuoteOutlinedIcon fontSize="small" color="action" />
              <Typography variant="subtitle1">Egresos mensuales</Typography>
            </Stack>
            <Grid container spacing={2}>
              {EXPENSE_CATEGORIES.map((category) => (
                <Grid key={category.key} size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    label={category.label}
                    fullWidth
                    disabled={isSaving}
                    slotProps={currencySlotProps}
                    {...register(category.key as (typeof EXPENSE_FORM_FIELDS)[number])}
                    error={!!errors[category.key as (typeof EXPENSE_FORM_FIELDS)[number]]}
                    helperText={errors[category.key as (typeof EXPENSE_FORM_FIELDS)[number]]?.message}
                  />
                </Grid>
              ))}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Total de egresos (calculado)"
                  fullWidth
                  disabled
                  value={formatCurrency(calculatedTotal)}
                  slotProps={currencySlotProps}
                />
              </Grid>
            </Grid>

            <Stack spacing={1.5} sx={{ mt: 3 }}>
              <FormLabel id="has-other-expenses-label" error={!!errors.hasOtherExpenses}>
                ¿Tiene otros egresos?
              </FormLabel>
              <Controller
                name="hasOtherExpenses"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    row
                    aria-labelledby="has-other-expenses-label"
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      if (e.target.value === 'no') otherExpensesArray.replace([]);
                    }}
                  >
                    <FormControlLabel value="yes" control={<Radio />} label="Sí" disabled={isSaving} />
                    <FormControlLabel value="no" control={<Radio />} label="No" disabled={isSaving} />
                  </RadioGroup>
                )}
              />
            </Stack>
          </Paper>

          {hasOtherExpensesValue === 'yes' && (
            <DynamicListSection
              icon={<RequestQuoteOutlinedIcon fontSize="small" color="action" />}
              title="Otros egresos"
              addLabel="Agregar fila"
              disabled={isSaving}
              onAdd={() => otherExpensesArray.append({ concept: '', amount: '' })}
              isEmpty={otherExpensesArray.fields.length === 0}
              emptyMessage='No hay otros egresos agregados. Usa "Agregar fila" para capturar uno.'
            >
              {otherExpensesArray.fields.map((field, index) => (
                <Paper key={field.id} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative' }}>
                  <IconButton
                    size="small"
                    aria-label="Eliminar egreso"
                    disabled={isSaving}
                    onClick={() => otherExpensesArray.remove(index)}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    <DeleteForeverOutlinedIcon fontSize="small" color="error" />
                  </IconButton>
                  <Grid container spacing={2} sx={{ pr: 4 }}>
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField
                        label="Nombre del egreso"
                        fullWidth
                        disabled={isSaving}
                        {...register(`otherExpenses.${index}.concept`)}
                        error={!!errors.otherExpenses?.[index]?.concept}
                        helperText={errors.otherExpenses?.[index]?.concept?.message}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        label="Monto"
                        fullWidth
                        disabled={isSaving}
                        slotProps={currencySlotProps}
                        {...register(`otherExpenses.${index}.amount`)}
                        error={!!errors.otherExpenses?.[index]?.amount}
                        helperText={errors.otherExpenses?.[index]?.amount?.message}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </DynamicListSection>
          )}

          <DynamicListSection
            icon={<PaymentsOutlinedIcon fontSize="small" color="action" />}
            title="Ingresos"
            addLabel="Agregar fila"
            disabled={isSaving}
            onAdd={() => incomesArray.append({ source: '', amount: '' })}
            isEmpty={incomesArray.fields.length === 0}
            emptyMessage='No hay ingresos agregados. Usa "Agregar fila" para capturar uno.'
          >
            {incomesArray.fields.map((field, index) => (
              <Paper key={field.id} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative' }}>
                <IconButton
                  size="small"
                  aria-label="Eliminar ingreso"
                  disabled={isSaving}
                  onClick={() => incomesArray.remove(index)}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  <DeleteForeverOutlinedIcon fontSize="small" color="error" />
                </IconButton>
                <Grid container spacing={2} sx={{ pr: 4 }}>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <TextField
                      label="Fuente"
                      fullWidth
                      disabled={isSaving}
                      {...register(`incomes.${index}.source`)}
                      error={!!errors.incomes?.[index]?.source}
                      helperText={errors.incomes?.[index]?.source?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      label="Monto"
                      fullWidth
                      disabled={isSaving}
                      slotProps={currencySlotProps}
                      {...register(`incomes.${index}.amount`)}
                      error={!!errors.incomes?.[index]?.amount}
                      helperText={errors.incomes?.[index]?.amount?.message}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </DynamicListSection>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2}>
                <HasItemsToggle
                  labelId="has-vehicles-label"
                  question="¿Tiene vehículos?"
                  name="hasVehicles"
                  control={control}
                  disabled={isSaving}
                  onClear={() => vehiclesArray.replace([])}
                />
                {hasVehiclesValue === 'yes' && (
                  <DynamicListSection
                    icon={<DirectionsCarFilledOutlinedIcon fontSize="small" color="action" />}
                    title="Vehículos"
                    addLabel="Agregar fila"
                    disabled={isSaving}
                    onAdd={() => vehiclesArray.append({ model: '', value: '' })}
                    isEmpty={vehiclesArray.fields.length === 0}
                    emptyMessage='No hay vehículos agregados. Usa "Agregar fila" para capturar uno.'
                  >
                    {vehiclesArray.fields.map((field, index) => (
                      <Paper key={field.id} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative' }}>
                        <IconButton
                          size="small"
                          aria-label="Eliminar vehículo"
                          disabled={isSaving}
                          onClick={() => vehiclesArray.remove(index)}
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                        >
                          <DeleteForeverOutlinedIcon fontSize="small" color="error" />
                        </IconButton>
                        <Grid container spacing={2} sx={{ pr: 4 }}>
                          <Grid size={{ xs: 12, sm: 7 }}>
                            <TextField
                              label="Modelo"
                              fullWidth
                              disabled={isSaving}
                              {...register(`vehicles.${index}.model`)}
                              error={!!errors.vehicles?.[index]?.model}
                              helperText={errors.vehicles?.[index]?.model?.message}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField
                              label="Valor"
                              fullWidth
                              disabled={isSaving}
                              slotProps={currencySlotProps}
                              {...register(`vehicles.${index}.value`)}
                              error={!!errors.vehicles?.[index]?.value}
                              helperText={errors.vehicles?.[index]?.value?.message}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </DynamicListSection>
                )}
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2}>
                <HasItemsToggle
                  labelId="has-bank-cards-label"
                  question="¿Tiene tarjetas bancarias?"
                  name="hasBankCards"
                  control={control}
                  disabled={isSaving}
                  onClear={() => bankCardsArray.replace([])}
                />
                {hasBankCardsValue === 'yes' && (
                  <DynamicListSection
                    icon={<CreditCardOutlinedIcon fontSize="small" color="action" />}
                    title="Tarjetas bancarias"
                    addLabel="Agregar fila"
                    disabled={isSaving}
                    onAdd={() => bankCardsArray.append({ bank: '', creditLimit: '' })}
                    isEmpty={bankCardsArray.fields.length === 0}
                    emptyMessage='No hay tarjetas agregadas. Usa "Agregar fila" para capturar una.'
                  >
                    {bankCardsArray.fields.map((field, index) => (
                      <Paper key={field.id} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative' }}>
                        <IconButton
                          size="small"
                          aria-label="Eliminar tarjeta"
                          disabled={isSaving}
                          onClick={() => bankCardsArray.remove(index)}
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                        >
                          <DeleteForeverOutlinedIcon fontSize="small" color="error" />
                        </IconButton>
                        <Grid container spacing={2} sx={{ pr: 4 }}>
                          <Grid size={{ xs: 12, sm: 7 }}>
                            <TextField
                              label="Banco"
                              fullWidth
                              disabled={isSaving}
                              {...register(`bankCards.${index}.bank`)}
                              error={!!errors.bankCards?.[index]?.bank}
                              helperText={errors.bankCards?.[index]?.bank?.message}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField
                              label="Límite de crédito"
                              fullWidth
                              disabled={isSaving}
                              slotProps={currencySlotProps}
                              {...register(`bankCards.${index}.creditLimit`)}
                              error={!!errors.bankCards?.[index]?.creditLimit}
                              helperText={errors.bankCards?.[index]?.creditLimit?.message}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </DynamicListSection>
                )}
              </Stack>
            </Grid>
          </Grid>

          <HasItemsToggle
            labelId="has-debts-label"
            question="¿Tiene deudas?"
            name="hasDebts"
            control={control}
            disabled={isSaving}
            onClear={() => debtsArray.replace([])}
          />

          {hasDebtsValue === 'yes' && (
          <DynamicListSection
            icon={<RequestQuoteOutlinedIcon fontSize="small" color="action" />}
            title="Deudas"
            addLabel="Agregar fila"
            disabled={isSaving}
            onAdd={() => debtsArray.append({ creditor: '', amount: '', monthlyPayment: '' })}
            isEmpty={debtsArray.fields.length === 0}
            emptyMessage='No hay deudas agregadas. Usa "Agregar fila" para capturar una.'
          >
            {debtsArray.fields.map((field, index) => (
              <Paper key={field.id} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative' }}>
                <IconButton
                  size="small"
                  aria-label="Eliminar deuda"
                  disabled={isSaving}
                  onClick={() => debtsArray.remove(index)}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  <DeleteForeverOutlinedIcon fontSize="small" color="error" />
                </IconButton>
                <Grid container spacing={2} sx={{ pr: 4 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Acreedor"
                      fullWidth
                      disabled={isSaving}
                      {...register(`debts.${index}.creditor`)}
                      error={!!errors.debts?.[index]?.creditor}
                      helperText={errors.debts?.[index]?.creditor?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Monto"
                      fullWidth
                      disabled={isSaving}
                      slotProps={currencySlotProps}
                      {...register(`debts.${index}.amount`)}
                      error={!!errors.debts?.[index]?.amount}
                      helperText={errors.debts?.[index]?.amount?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Pago mensual"
                      fullWidth
                      disabled={isSaving}
                      slotProps={currencySlotProps}
                      {...register(`debts.${index}.monthlyPayment`)}
                      error={!!errors.debts?.[index]?.monthlyPayment}
                      helperText={errors.debts?.[index]?.monthlyPayment?.message}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </DynamicListSection>
          )}

          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained" size="small" disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              size="small"
              disabled={isSaving}
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

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
      {canEdit && (
        <Stack direction="row" justifyContent="flex-end">
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<EditOutlinedIcon fontSize="small" />}
            onClick={handleStartEditing}
          >
            Editar
          </Button>
        </Stack>
      )}

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
          <DetailField label="Tiene otros egresos" value={economy.hasOtherExpenses} />
        </Grid>
      </Paper>

      {economy.hasOtherExpenses === true && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
            <RequestQuoteOutlinedIcon fontSize="small" color="action" />
            <Typography variant="subtitle1">Otros egresos</Typography>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell scope="col">Nombre del egreso</TableCell>
                  <TableCell scope="col" align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {otherExpenses.map((expense, index) => (
                  <TableRow key={`${expense.concept}-${index}`}>
                    <TableCell>{expense.concept}</TableCell>
                    <TableCell align="right">{formatCurrency(expense.amount)}</TableCell>
                  </TableRow>
                ))}
                {otherExpenses.length === 0 && (
                  <EmptyTableState colSpan={2} message="No hay otros egresos registrados." />
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

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
