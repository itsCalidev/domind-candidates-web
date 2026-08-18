/**
 * Formatea un monto en pesos mexicanos ("$1,250.00"). `null`/`undefined`
 * se tratan como "sin capturar", no como cero — un candidato sin egreso de
 * gas no es lo mismo que uno con $0 de gas.
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'No especificado';

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}
