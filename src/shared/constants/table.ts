import type { SxProps, Theme } from '@mui/material';

/**
 * Tamaños de página estándar para CUALQUIER tabla paginada del sistema
 * (Users, Candidates, y lo que venga: Positions, Companies...).
 * Agregar un tamaño nuevo es editar este arreglo — nada más en el
 * proyecto debe tener tamaños de página hardcodeados.
 */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export const DEFAULT_PAGE_SIZE: number = PAGE_SIZE_OPTIONS[0];

/**
 * Altura máxima antes de que aparezca scroll interno en el cuerpo de
 * una tabla larga, en vez de estirar verticalmente toda la página.
 * Un solo valor centralizado — cualquier tabla futura lo reutiliza.
 */
export const TABLE_MAX_HEIGHT = 560;

/** sx para el <TableContainer>: scroll interno una vez superada la altura máxima. */
export const scrollableTableContainerSx: SxProps<Theme> = {
  maxHeight: TABLE_MAX_HEIGHT,
  overflow: 'auto',
};

/**
 * sx para cada <TableCell> dentro de <TableHead>: encabezado fijo
 * (sticky) mientras se hace scroll en el cuerpo. Se aplica celda por
 * celda (no a <TableHead> completo) porque `position: sticky` no
 * funciona sobre <tr>/<thead> de forma confiable entre navegadores —
 * sí funciona de forma consistente aplicado a cada <th>.
 *
 * `isolation: 'isolate'` es la parte que corrige el bug de clics que
 * "atraviesan" al header y llegan a una fila del cuerpo: sin esto, el
 * navegador puede comparar el z-index del header contra el contexto de
 * apilamiento que genera una fila del cuerpo (hover, opacity condicional,
 * el ripple interno del Checkbox) de forma ambigua, y el hit-testing del
 * clic no siempre coincide con lo que se ve pintado en pantalla.
 * `isolation: isolate` obliga a que este elemento sea la raíz de su
 * propio contexto de apilamiento, así la comparación de z-index deja de
 * depender de lo que ocurra más abajo en el DOM.
 */
export const stickyTableHeadCellSx: SxProps<Theme> = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  bgcolor: 'background.paper',
  isolation: 'isolate',
};
