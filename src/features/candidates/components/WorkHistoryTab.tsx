import { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import type { WorkHistoryEntry } from '../types/candidate.types';

const NOT_SPECIFIED = 'No especificado';

/**
 * Envoltura solo-UI: `isEditing` no es parte del dominio (WorkHistoryEntry
 * es lo que eventualmente viajaría al backend), es puramente si ESTA
 * tarjeta se ve como formulario o como texto en este momento.
 */
interface EditableEntry extends WorkHistoryEntry {
  isEditing: boolean;
}

function createEmptyEntry(): EditableEntry {
  return {
    id: null,
    companyName: '',
    address: '',
    activity: '',
    contactNamePhone: '',
    candidatePosition: '',
    companyPosition: '',
    candidatePeriod: '',
    companyPeriod: '',
    candidateBoss: '',
    companyBoss: '',
    candidateSalary: '',
    companySalary: '',
    candidateSeparation: '',
    companySeparation: '',
    companyComments: '',
    isEditing: true,
  };
}

/** Pares candidato/empresa que arma el diseño de doble columna, en el orden pedido. */
const COMPARISON_FIELDS: { label: string; candidateKey: keyof WorkHistoryEntry; companyKey: keyof WorkHistoryEntry }[] = [
  { label: 'Puesto', candidateKey: 'candidatePosition', companyKey: 'companyPosition' },
  { label: 'Periodo', candidateKey: 'candidatePeriod', companyKey: 'companyPeriod' },
  { label: 'Jefe directo', candidateKey: 'candidateBoss', companyKey: 'companyBoss' },
  { label: 'Sueldo', candidateKey: 'candidateSalary', companyKey: 'companySalary' },
  { label: 'Motivo de separación', candidateKey: 'candidateSeparation', companyKey: 'companySeparation' },
];

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value || NOT_SPECIFIED}
      </Typography>
    </Box>
  );
}

function WorkHistoryCard({
  entry,
  index,
  onEdit,
  onCancel,
  onSave,
  onFieldChange,
}: {
  entry: EditableEntry;
  index: number;
  onEdit: (index: number) => void;
  onCancel: (index: number) => void;
  onSave: (index: number) => void;
  onFieldChange: (index: number, field: keyof WorkHistoryEntry, value: string) => void;
}) {
  if (!entry.isEditing) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {entry.companyName || 'Empresa sin nombre'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {entry.activity || NOT_SPECIFIED}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => onEdit(index)}
            aria-label={`Editar antecedente laboral: ${entry.companyName || 'empresa sin nombre'}`}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FieldRow label="Domicilio" value={entry.address} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FieldRow label="Nombre y teléfono de contacto" value={entry.contactNamePhone} />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="overline" fontWeight={700} color="primary.main">
              Candidato
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {COMPARISON_FIELDS.map((field) => (
                <FieldRow key={field.candidateKey} label={field.label} value={entry[field.candidateKey] as string} />
              ))}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="overline" fontWeight={700} color="text.secondary">
              Empresa
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {COMPARISON_FIELDS.map((field) => (
                <FieldRow key={field.companyKey} label={field.label} value={entry[field.companyKey] as string} />
              ))}
            </Stack>
          </Grid>
        </Grid>

        {entry.companyComments && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Comentarios de la empresa
            </Typography>
            <Typography variant="body2">{entry.companyComments}</Typography>
          </>
        )}
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {entry.id ? 'Editar antecedente laboral' : 'Nuevo antecedente laboral'}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Empresa"
            fullWidth
            value={entry.companyName}
            onChange={(e) => onFieldChange(index, 'companyName', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Domicilio"
            fullWidth
            value={entry.address}
            onChange={(e) => onFieldChange(index, 'address', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Giro / Actividad"
            fullWidth
            value={entry.activity}
            onChange={(e) => onFieldChange(index, 'activity', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Nombre y teléfono de contacto"
            fullWidth
            value={entry.contactNamePhone}
            onChange={(e) => onFieldChange(index, 'contactNamePhone', e.target.value)}
          />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="overline" fontWeight={700} color="primary.main">
            Candidato
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {COMPARISON_FIELDS.map((field) => (
              <TextField
                key={field.candidateKey}
                label={field.label}
                fullWidth
                value={entry[field.candidateKey] as string}
                onChange={(e) => onFieldChange(index, field.candidateKey, e.target.value)}
              />
            ))}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="overline" fontWeight={700} color="text.secondary">
            Empresa
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {COMPARISON_FIELDS.map((field) => (
              <TextField
                key={field.companyKey}
                label={field.label}
                fullWidth
                value={entry[field.companyKey] as string}
                onChange={(e) => onFieldChange(index, field.companyKey, e.target.value)}
              />
            ))}
          </Stack>
        </Grid>
      </Grid>

      <TextField
        label="Comentarios de la empresa"
        fullWidth
        multiline
        minRows={2}
        value={entry.companyComments}
        onChange={(e) => onFieldChange(index, 'companyComments', e.target.value)}
        sx={{ mt: 2 }}
      />

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="outlined" color="inherit" size="small" onClick={() => onCancel(index)}>
          Cancelar
        </Button>
        <Button variant="contained" size="small" onClick={() => onSave(index)}>
          Guardar
        </Button>
      </Stack>
    </Paper>
  );
}

/**
 * 100% local por ahora: aunque el backend ya expone
 * POST/PUT/DELETE /candidates/:id/work-history(/:workId), esta entrega
 * es solo la arquitectura de UI (modo vista/edición por tarjeta,
 * comparación candidato vs. empresa) — la persistencia real se conecta
 * en un paso aparte, cuando se confirme cómo llegan los registros
 * existentes desde GET /candidates/:id (no hay endpoint de lectura
 * dedicado ni un campo confirmado todavía).
 */
export function WorkHistoryTab() {
  const [entries, setEntries] = useState<EditableEntry[]>(() => [createEmptyEntry()]);

  function handleEdit(index: number) {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, isEditing: true } : entry)));
  }

  function handleCancel(index: number) {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, isEditing: false } : entry)));
  }

  function handleSave(index: number) {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, isEditing: false } : entry)));
  }

  function handleFieldChange(index: number, field: keyof WorkHistoryEntry, value: string) {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  }

  function handleAddEntry() {
    setEntries((prev) => [...prev, createEmptyEntry()]);
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <BusinessCenterOutlinedIcon fontSize="small" color="action" />
        <Typography variant="subtitle1">Antecedentes laborales</Typography>
      </Stack>

      {entries.map((entry, index) => (
        <WorkHistoryCard
          key={entry.id ?? `new-${index}`}
          entry={entry}
          index={index}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onSave={handleSave}
          onFieldChange={handleFieldChange}
        />
      ))}

      <Box>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<AddCircleOutlinedIcon fontSize="small" />}
          onClick={handleAddEntry}
        >
          Agregar otro empleo
        </Button>
      </Box>
    </Stack>
  );
}
