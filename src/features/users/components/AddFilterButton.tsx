import { useState, type MouseEvent } from 'react';
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';

interface FilterOption {
  key: string;
  label: string;
}

interface AddFilterButtonProps {
  /** Solo los filtros que todavía NO están activos. */
  options: FilterOption[];
  onAdd: (key: string) => void;
}

export function AddFilterButton({ options, onAdd }: AddFilterButtonProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (options.length === 0) return null;

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        startIcon={<FilterListOutlinedIcon fontSize="small" />}
        onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
        sx={{
          borderColor: 'divider',
          color: 'text.secondary',
          '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'rgba(0,74,152,0.04)' },
        }}
      >
        Filtro
      </Button>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: 2.5, minWidth: 200 } } }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.key}
            onClick={() => {
              onAdd(option.key);
              setAnchor(null);
            }}
          >
            <ListItemIcon>
              <TuneOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
