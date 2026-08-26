import { useState } from 'react';
import { Box, Button, Divider, Grid, IconButton, Paper, Stack, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ClearableTextField } from '@/shared/components/ClearableTextField';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import type { WorkHistoryEntry } from '../types/candidate.types';

const NOT_SPECIFIED = 'No especificado';

interface WorkHistoryTabProps {
  candidateId: string;
  workHistories: WorkHistoryEntry[];
}

/**
 * `localKey` (no el índice del arreglo) identifica a cada tarjeta de
 * forma estable — necesario porque "Cancelar" en un borrador (Caso B)
 * puede eliminar una tarjeta del arreglo mientras otra está guardando,
 * y un índice se correría; un `localKey` no.
 */
interface EditableEntry {
  localKey: string;
  data: WorkHistoryEntry;
  /** Snapshot tomado al entrar en edición de un registro YA guardado — null en borradores. */
  originalData: WorkHistoryEntry | null;
  isEditing: boolean;
  /** true solo en la tarjeta en blanco que aparece cuando el candidato no tiene antecedentes. */
  isSeed: boolean;
}

function createEmptyWorkHistory(): WorkHistoryEntry {
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
  };
}

function createSeedEntry(): EditableEntry {
  return {
    localKey: crypto.randomUUID(),
    data: createEmptyWorkHistory(),
    originalData: null,
    isEditing: true,
    isSeed: true,
  };
}

function createDraftEntry(): EditableEntry {
  return {
    localKey: crypto.randomUUID(),
    data: createEmptyWorkHistory(),
    originalData: null,
    isEditing: true,
    isSeed: false,
  };
}

/** Los registros que ya vienen del backend siempre tienen `id`, así que se usa como `localKey` — ya es único. */
function toEditableEntry(entry: WorkHistoryEntry): EditableEntry {
  return { localKey: entry.id as string, data: entry, originalData: null, isEditing: false, isSeed: false };
}

type SecondaryAction = 'clear' | 'cancel-draft' | 'cancel-edit';

const SECONDARY_LABEL: Record<SecondaryAction, string> = {
  clear: 'Limpiar',
  'cancel-draft': 'Cancelar',
  'cancel-edit': 'Cancelar',
};

/**
 * Regla de negocio pedida por el cliente: el botón secundario dice y
 * hace algo distinto según de dónde salió la tarjeta — nunca según el
 * tamaño del arreglo (eso se rompería en cuanto hubiera más de un
 * registro guardado).
 */
function getSecondaryAction(entry: EditableEntry): SecondaryAction {
  if (entry.data.id !== null) return 'cancel-edit'; // Caso C: registro guardado en edición
  if (entry.isSeed) return 'clear'; // Caso A: única tarjeta por defecto sin antecedentes
  return 'cancel-draft'; // Caso B: agregado con "Agregar otro empleo"
}

