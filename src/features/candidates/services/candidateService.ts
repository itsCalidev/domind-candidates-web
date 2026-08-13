import { apiClient } from '@/lib/http/apiClient';
import type { PaginatedResponse } from '@/shared/types/pagination';
import type { CandidateDetail, CandidateListItem, CandidateStatus } from '../types/candidate.types';

interface DetailedCandidateList {
  id: string;
  folio: string;
  status: CandidateStatus;
  isActive: boolean;
  companyName: string;
  positionName: string;
  personal?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface RawCandidatesListResponse {
  data: DetailedCandidateList[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
// 1. La estructura exacta del Detalle que nos devuelve NestJS (Prisma)
interface BackendCandidateDetail extends DetailedCandidateList {
  personal?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    neighborhood: string;
    postalCode: string;
    birthDate: string;
    birthPlace: string;
    maritalStatus: string; // En el back es maritalStatus
  };
  // Identity vendrá después
}

// 2. Query Params permitidos por nuestro Backend DTO
export interface GetCandidatesQuery {
  page: number;
  limit: number;
  search?: string;
  status?: CandidateStatus;
  isActive?: boolean;
}

export const candidatesService = {
  async getList(query: GetCandidatesQuery): Promise<PaginatedResponse<CandidateListItem>> {
    const { data } = await apiClient.get<RawCandidatesListResponse>('/candidates', { params: query });

    const items: CandidateListItem[] = data.data.map((c) => ({
      id: c.id,
      folio: c.folio,
      fullName: c.personal ? `${c.personal.firstName} ${c.personal.lastName}` : 'Sin nombre',
      email: c.personal ? c.personal.email : 'Sin correo',
      companyName: c.companyName,
      positionName: c.positionName,
      status: c.status,
      isActive: c.isActive,
    }));

    return {
      items,
      pagination: data.meta,
    };
  },

  async getById(id: string): Promise<CandidateDetail> {
    const { data } = await apiClient.get<BackendCandidateDetail>(`/candidates/${id}`);

    // Mapeamos la respuesta del backend a la interfaz que espera tu CandidateDetailPage
    return {
      id: data.id,
      folio: data.folio,
      fullName: data.personal ? `${data.personal.firstName} ${data.personal.lastName}` : 'Sin nombre',
      email: data.personal?.email || '',
      companyName: data.companyName,
      positionName: data.positionName,
      status: data.status,
      isActive: data.isActive,
      generalInfo: {
        fullName: data.personal ? `${data.personal.firstName} ${data.personal.lastName}` : 'Sin nombre',
        positionApplied: data.positionName,
        address: data.personal?.address || 'No registrado',
        neighborhood: data.personal?.neighborhood || 'No registrado',
        postalCode: data.personal?.postalCode || 'No registrado',
        phone: data.personal?.phone || 'No registrado',
        email: data.personal?.email || 'No registrado',
        birthDate: data.personal?.birthDate ? data.personal.birthDate.split('T')[0] : 'No registrado',
        birthPlace: data.personal?.birthPlace || 'No registrado',
        civilStatus: data.personal?.maritalStatus || 'No registrado',
      },
    };
  },
};
