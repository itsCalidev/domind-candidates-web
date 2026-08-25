import { IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';

/**
 * Intersección, no `interface ... extends`: `TextFieldProps` en MUI v7 es
 * una unión discriminada (varía según `variant`), no un tipo de objeto
 * plano — TS no permite heredar de eso con `extends`.
 */
export type ClearableTextFieldProps = TextFieldProps & {
  /** Vacía el valor de ESTE campo únicamente — el padre decide cómo actualizar su estado. */
  onClear: () => void;
};

/**
 * `TextField` genérico con una "X" al final que borra su valor — útil en
 * formularios largos donde corregir un campo campo con retroceso es
 * lento. No conoce ningún dominio: cualquier feature lo reutiliza.
 * El ícono solo aparece con valor presente y campo habilitado, mismo
 * criterio que el toggle de mostrar/ocultar contraseña ya usado en
 * LoginPage.tsx (endAdornment condicional dentro de slotProps.input).
 */
export function ClearableTextField({ onClear, value, slotProps, disabled, ...props }: ClearableTextFieldProps) {
  const hasValue = typeof value === 'string' && value.length > 0;
  const inputSlotProps = slotProps?.input && typeof slotProps.input === 'object' ? slotProps.input : {};

  return (
    <TextField
      {...props}
      value={value}
      disabled={disabled}
      slotProps={{
        ...slotProps,
        input: {
          ...inputSlotProps,
          endAdornment:
            hasValue && !disabled ? (
              <InputAdornment position="end">
                <IconButton onClick={onClear} edge="end" size="small" aria-label="Limpiar campo">
                  <ClearOutlinedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
        },
      }}
    />
  );
}