/** Pares candidato/empresa del diseño de doble columna, en el orden pedido. */
const COMPARISON_FIELDS: {
  label: string;
  candidateKey: keyof WorkHistoryEntry;
  companyKey: keyof WorkHistoryEntry;
}[] = [
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
  isSaving,
  onEdit,
  onSecondaryAction,
  onSave,
  onDeleteRequest,
  onFieldChange,
}: {
  entry: EditableEntry;
  isSaving: boolean;
  onEdit: (localKey: string) => void;
  onSecondaryAction: (localKey: string) => void;
  onSave: (localKey: string) => void;
  onDeleteRequest: (entry: WorkHistoryEntry) => void;
  onFieldChange: (localKey: string, field: keyof WorkHistoryEntry, value: string) => void;
}) {
  if (!entry.isEditing) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {entry.data.companyName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {entry.data.activity || NOT_SPECIFIED}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              onClick={() => onEdit(entry.localKey)}
              aria-label={`Editar antecedente laboral: ${entry.data.companyName}`}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
            {/* Solo tiene sentido borrar un registro que YA existe en el backend. */}
            {entry.data.id !== null && (
              <IconButton
                size="small"
                onClick={() => onDeleteRequest(entry.data)}
                aria-label={`Eliminar antecedente laboral: ${entry.data.companyName}`}
                sx={{ color: 'error.main' }}
              >
                <DeleteForeverOutlinedIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FieldRow label="Domicilio" value={entry.data.address} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FieldRow label="Nombre y teléfono de contacto" value={entry.data.contactNamePhone} />
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
                <FieldRow
                  key={field.candidateKey}
                  label={field.label}
                  value={entry.data[field.candidateKey] as string}
                />
              ))}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="overline" fontWeight={700} color="text.secondary">
              Empresa
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {COMPARISON_FIELDS.map((field) => (
                <FieldRow
                  key={field.companyKey}
                  label={field.label}
                  value={entry.data[field.companyKey] as string}
                />
              ))}
            </Stack>
          </Grid>
        </Grid>

        {entry.data.companyComments && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Comentarios de la empresa
            </Typography>
            <Typography variant="body2">{entry.data.companyComments}</Typography>
          </>
        )}
      </Paper>
    );
  }

  const secondaryAction = getSecondaryAction(entry);

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {entry.data.id ? 'Editar antecedente laboral' : 'Nuevo antecedente laboral'}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ClearableTextField
            label="Empresa"
            required
            fullWidth
            disabled={isSaving}
            value={entry.data.companyName}
            onChange={(e) => onFieldChange(entry.localKey, 'companyName', e.target.value)}
            onClear={() => onFieldChange(entry.localKey, 'companyName', '')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ClearableTextField
            label="Domicilio"
            fullWidth
            disabled={isSaving}
            value={entry.data.address}
            onChange={(e) => onFieldChange(entry.localKey, 'address', e.target.value)}
            onClear={() => onFieldChange(entry.localKey, 'address', '')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ClearableTextField
            label="Giro / Actividad"
            fullWidth
            disabled={isSaving}
            value={entry.data.activity}
            onChange={(e) => onFieldChange(entry.localKey, 'activity', e.target.value)}
            onClear={() => onFieldChange(entry.localKey, 'activity', '')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ClearableTextField
            label="Nombre y teléfono de contacto"
            fullWidth
            disabled={isSaving}
            value={entry.data.contactNamePhone}
            onChange={(e) => onFieldChange(entry.localKey, 'contactNamePhone', e.target.value)}
            onClear={() => onFieldChange(entry.localKey, 'contactNamePhone', '')}
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
              <ClearableTextField
                key={field.candidateKey}
                label={field.label}
                fullWidth
                disabled={isSaving}
                value={entry.data[field.candidateKey] as string}
                onChange={(e) => onFieldChange(entry.localKey, field.candidateKey, e.target.value)}
                onClear={() => onFieldChange(entry.localKey, field.candidateKey, '')}
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
              <ClearableTextField
                key={field.companyKey}
                label={field.label}
                fullWidth
                disabled={isSaving}
                value={entry.data[field.companyKey] as string}
                onChange={(e) => onFieldChange(entry.localKey, field.companyKey, e.target.value)}
                onClear={() => onFieldChange(entry.localKey, field.companyKey, '')}
              />
            ))}
          </Stack>
        </Grid>
      </Grid>

      <ClearableTextField
        label="Comentarios de la empresa"
        fullWidth
        multiline
        minRows={2}
        disabled={isSaving}
        value={entry.data.companyComments}
        onChange={(e) => onFieldChange(entry.localKey, 'companyComments', e.target.value)}
        onClear={() => onFieldChange(entry.localKey, 'companyComments', '')}
        sx={{ mt: 2 }}
      />

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          disabled={isSaving}
          onClick={() => onSecondaryAction(entry.localKey)}
        >
          {SECONDARY_LABEL[secondaryAction]}
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={isSaving || !entry.data.companyName.trim()}
          onClick={() => onSave(entry.localKey)}
        >
          {isSaving ? 'Guardando…' : 'Guardar'}
        </Button>
      </Stack>
    </Paper>
  );
}

