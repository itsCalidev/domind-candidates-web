import { useState } from 'react';
import { Box, Button, Grid, IconButton, Paper, Stack, Typography, Divider } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import ContactsOutlinedIcon from '@mui/icons-material/ContactsOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ClearableTextField } from '@/shared/components/ClearableTextField';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import type { NeighborhoodReferenceEntry, PersonalReferenceEntry } from '../types/candidate.types';

const NOT_SPECIFIED = 'No especificado';

/**
 * Límites de longitud reflejando las reglas de class-validator del
 * backend (confirmadas por el usuario): "name" usa el mismo límite que
 * "Empresa" en Antecedentes Laborales (150), los demás campos de texto
 * normales usan 255, y las opiniones/comentarios largos usan 500.
 */
const NAME_MAX_LENGTH = 150;
const FIELD_MAX_LENGTH = 255;
const OPINION_MAX_LENGTH = 500;
const PHONE_MAX_LENGTH = 15;

/** Solo dígitos, espacios, guiones y "+" (para lada, ej. +52) — regla del backend. */
const PHONE_CHARSET_REGEX = /^[0-9+\-\s]*$/;

/** Vacío es válido (el campo no es obligatorio); solo se valida formato/longitud si el usuario escribió algo. */
function validatePhone(value: string): string | null {
  if (!value) return null;
  if (!PHONE_CHARSET_REGEX.test(value)) {
    return 'Formato inválido. Usa solo números, espacios, guiones o +52.';
  }
  if (value.length < 10 || value.length > 15) {
    return 'Debe tener entre 10 y 15 caracteres.';
  }
  return null;
}

/** Solo letras (con acentos/ñ) y espacios — nombres de personas, no razones sociales. */
const NAME_CHARSET_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

/** Vacío es válido aquí (el "required" se exige aparte); solo se valida el charset si el usuario escribió algo. */
function validateName(value: string): string | null {
  if (!value) return null;
  if (!NAME_CHARSET_REGEX.test(value)) {
    return 'El nombre solo debe contener letras y espacios.';
  }
  return null;
}

interface ReferencesTabProps {
  candidateId: string;
  personalReferences: PersonalReferenceEntry[];
  neighborhoodReferences: NeighborhoodReferenceEntry[];
}

/**
 * `localKey` (no el índice del arreglo) identifica a cada tarjeta de
 * forma estable — mismo motivo que en WorkHistoryTab: "Cancelar" en un
 * borrador (Caso B) puede eliminar una tarjeta del arreglo mientras otra
 * está guardando, y un índice se correría; un `localKey` no.
 */
interface EditableEntry<T extends { id: string | null }> {
  localKey: string;
  data: T;
  /** Snapshot tomado al entrar en edición de un registro YA guardado — null en borradores. */
  originalData: T | null;
  isEditing: boolean;
  /** true solo en la tarjeta en blanco que aparece cuando el bloque no tiene registros. */
  isSeed: boolean;
}

function createSeedEntry<T extends { id: string | null }>(empty: T): EditableEntry<T> {
  return { localKey: crypto.randomUUID(), data: empty, originalData: null, isEditing: true, isSeed: true };
}

function createDraftEntry<T extends { id: string | null }>(empty: T): EditableEntry<T> {
  return { localKey: crypto.randomUUID(), data: empty, originalData: null, isEditing: true, isSeed: false };
}

/** Los registros que ya vienen del backend siempre tienen `id`, así que se usa como `localKey` — ya es único. */
function toEditableEntry<T extends { id: string | null }>(entry: T): EditableEntry<T> {
  return { localKey: entry.id as string, data: entry, originalData: null, isEditing: false, isSeed: false };
}

type SecondaryAction = 'clear' | 'cancel-draft' | 'cancel-edit';

const SECONDARY_LABEL: Record<SecondaryAction, string> = {
  clear: 'Limpiar',
  'cancel-draft': 'Cancelar',
  'cancel-edit': 'Cancelar',
};

/**
 * Misma regla de negocio que en Antecedentes Laborales: el botón
 * secundario dice y hace algo distinto según de dónde salió la tarjeta,
 * nunca según el tamaño del arreglo.
 */
