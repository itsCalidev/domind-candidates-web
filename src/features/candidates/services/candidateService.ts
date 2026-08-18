import { apiClient } from '@/lib/http/apiClient';
import type { PaginatedResponse } from '@/shared/types/pagination';
import type {
  AssignedRecruiter,
  BankCard,
  CandidateDetail,
  CandidateListItem,
  CandidateStatus,
  Debt,
  Income,
  Vehicle,
} from '../types/candidate.types';

interface DetailedCandidateList {
  id: string;
  folio: string;
  status: CandidateStatus;
  isActive: boolean;
  companyName: string;
  positionName: string;
  /** Ausente/nulo cuando nadie tiene asignado al candidato. */
  assignedRecruiter?: AssignedRecruiter | null;
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
/**
 * Shapes crudas de family/health/housing/economy tal como las devuelve
 * GET /candidates/:id. Los nombres de campo están confirmados contra
 * los DTO reales de PATCH /candidates/:id/{family,health,housing,economy}
 * en /docs-json (Swagger no documenta el shape de las respuestas GET,
 * pero los PATCH comparten el mismo modelo Prisma). El bloque `identity`
 * (CURP/RFC/IMSS/licencia) queda fuera: no existe DTO ni endpoint que lo
 * confirme todavía, así que su pestaña sigue como "Próximamente".
 *
 * OJO: `familyMembers`, `incomes`, `vehicles`, `debts` y `bankCards` NO
 * viven anidados dentro de `family`/`economy` como su DTO de escritura
 * sugeriría — el backend los devuelve como arreglos hermanos en la raíz
 * del objeto candidato (confirmado en vivo por el usuario, es el diseño
 * de la base de datos relacional). Por eso se declaran en
 * BackendCandidateDetail, no en RawFamily/RawEconomy.
 */
interface RawFamily {
  hasGovRelatives?: boolean | null;
  govRelativesDetails?: string | null;
  hasPoliticalPosts?: boolean | null;
  politicalPostsDetails?: string | null;
}

interface RawHealth {
  chronicDiseasesFamily?: boolean | null;
  chronicDiseasesDetails?: string | null;
  healthcareAccess?: string[];
  usesGlasses?: boolean | null;
  height?: number | null;
  weight?: number | null;
  physicalAspect?: string | null;
  currentHealth?: string | null;
  pastDiseases?: string | null;
  surgeries?: string | null;
  alcoholFrequency?: string | null;
  alcoholTypes?: string[];
  smokes?: boolean | null;
  cigarettesPerDay?: number | null;
  smokingExpensePerWeek?: number | null;
  usedDrugs?: boolean | null;
  drugsDetails?: string | null;
}

interface RawHousing {
  propertyOwner?: string | null;
  timeLivingThere?: string | null;
  previousAddress?: string | null;
  hasInfonavitDebt?: boolean | null;
  infonavitAmount?: number | null;
  infonavitCreditNumber?: string | null;
  housingConditions?: string | null;
  housingType?: string | null;
  roomsCount?: number | null;
  livingRoomCount?: number | null;
  diningRoomCount?: number | null;
  kitchenCount?: number | null;
  bathroomsCount?: number | null;
  patioCount?: number | null;
  publicServices?: string[];
}

interface RawEconomy {
  expensesFood?: number | null;
  expensesLight?: number | null;
  expensesGas?: number | null;
  expensesPhone?: number | null;
  expensesTransport?: number | null;
  expensesEducation?: number | null;
  expensesMedical?: number | null;
  expensesRentOther?: number | null;
  expensesExtra?: number | null;
  expensesTotal?: number | null;
  hasOtherIncome?: boolean | null;
  otherIncomeDetails?: string | null;
}

interface RawFamilyMember {
  name: string;
  relationship?: string | null;
  age?: number | null;
  occupation?: string | null;
  education?: string | null;
  maritalStatus?: string | null;
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
  family?: RawFamily;
  familyMembers?: RawFamilyMember[];
  health?: RawHealth;
  housing?: RawHousing;
  economy?: RawEconomy;
  incomes?: Income[];
  vehicles?: Vehicle[];
  debts?: Debt[];
  bankCards?: BankCard[];
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
      assignedRecruiter: c.assignedRecruiter ?? null,
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
      assignedRecruiter: data.assignedRecruiter ?? null,
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
      family: {
        hasGovRelatives: data.family?.hasGovRelatives ?? null,
        govRelativesDetails: data.family?.govRelativesDetails ?? null,
        hasPoliticalPosts: data.family?.hasPoliticalPosts ?? null,
        politicalPostsDetails: data.family?.politicalPostsDetails ?? null,
      },
      familyMembers: (data.familyMembers ?? []).map((member) => ({
        name: member.name,
        relationship: member.relationship ?? null,
        age: member.age ?? null,
        occupation: member.occupation ?? null,
        education: member.education ?? null,
        maritalStatus: member.maritalStatus ?? null,
      })),
      health: {
        chronicDiseasesFamily: data.health?.chronicDiseasesFamily ?? null,
        chronicDiseasesDetails: data.health?.chronicDiseasesDetails ?? null,
        healthcareAccess: data.health?.healthcareAccess ?? [],
        usesGlasses: data.health?.usesGlasses ?? null,
        height: data.health?.height ?? null,
        weight: data.health?.weight ?? null,
        physicalAspect: data.health?.physicalAspect ?? null,
        currentHealth: data.health?.currentHealth ?? null,
        pastDiseases: data.health?.pastDiseases ?? null,
        surgeries: data.health?.surgeries ?? null,
        alcoholFrequency: data.health?.alcoholFrequency ?? null,
        alcoholTypes: data.health?.alcoholTypes ?? [],
        smokes: data.health?.smokes ?? null,
        cigarettesPerDay: data.health?.cigarettesPerDay ?? null,
        smokingExpensePerWeek: data.health?.smokingExpensePerWeek ?? null,
        usedDrugs: data.health?.usedDrugs ?? null,
        drugsDetails: data.health?.drugsDetails ?? null,
      },
      housing: {
        propertyOwner: data.housing?.propertyOwner ?? null,
        timeLivingThere: data.housing?.timeLivingThere ?? null,
        previousAddress: data.housing?.previousAddress ?? null,
        hasInfonavitDebt: data.housing?.hasInfonavitDebt ?? null,
        infonavitAmount: data.housing?.infonavitAmount ?? null,
        infonavitCreditNumber: data.housing?.infonavitCreditNumber ?? null,
        housingConditions: data.housing?.housingConditions ?? null,
        housingType: data.housing?.housingType ?? null,
        roomsCount: data.housing?.roomsCount ?? null,
        livingRoomCount: data.housing?.livingRoomCount ?? null,
        diningRoomCount: data.housing?.diningRoomCount ?? null,
        kitchenCount: data.housing?.kitchenCount ?? null,
        bathroomsCount: data.housing?.bathroomsCount ?? null,
        patioCount: data.housing?.patioCount ?? null,
        publicServices: data.housing?.publicServices ?? [],
      },
      economy: {
        expensesFood: data.economy?.expensesFood ?? null,
        expensesLight: data.economy?.expensesLight ?? null,
        expensesGas: data.economy?.expensesGas ?? null,
        expensesPhone: data.economy?.expensesPhone ?? null,
        expensesTransport: data.economy?.expensesTransport ?? null,
        expensesEducation: data.economy?.expensesEducation ?? null,
        expensesMedical: data.economy?.expensesMedical ?? null,
        expensesRentOther: data.economy?.expensesRentOther ?? null,
        expensesExtra: data.economy?.expensesExtra ?? null,
        expensesTotal: data.economy?.expensesTotal ?? null,
        hasOtherIncome: data.economy?.hasOtherIncome ?? null,
        otherIncomeDetails: data.economy?.otherIncomeDetails ?? null,
      },
      incomes: data.incomes ?? [],
      vehicles: data.vehicles ?? [],
      debts: data.debts ?? [],
      bankCards: data.bankCards ?? [],
    };
  },

  /**
   * PATCH /candidates/:id/assign — asigna o remueve al reclutador.
   * `recruiterId: null` es la forma explícita de desasignar según
   * AssignRecruiterDto; no es lo mismo que omitir el campo, que el
   * backend rechaza (el DTO lo marca como requerido).
   */
  async assignRecruiter(id: string, recruiterId: string | null): Promise<void> {
    await apiClient.patch(`/candidates/${id}/assign`, { recruiterId });
  },

  /**
   * PATCH /candidates/:id/status — body { status } según
   * UpdateCandidateStatusDto (confirmado en /docs-json). El backend ya
   * registra UPDATE_CANDIDATE_STATUS en ActivityLog por su cuenta; este
   * método no hace nada más que la llamada.
   */
  async updateStatus(id: string, status: CandidateStatus): Promise<void> {
    await apiClient.patch(`/candidates/${id}/status`, { status });
  },

  /**
   * GET /candidates/export/excel/:id — reporte pre-llenado del
   * candidato, generado por el backend (no confundir con el Excel del
   * LISTADO que arma candidateExport.ts en el cliente). `responseType:
   * 'blob'` es obligatorio: sin esto, axios intenta parsear la
   * respuesta binaria como JSON/texto y la corrompe.
   */
  async exportExcel(id: string): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/candidates/export/excel/${id}`, {
      responseType: 'blob',
    });
    return data;
  },
};
