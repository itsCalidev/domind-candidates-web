import { useState } from 'react';
import { Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { ClearableTextField } from '@/shared/components/ClearableTextField';
import { useCandidateMutations } from '../hooks/useCandidateMutations';
import type { CandidateCaptureStatus, CandidateGeneralInfo } from '../types/candidate.types';
import { maritalStatusLabels } from '../utils/maritalStatus';

interface GeneralInfoTabProps {
  candidateId: string;
  info: CandidateGeneralInfo;
  captureStatus: CandidateCaptureStatus;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Grid>
  );
}

/**
 * Placeholder que candidateService.ts pone en `generalInfo` cuando el
 * backend no trae el dato (ej. `data.personal?.address || 'No registrado'`)
 * — es texto de UI, no un valor real, así que no debe filtrarse al
 * formulario de edición como si el candidato lo hubiera capturado.
 */
const NOT_REGISTERED = 'No registrado';

interface EditableForm {
  firstName: string;
  lastName: string;
  address: string;
  neighborhood: string;
  postalCode: string;
  phone: string;
  email: string;
  birthDate: string;
  birthPlace: string;
  maritalStatus: string;
}

function buildEditableForm(info: CandidateGeneralInfo): EditableForm {
  const clean = (value: string) => (value === NOT_REGISTERED ? '' : value);
  return {
    firstName: info.firstName,
    lastName: info.lastName,
    address: clean(info.address),
    neighborhood: clean(info.neighborhood),
    postalCode: clean(info.postalCode),
    phone: clean(info.phone),
    email: clean(info.email),
    birthDate: clean(info.birthDate),
    birthPlace: clean(info.birthPlace),
    // Si el valor guardado no es una clave válida de maritalStatusLabels
    // (nunca se capturó, o es el placeholder de arriba), el Select debe
    // arrancar vacío en vez de con un value que no matchea ningún MenuItem.
    maritalStatus: maritalStatusLabels[info.civilStatus] ? info.civilStatus : '',
  };
}

/**
 * Única pestaña de detalle con toggle lectura/edición: mientras el
 * candidato sigue en captura manual sin terminar (`captureStatus ===
 * 'DRAFT'`), el reclutador puede corregir sus datos personales a mano.
 * Una vez `COMPLETED`, esta vista vuelve a ser de solo lectura — ni
 * siquiera se renderiza el botón "Editar" (regla de negocio dada
 * explícitamente por el usuario, no una decisión de UI).
 */
export function GeneralInfoTab({ candidateId, info, captureStatus }: GeneralInfoTabProps) {
  const { updatePersonalInfo } = useCandidateMutations();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditableForm>(() => buildEditableForm(info));
  const canEdit = captureStatus === 'DRAFT';
  const isSaving = updatePersonalInfo.isPending;

  function handleStartEditing() {
    setForm(buildEditableForm(info));
    setIsEditing(true);
  }

  function handleFieldChange(field: keyof EditableForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    try {
      await updatePersonalInfo.mutateAsync({ id: candidateId, payload: form });
      setIsEditing(false);
    } catch {
      // El toast de error ya lo emite useCandidateMutations; el formulario
      // se queda abierto con lo que el usuario escribió, para reintentar.
    }
  }

  if (isEditing) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ClearableTextField
              label="Nombre(s)"
              fullWidth
              disabled={isSaving}
              value={form.firstName}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              onClear={() => handleFieldChange('firstName', '')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ClearableTextField
              label="Apellido(s)"
              fullWidth
              disabled={isSaving}
              value={form.lastName}
              onChange={(e) => handleFieldChange('lastName', e.target.value)}
              onClear={() => handleFieldChange('lastName', '')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              label="Estado civil"
              fullWidth
              disabled={isSaving}
              value={form.maritalStatus}
              onChange={(e) => handleFieldChange('maritalStatus', e.target.value)}
            >
              <MenuItem value="">
                <em>Sin especificar</em>
              </MenuItem>
              {Object.entries(maritalStatusLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ClearableTextField
              label="Domicilio"
              fullWidth
              disabled={isSaving}
              value={form.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              onClear={() => handleFieldChange('address', '')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ClearableTextField
              label="Colonia"
              fullWidth
              disabled={isSaving}
              value={form.neighborhood}
              onChange={(e) => handleFieldChange('neighborhood', e.target.value)}
              onClear={() => handleFieldChange('neighborhood', '')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ClearableTextField
              label="Código postal"
              fullWidth
              disabled={isSaving}
              value={form.postalCode}
              onChange={(e) => handleFieldChange('postalCode', e.target.value)}
              onClear={() => handleFieldChange('postalCode', '')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ClearableTextField
              label="Teléfono"
              fullWidth
              disabled={isSaving}
              value={form.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              onClear={() => handleFieldChange('phone', '')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ClearableTextField
              label="Correo electrónico"
              type="email"
              fullWidth
              disabled={isSaving}
              value={form.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onClear={() => handleFieldChange('email', '')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Fecha de nacimiento"
              type="date"
              fullWidth
              disabled={isSaving}
              value={form.birthDate}
              onChange={(e) => handleFieldChange('birthDate', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ClearableTextField
              label="Lugar de nacimiento"
              fullWidth
              disabled={isSaving}
              value={form.birthPlace}
              onChange={(e) => handleFieldChange('birthPlace', e.target.value)}
              onClear={() => handleFieldChange('birthPlace', '')}
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
          <Button variant="contained" size="small" disabled={isSaving} onClick={handleSave}>
            {isSaving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            disabled={isSaving}
            onClick={() => setIsEditing(false)}
          >
            Cancelar
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      {canEdit && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
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
      <Grid container spacing={3}>
        <Field label="Nombre completo" value={info.fullName} />
        <Field label="Puesto solicitado" value={info.positionApplied} />
        <Field
          label="Estado civil"
          value={maritalStatusLabels[info.civilStatus] ?? info.civilStatus}
        />
        <Field label="Domicilio" value={info.address} />
        <Field label="Colonia" value={info.neighborhood} />
        <Field label="Código postal" value={info.postalCode} />
        <Field label="Teléfono" value={info.phone} />
        <Field label="Correo electrónico" value={info.email} />
        <Field label="Fecha de nacimiento" value={info.birthDate} />
        <Field label="Lugar de nacimiento" value={info.birthPlace} />
      </Grid>
    </Paper>
  );
}
