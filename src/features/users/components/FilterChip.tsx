import { useState, type MouseEvent } from 'react';
import { Chip, Menu, MenuItem } from '@mui/material';

interface FilterChipOption {
  value: string;
  label: string;
}

interface FilterChipProps {
  label: string;
  value: string;
  options: FilterChipOption[];
  onChange: (value: string) => void;
  onRemove: () => void;
}

/** Chip de filtro activo: clic en el cuerpo cambia el valor, clic en la "x" lo quita por completo. */
export function FilterChip({ label, value, options, onChange, onRemove }: FilterChipProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <>
      <Chip
        label={`${label}: ${currentLabel}`}
        onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
        onDelete={onRemove}
        sx={{
          bgcolor: 'rgba(0,74,152,0.06)',
          color: 'primary.main',
          fontWeight: 600,
          '& .MuiChip-deleteIcon': { color: 'primary.main' },
        }}
      />
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === value}
            onClick={() => {
              onChange(option.value);
              setAnchor(null);
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