export function WorkHistoryTab({ candidateId, workHistories }: WorkHistoryTabProps) {
  const { createWorkHistory, updateWorkHistory, deleteWorkHistory } = useCandidateMutations();
  const [entries, setEntries] = useState<EditableEntry[]>(() =>
    workHistories.length > 0 ? workHistories.map(toEditableEntry) : [createSeedEntry()],
  );
  const [deleteTarget, setDeleteTarget] = useState<WorkHistoryEntry | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  function handleEdit(localKey: string) {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.localKey === localKey ? { ...entry, originalData: { ...entry.data }, isEditing: true } : entry,
      ),
    );
  }

  function handleFieldChange(localKey: string, field: keyof WorkHistoryEntry, value: string) {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.localKey === localKey ? { ...entry, data: { ...entry.data, [field]: value } } : entry,
      ),
    );
  }

  function handleSecondaryAction(localKey: string) {
    setEntries((prev) => {
      const entry = prev.find((e) => e.localKey === localKey);
      if (!entry) return prev;

      const action = getSecondaryAction(entry);

      if (action === 'clear') {
        return prev.map((e) => (e.localKey === localKey ? { ...e, data: createEmptyWorkHistory() } : e));
      }
      if (action === 'cancel-draft') {
        return prev.filter((e) => e.localKey !== localKey);
      }
      // cancel-edit: revierte a los datos originales, nunca borra ni guarda.
      return prev.map((e) =>
        e.localKey === localKey ? { ...e, data: e.originalData ?? e.data, originalData: null, isEditing: false } : e,
      );
    });
  }

  async function handleSave(localKey: string) {
    const entry = entries.find((e) => e.localKey === localKey);
    if (!entry || !entry.data.companyName.trim()) return;

    // El backend agrega candidateId/createdAt/updatedAt a los registros
    // embebidos en GET /candidates/:id; como entry.data se guarda tal cual
    // en el estado, hay que excluirlos explícitamente aquí — de lo
    // contrario el PUT/POST los reenvía y el backend responde 400
    // ("property candidateId/createdAt/updatedAt should not exist").
    const { id, candidateId: _candidateId, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } =
      entry.data as WorkHistoryEntry & { candidateId?: unknown; createdAt?: unknown; updatedAt?: unknown };
    setSavingKey(localKey);
    try {
      const saved = id
        ? await updateWorkHistory.mutateAsync({ id: candidateId, workId: id, payload })
        : await createWorkHistory.mutateAsync({ id: candidateId, payload });
      setEntries((prev) =>
        prev.map((e) =>
          e.localKey === localKey ? { ...e, data: saved, originalData: null, isEditing: false, isSeed: false } : e,
        ),
      );
    } catch {
      // El toast de error ya lo emite useCandidateMutations; la tarjeta
      // se queda abierta con lo que el usuario escribió, para reintentar.
    } finally {
      setSavingKey(null);
    }
  }

  function handleAddEntry() {
    setEntries((prev) => [...prev, createDraftEntry()]);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget?.id) return;
    const workId = deleteTarget.id;
    try {
      await deleteWorkHistory.mutateAsync({ id: candidateId, workId });
      setEntries((prev) => {
        const next = prev.filter((entry) => entry.data.id !== workId);
        return next.length > 0 ? next : [createSeedEntry()];
      });
      setDeleteTarget(null);
    } catch {
      // El toast de error ya lo emite useCandidateMutations; el diálogo
      // se queda abierto para reintentar.
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <BusinessCenterOutlinedIcon fontSize="small" color="action" />
        <Typography variant="subtitle1">Antecedentes laborales</Typography>
      </Stack>

      {entries.map((entry) => (
        <WorkHistoryCard
          key={entry.localKey}
          entry={entry}
          isSaving={savingKey === entry.localKey}
          onEdit={handleEdit}
          onSecondaryAction={handleSecondaryAction}
          onSave={handleSave}
          onDeleteRequest={setDeleteTarget}
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar antecedente laboral"
        description={
          deleteTarget
            ? `¿Confirmas que deseas eliminar el antecedente laboral de "${deleteTarget.companyName || 'esta empresa'}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Sí, eliminar"
        severity="error"
        loading={deleteWorkHistory.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Stack>
  );
}