function getSecondaryAction<T extends { id: string | null }>(entry: EditableEntry<T>): SecondaryAction {
  if (entry.data.id !== null) return 'cancel-edit'; // Caso C: registro guardado en edición
  if (entry.isSeed) return 'clear'; // Caso A: única tarjeta por defecto sin registros
  return 'cancel-draft'; // Caso B: agregado con "Agregar otra referencia…"
}

/**
 * Maneja el estado local de un bloque de referencias (personales o
 * vecinales) — misma lógica de 3 casos que WorkHistoryTab, genericizada
 * en `T` para no duplicarla dos veces en este archivo.
 */
function useReferenceList<T extends { id: string | null }>(initial: T[], createEmpty: () => T) {
  const [entries, setEntries] = useState<EditableEntry<T>[]>(() =>
    initial.length > 0 ? initial.map(toEditableEntry) : [createSeedEntry(createEmpty())],
  );

  function handleEdit(localKey: string) {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.localKey === localKey ? { ...entry, originalData: { ...entry.data }, isEditing: true } : entry,
      ),
    );
  }

  function handleFieldChange(localKey: string, field: keyof T, value: string) {
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
        return prev.map((e) => (e.localKey === localKey ? { ...e, data: createEmpty() } : e));
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

  function handleAddEntry() {
    setEntries((prev) => [...prev, createDraftEntry(createEmpty())]);
  }

  function patchSaved(localKey: string, saved: T) {
    setEntries((prev) =>
      prev.map((e) =>
        e.localKey === localKey ? { ...e, data: saved, originalData: null, isEditing: false, isSeed: false } : e,
      ),
    );
  }

  function removeAndReseed(id: string) {
    setEntries((prev) => {
      const next = prev.filter((entry) => entry.data.id !== id);
      return next.length > 0 ? next : [createSeedEntry(createEmpty())];
    });
  }

  return { entries, handleEdit, handleFieldChange, handleSecondaryAction, handleAddEntry, patchSaved, removeAndReseed };
}

function createEmptyPersonalReference(): PersonalReferenceEntry {
  return { id: null, name: '', occupation: '', timeKnown: '', phone: '' };
}

function createEmptyNeighborhoodReference(): NeighborhoodReferenceEntry {
  return { id: null, name: '', occupation: '', timeKnown: '', address: '', opinion: '' };
}

interface ReferenceFieldConfig<T> {
  key: keyof T & string;
  label: string;
  multiline?: boolean;
  maxLength: number;
  validate?: (value: string) => string | null;
}

const PERSONAL_FIELDS: ReferenceFieldConfig<PersonalReferenceEntry>[] = [
  { key: 'timeKnown', label: 'Tiempo de conocerlo', maxLength: FIELD_MAX_LENGTH },
  { key: 'phone', label: 'Teléfono', maxLength: PHONE_MAX_LENGTH, validate: validatePhone },
];

