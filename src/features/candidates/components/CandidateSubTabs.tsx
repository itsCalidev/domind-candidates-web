import { Box, Tab, Tabs } from '@mui/material';
import type { ReactNode } from 'react';

export interface SubTabDefinition {
  label: string;
  content: ReactNode;
}

interface CandidateSubTabsProps {
  tabs: SubTabDefinition[];
  activeIndex: number;
  onChange: (index: number) => void;
}

/**
 * Segundo nivel de navegación dentro de una pestaña principal de
 * CandidateDetailPage. Vive aparte porque las 3 pestañas principales
 * (Identidad y Entorno / Estabilidad y Calidad de Vida / Comportamiento
 * y Trayectoria) lo reutilizan idéntico — solo cambia qué `tabs` reciben.
 * Más angosto y sin el borde inferior de las pestañas principales, para
 * que la jerarquía visual (principal vs. sub) quede clara de un vistazo.
 */
export function CandidateSubTabs({ tabs, activeIndex, onChange }: CandidateSubTabsProps) {
  return (
    <Box>
      <Tabs
        value={activeIndex}
        onChange={(_, value: number) => onChange(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          minHeight: 38,
          '& .MuiTab-root': { minHeight: 38, py: 1, fontSize: 13 },
        }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.label} label={tab.label} sx={{ textTransform: 'none', fontWeight: 500 }} />
        ))}
      </Tabs>
      {tabs[activeIndex]?.content}
    </Box>
  );
}
