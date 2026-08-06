import { useState, type MouseEvent } from 'react';
import { Box, Chip, Menu, MenuItem, Typography } from '@mui/material';

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
        label={
          <Box component="span" sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography component="span" variant="caption" sx={{ opacity: 0.75, fontWeight: 500 }}>
              {label}
            </Typography>
            <Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>
              {currentLabel}
            </Typography>
          </Box>
        }
        onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
        onDelete={onRemove}
        sx={{
          height: 32,
          bgcolor: 'rgba(0,74,152,0.06)',
          color: 'primary.main',
          border: '1px solid rgba(0,74,152,0.16)',
          '& .MuiChip-deleteIcon': { color: 'primary.main', opacity: 0.7 },
          '& .MuiChip-deleteIcon:hover': { opacity: 1 },
          '&:hover': { bgcolor: 'rgba(0,74,152,0.1)' },
        }}
      />
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: 2.5, minWidth: 180 } } }}
      >
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
