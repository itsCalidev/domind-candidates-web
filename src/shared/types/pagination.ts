export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Contrato genérico para cualquier endpoint paginado (Users, Candidates,
 * Companies, Documents...). No tiene conocimiento de ningún dominio.
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}