const NEIGHBORHOOD_FIELDS: ReferenceFieldConfig<NeighborhoodReferenceEntry>[] = [
  { key: 'timeKnown', label: 'Tiempo de conocerlo', maxLength: FIELD_MAX_LENGTH },
  { key: 'address', label: 'Domicilio', maxLength: FIELD_MAX_LENGTH },
  { key: 'opinion', label: 'Opinión sobre el candidato', multiline: true, maxLength: OPINION_MAX_LENGTH },
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

interface ReferenceCardProps<T extends { id: string | null; name: string; occupation: string }> {
  entry: EditableEntry<T>;
  isSaving: boolean;
  entityLabel: string;
  fields: ReferenceFieldConfig<T>[];
  onEdit: (localKey: string) => void;
  onSecondaryAction: (localKey: string) => void;
  onSave: (localKey: string) => void;
  onDeleteRequest: (data: T) => void;
  onFieldChange: (localKey: string, field: keyof T, value: string) => void;
}

function ReferenceCard<T extends { id: string | null; name: string; occupation: string }>({
  entry,
  isSaving,
  entityLabel,
  fields,
  onEdit,
  onSecondaryAction,
  onSave,
  onDeleteRequest,
  onFieldChange,
}: ReferenceCardProps<T>) {
  if (!entry.isEditing) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {entry.data.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {entry.data.occupation || NOT_SPECIFIED}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              onClick={() => onEdit(entry.localKey)}
              aria-label={`Editar ${entityLabel}: ${entry.data.name}`}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
            {/* Solo tiene sentido borrar un registro que YA existe en el backend. */}
            {entry.data.id !== null && (
              <IconButton
                size="small"
                onClick={() => onDeleteRequest(entry.data)}
                aria-label={`Eliminar ${entityLabel}: ${entry.data.name}`}
                sx={{ color: 'error.main' }}
              >
                <DeleteForeverOutlinedIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          {fields.map((field) => (
            <Grid key={field.key} size={{ xs: 12, sm: 6 }}>
              <FieldRow label={field.label} value={entry.data[field.key] as string} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  const secondaryAction = getSecondaryAction(entry);
  const nameErrorMessage = validateName(entry.data.name);
  const hasFieldErrors =
    !!nameErrorMessage ||
    fields.some((field) => field.validate && field.validate(entry.data[field.key] as string) !== null);

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {entry.data.id ? `Editar ${entityLabel}` : `Nueva ${entityLabel}`}
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ClearableTextField
            label="Nombre completo"
            required
            fullWidth
            disabled={isSaving}
            value={entry.data.name}
            error={!!nameErrorMessage}
            helperText={nameErrorMessage ?? undefined}
            slotProps={{ htmlInput: { maxLength: NAME_MAX_LENGTH } }}
            onChange={(e) => onFieldChange(entry.localKey, 'name', e.target.value)}
            onClear={() => onFieldChange(entry.localKey, 'name', '')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ClearableTextField
            label="Ocupación"
            fullWidth
            disabled={isSaving}
            value={entry.data.occupation}
            slotProps={{ htmlInput: { maxLength: FIELD_MAX_LENGTH } }}
            onChange={(e) => onFieldChange(entry.localKey, 'occupation', e.target.value)}
            onClear={() => onFieldChange(entry.localKey, 'occupation', '')}
          />
        </Grid>
        {fields.map((field) => {
          const value = entry.data[field.key] as string;
          const errorMessage = field.validate ? field.validate(value) : null;
          return (
            <Grid key={field.key} size={{ xs: 12, sm: field.multiline ? 12 : 6 }}>
              <ClearableTextField
                label={field.label}
                fullWidth
                multiline={field.multiline}
                minRows={field.multiline ? 2 : undefined}
                disabled={isSaving}
                value={value}
                error={!!errorMessage}
                helperText={errorMessage ?? undefined}
                slotProps={{ htmlInput: { maxLength: field.maxLength } }}
                onChange={(e) => onFieldChange(entry.localKey, field.key, e.target.value)}
                onClear={() => onFieldChange(entry.localKey, field.key, '')}
              />
            </Grid>
          );
        })}
      </Grid>

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
          disabled={isSaving || !entry.data.name.trim() || hasFieldErrors}
          onClick={() => onSave(entry.localKey)}
        >
          {isSaving ? 'Guardando…' : 'Guardar'}
        </Button>
      </Stack>
    </Paper>
  );
}

type DeleteTarget =
  | { kind: 'personal'; entry: PersonalReferenceEntry }
  | { kind: 'neighborhood'; entry: NeighborhoodReferenceEntry };

export function ReferencesTab({ candidateId, personalReferences, neighborhoodReferences }: ReferencesTabProps) {
  const {
    createPersonalReference,
    updatePersonalReference,
    deletePersonalReference,
    createNeighborhoodReference,
    updateNeighborhoodReference,
    deleteNeighborhoodReference,
  } = useCandidateMutations();

  const personal = useReferenceList(personalReferences, createEmptyPersonalReference);
  const neighborhood = useReferenceList(neighborhoodReferences, createEmptyNeighborhoodReference);

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  async function handleSavePersonal(localKey: string) {
    const entry = personal.entries.find((e) => e.localKey === localKey);
    if (!entry || !entry.data.name.trim()) return;

    // El backend agrega candidateId/createdAt/updatedAt a los registros
    // embebidos en GET /candidates/:id; hay que excluirlos aquí o el
    // PUT/POST los reenvía y el backend responde 400 ("property
    // candidateId/createdAt/updatedAt should not exist").
    const { id, candidateId: _candidateId, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } =
      entry.data as PersonalReferenceEntry & { candidateId?: unknown; createdAt?: unknown; updatedAt?: unknown };
    setSavingKey(localKey);
    try {
      const saved = id
        ? await updatePersonalReference.mutateAsync({ id: candidateId, refId: id, payload })
        : await createPersonalReference.mutateAsync({ id: candidateId, payload });
      personal.patchSaved(localKey, saved);
    } catch {
      // El toast de error ya lo emite useCandidateMutations; la tarjeta
      // se queda abierta con lo que el usuario escribió, para reintentar.
    } finally {
      setSavingKey(null);
    }
  }

  async function handleSaveNeighborhood(localKey: string) {
    const entry = neighborhood.entries.find((e) => e.localKey === localKey);
    if (!entry || !entry.data.name.trim()) return;

    // Ídem: excluir los campos de control que el backend agrega a los
    // registros embebidos, para no reenviarlos en el PUT/POST.
    const { id, candidateId: _candidateId, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } =
      entry.data as NeighborhoodReferenceEntry & { candidateId?: unknown; createdAt?: unknown; updatedAt?: unknown };
    setSavingKey(localKey);
    try {
      const saved = id
        ? await updateNeighborhoodReference.mutateAsync({ id: candidateId, refId: id, payload })
        : await createNeighborhoodReference.mutateAsync({ id: candidateId, payload });
      neighborhood.patchSaved(localKey, saved);
    } catch {
      // Ídem: el toast de error ya lo emite useCandidateMutations.
    } finally {
      setSavingKey(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget?.entry.id) return;
    const refId = deleteTarget.entry.id;
    try {
      if (deleteTarget.kind === 'personal') {
        await deletePersonalReference.mutateAsync({ id: candidateId, refId });
        personal.removeAndReseed(refId);
      } else {
        await deleteNeighborhoodReference.mutateAsync({ id: candidateId, refId });
        neighborhood.removeAndReseed(refId);
      }
      setDeleteTarget(null);
    } catch {
      // El toast de error ya lo emite useCandidateMutations; el diálogo
      // se queda abierto para reintentar.
    }
  }

  const isDeletePending = deletePersonalReference.isPending || deleteNeighborhoodReference.isPending;

  return (
    <Stack spacing={4}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <ContactsOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Referencias Personales</Typography>
        </Stack>

        {personal.entries.map((entry) => (
          <ReferenceCard
            key={entry.localKey}
            entry={entry}
            isSaving={savingKey === entry.localKey}
            entityLabel="referencia personal"
            fields={PERSONAL_FIELDS}
            onEdit={personal.handleEdit}
            onSecondaryAction={personal.handleSecondaryAction}
            onSave={handleSavePersonal}
            onDeleteRequest={(data) => setDeleteTarget({ kind: 'personal', entry: data })}
            onFieldChange={personal.handleFieldChange}
          />
        ))}

        <Box>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<AddCircleOutlinedIcon fontSize="small" />}
            onClick={personal.handleAddEntry}
          >
            Agregar otra referencia personal…
          </Button>
        </Box>
      </Stack>

      <Divider />

      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <HomeWorkOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">Referencias Vecinales</Typography>
        </Stack>

        {neighborhood.entries.map((entry) => (
          <ReferenceCard
            key={entry.localKey}
            entry={entry}
            isSaving={savingKey === entry.localKey}
            entityLabel="referencia vecinal"
            fields={NEIGHBORHOOD_FIELDS}
            onEdit={neighborhood.handleEdit}
            onSecondaryAction={neighborhood.handleSecondaryAction}
            onSave={handleSaveNeighborhood}
            onDeleteRequest={(data) => setDeleteTarget({ kind: 'neighborhood', entry: data })}
            onFieldChange={neighborhood.handleFieldChange}
          />
        ))}

        <Box>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<AddCircleOutlinedIcon fontSize="small" />}
            onClick={neighborhood.handleAddEntry}
          >
            Agregar otra referencia vecinal…
          </Button>
        </Box>
      </Stack>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.kind === 'personal' ? 'Eliminar referencia personal' : 'Eliminar referencia vecinal'}
        description={
          deleteTarget
            ? `¿Confirmas que deseas eliminar la referencia de "${deleteTarget.entry.name || 'esta persona'}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Sí, eliminar"
        severity="error"
        loading={isDeletePending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Stack>
  );
}
