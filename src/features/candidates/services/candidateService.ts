import { apiClient } from '@/lib/http/apiClient';
import type { PaginatedResponse } from '@/shared/types/pagination';
import type {
  AssignedRecruiter,
  BankCard,
  CandidateCaptureMode,
  CandidateCaptureStatus,
  CandidateDetail,
  CandidateHousingPayload,
  CandidateInterviewerIntegration,
  CandidateListItem,
  CandidateSocialNetwork,
  CandidateStatus,
  CreateAndAssignCandidatePayload,
  Debt,
  EvaluationRating,
  EvaluationSection,
  EvidenceCategory,
  EvidencePhoto,
  Income,
  InterviewerIntegrationPayload,
  NeighborhoodReferenceEntry,
  NeighborhoodReferencePayload,
  PersonalInfoPayload,
  PersonalReferenceEntry,
  PersonalReferencePayload,
  ReportSummaryResponse,
  SectionEvaluation,
  SocialNetworkPayload,
  Vehicle,
  WorkHistoryEntry,
  WorkHistoryPayload,
} from '../types/candidate.types';

interface DetailedCandidateList {
  id: string;
  folio: string;
  status: CandidateStatus;
  isActive: boolean;
  companyName: string;
  positionName: string;
  captureMode: CandidateCaptureMode;
  captureStatus: CandidateCaptureStatus;
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
  // Hábitos de vida: ver el comentario en CandidateHealth
  // (candidate.types.ts) — no confirmados todavía en /docs-json.
  dietQuality?: string | null;
  physicalActivity?: string | null;
  sedentaryHours?: number | null;
  screenTimeHours?: number | null;
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

/**
 * Shape crudo de cada antecedente laboral bajo `workHistories` (nombre
 * de campo confirmado por el usuario, no documentado en /docs-json).
 * Todos opcionales/nullable por seguridad — se normalizan a `''` en
 * getById() porque WorkHistoryEntry los tipa como `string`, no
 * `string | null` (son campos de formulario, no datos de solo lectura).
 */
interface RawWorkHistoryEntry {
  id: string;
  companyName?: string | null;
  address?: string | null;
  activity?: string | null;
  contactNamePhone?: string | null;
  candidatePosition?: string | null;
  companyPosition?: string | null;
  candidatePeriod?: string | null;
  companyPeriod?: string | null;
  candidateBoss?: string | null;
  companyBoss?: string | null;
  candidateSalary?: string | null;
  companySalary?: string | null;
  candidateSeparation?: string | null;
  companySeparation?: string | null;
  companyComments?: string | null;
}

/**
 * Shape crudo de cada referencia bajo `personalReferences`/
 * `neighborhoodReferences` (nombres confirmados por el usuario, no
 * documentados en /docs-json). Igual que RawWorkHistoryEntry, todos
 * opcionales/nullable salvo `id`, normalizados a `''` en getById().
 */
interface RawPersonalReferenceEntry {
  id: string;
  name?: string | null;
  occupation?: string | null;
  timeKnown?: string | null;
  phone?: string | null;
}

interface RawNeighborhoodReferenceEntry {
  id: string;
  name?: string | null;
  occupation?: string | null;
  timeKnown?: string | null;
  address?: string | null;
  opinion?: string | null;
}

/**
 * Shape crudo de `socialNetwork` (nombre de campo confirmado por el
 * usuario, no documentado en /docs-json). Puede traer campos de control
 * (`id`/`createdAt`/`updatedAt`) que el mapeo campo por campo de
 * getById() nunca copia — a diferencia de workHistories/referencias,
 * aquí no hace falta "limpiarlos" en el componente porque nunca entran
 * al estado local.
 */
interface RawCandidateSocialNetwork {
  facebook?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  profileComments?: string | null;
}

/** Shape crudo de `interviewerIntegration` — mismo criterio que RawCandidateSocialNetwork. */
interface RawCandidateInterviewerIntegration {
  comment?: string | null;
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
    spouseBirthDate?: string | null;
    highestEducation?: string | null;
    studiesProofType?: string | null;
    studiesProofDate?: string | null;
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
  workHistories?: RawWorkHistoryEntry[];
  personalReferences?: RawPersonalReferenceEntry[];
  neighborhoodReferences?: RawNeighborhoodReferenceEntry[];
  socialNetwork?: RawCandidateSocialNetwork | null;
  interviewerIntegration?: RawCandidateInterviewerIntegration | null;
  // Identity vendrá después
}

/**
 * Shape crudo de GET /candidates/:id/evaluations — endpoint dedicado,
 * separado de GET /candidates/:id. `comments` llega como `string` (no
 * `string | null`); se normaliza en getEvaluations().
 */
interface RawSectionEvaluation {
  section: string;
  rating: string;
  comments: string;
}

interface RawEvaluationsResponse {
  evaluations: RawSectionEvaluation[];
  currentCount: number;
  required: number;
}

export interface CandidateEvaluationsSummary {
  evaluations: SectionEvaluation[];
  currentCount: number;
  required: number;
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
      captureMode: c.captureMode,
      captureStatus: c.captureStatus,
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
      captureMode: data.captureMode,
      captureStatus: data.captureStatus,
      generalInfo: {
        fullName: data.personal ? `${data.personal.firstName} ${data.personal.lastName}` : 'Sin nombre',
        firstName: data.personal?.firstName || '',
        lastName: data.personal?.lastName || '',
        positionApplied: data.positionName,
        address: data.personal?.address || 'No registrado',
        neighborhood: data.personal?.neighborhood || 'No registrado',
        postalCode: data.personal?.postalCode || 'No registrado',
        phone: data.personal?.phone || 'No registrado',
        email: data.personal?.email || 'No registrado',
        birthDate: data.personal?.birthDate ? data.personal.birthDate.split('T')[0] : 'No registrado',
        birthPlace: data.personal?.birthPlace || 'No registrado',
        civilStatus: data.personal?.maritalStatus || 'No registrado',
        spouseBirthDate: data.personal?.spouseBirthDate
          ? data.personal.spouseBirthDate.split('T')[0]
          : 'No registrado',
        highestEducation: data.personal?.highestEducation || 'No registrado',
        studiesProofType: data.personal?.studiesProofType || 'No registrado',
        studiesProofDate: data.personal?.studiesProofDate
          ? data.personal.studiesProofDate.split('T')[0]
          : 'No registrado',
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
        dietQuality: data.health?.dietQuality ?? null,
        physicalActivity: data.health?.physicalActivity ?? null,
        sedentaryHours: data.health?.sedentaryHours ?? null,
        screenTimeHours: data.health?.screenTimeHours ?? null,
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
      workHistories: (data.workHistories ?? []).map((entry) => ({
        id: entry.id,
        companyName: entry.companyName ?? '',
        address: entry.address ?? '',
        activity: entry.activity ?? '',
        contactNamePhone: entry.contactNamePhone ?? '',
        candidatePosition: entry.candidatePosition ?? '',
        companyPosition: entry.companyPosition ?? '',
        candidatePeriod: entry.candidatePeriod ?? '',
        companyPeriod: entry.companyPeriod ?? '',
        candidateBoss: entry.candidateBoss ?? '',
        companyBoss: entry.companyBoss ?? '',
        candidateSalary: entry.candidateSalary ?? '',
        companySalary: entry.companySalary ?? '',
        candidateSeparation: entry.candidateSeparation ?? '',
        companySeparation: entry.companySeparation ?? '',
        companyComments: entry.companyComments ?? '',
      })),
      personalReferences: (data.personalReferences ?? []).map((entry) => ({
        id: entry.id,
        name: entry.name ?? '',
        occupation: entry.occupation ?? '',
        timeKnown: entry.timeKnown ?? '',
        phone: entry.phone ?? '',
      })),
      neighborhoodReferences: (data.neighborhoodReferences ?? []).map((entry) => ({
        id: entry.id,
        name: entry.name ?? '',
        occupation: entry.occupation ?? '',
        timeKnown: entry.timeKnown ?? '',
        address: entry.address ?? '',
        opinion: entry.opinion ?? '',
      })),
      socialNetwork: {
        facebook: data.socialNetwork?.facebook ?? '',
        linkedin: data.socialNetwork?.linkedin ?? '',
        instagram: data.socialNetwork?.instagram ?? '',
        profileComments: data.socialNetwork?.profileComments ?? '',
      },
      interviewerIntegration: {
        comment: data.interviewerIntegration?.comment ?? '',
      },
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
   * PATCH /candidates/:id/capture-status — body { captureStatus }, ruta
   * dedicada distinta de `updateStatus` (no existe un PATCH genérico de
   * candidato). Contrato dado directamente por el usuario en el chat.
   */
  async updateCaptureStatus(id: string, captureStatus: CandidateCaptureStatus): Promise<void> {
    await apiClient.patch(`/candidates/${id}/capture-status`, { captureStatus });
  },

  /**
   * PATCH /candidates/:id/personal — actualiza los datos personales del
   * candidato (pestaña Información General). Contrato dado directamente
   * por el usuario en el chat, incluyendo que `maritalStatus` es el
   * nombre que espera el backend (no `civilStatus`, que es solo el
   * nombre usado en CandidateGeneralInfo para el valor ya mapeado).
   *
   * `Partial`, no el objeto completo: GeneralInfoTab solo manda los
   * campos que el reclutador realmente tocó (dirty fields de
   * react-hook-form), por pedido explícito del usuario — no reenvía los
   * que no cambiaron.
   */
  async updatePersonalInfo(id: string, payload: Partial<PersonalInfoPayload>): Promise<void> {
    await apiClient.patch(`/candidates/${id}/personal`, payload);
  },

  /**
   * POST /candidates/:id/magic-link — genera y envía al candidato el
   * enlace de autollenado (ver Fase 1-3 de Magic Link). Contrato dado
   * directamente por el usuario en el chat, sin body ni shape de
   * respuesta confirmados — se trata como una acción sin retorno útil,
   * mismo criterio que `updateStatus`/`submitForm`.
   */
  async sendMagicLink(id: string): Promise<void> {
    await apiClient.post(`/candidates/${id}/magic-link`);
  },

  /**
   * POST /candidates — da de alta al candidato, lo asigna al reclutador
   * elegido y dispara la notificación según `fillMode` (confirmado por el
   * usuario: el backend ya implementa este endpoint con el mismo payload
   * que arma `CreateAndAssignCandidateDialog`). Sin shape de respuesta
   * confirmado, así que se trata como una acción sin retorno útil, igual
   * que `updateStatus`/`sendMagicLink`.
   */
  async createAndAssignCandidate(payload: CreateAndAssignCandidatePayload): Promise<void> {
    await apiClient.post('/candidates', payload);
  },

  /**
   * PATCH /candidates/:id/housing — ruta híbrida (Magic Link Fase 1):
   * acepta el JWT normal de un reclutador O el header `x-magic-link` que
   * `apiClient` ya inyecta solo si hay un token guardado (ver
   * magicLinkStorage.ts). Nombres de campo confirmados contra el DTO real
   * en /docs-json (mismo comentario histórico que respalda `RawHousing`
   * arriba), no inventados para esta pieza nueva. Shape de la respuesta
   * no confirmado — se trata como una acción sin retorno útil, igual que
   * `updateStatus`.
   */
  async updateHousing(id: string, payload: CandidateHousingPayload): Promise<void> {
    await apiClient.patch(`/candidates/${id}/housing`, payload);
  },

  /**
   * POST /candidates/:id/submit-form — exclusivo del flujo de Magic Link:
   * requiere `x-magic-link` (lo inyecta `apiClient`), quema el token en
   * el backend para que no se reuse y notifica al reclutador asignado.
   * Contrato dado directamente por el usuario en el chat; el shape de la
   * respuesta no se confirmó, así que se trata como una acción sin
   * retorno útil.
   */
  async submitForm(id: string): Promise<void> {
    await apiClient.post(`/candidates/${id}/submit-form`);
  },

  /**
   * GET /candidates/:id/report-summary — resumen para el reporte PDF
   * generado en el cliente (ver CandidateReportTemplate + html2canvas,
   * en useCandidateReportPdf.ts). Contrato confirmado por el usuario en
   * el chat (Swagger solo define ruta/método, no el shape de la
   * respuesta). Reemplaza a exportExcel: el reporte ya no lo arma el
   * backend como Excel, se arma en el cliente a partir de este JSON.
   */
  async getReportSummary(id: string): Promise<ReportSummaryResponse> {
    const { data } = await apiClient.get<ReportSummaryResponse>(`/candidates/${id}/report-summary`);
    return data;
  },

  /**
   * PUT /candidates/:id/evaluations/:section — body { rating, comments? }.
   * Contrato confirmado por el usuario en el chat (no documentado en
   * /docs-json todavía): rating es 'GREEN'|'YELLOW'|'RED', comments es
   * opcional. `section` va en la URL, en mayúsculas (ver EvaluationSection).
   */
  async evaluateSection(
    id: string,
    section: EvaluationSection,
    payload: { rating: EvaluationRating; comments?: string },
  ): Promise<void> {
    await apiClient.put(`/candidates/${id}/evaluations/${section}`, payload);
  },

  /**
   * GET /candidates/:id/evaluations — contrato confirmado por el
   * usuario en el chat (no documentado en /docs-json todavía):
   * { evaluations: [{section, rating, comments}], currentCount, required }.
   * `comments` llega como string (no string | null) en ese shape; se
   * normaliza a `null` cuando viene vacío para que coincida con
   * SectionEvaluation en el resto de la app.
   */
  async getEvaluations(id: string): Promise<CandidateEvaluationsSummary> {
    const { data } = await apiClient.get<RawEvaluationsResponse>(`/candidates/${id}/evaluations`);
    return {
      evaluations: data.evaluations.map((evaluation) => ({
        section: evaluation.section as EvaluationSection,
        rating: evaluation.rating as EvaluationRating,
        comments: evaluation.comments || null,
      })),
      currentCount: data.currentCount,
      required: data.required,
    };
  },

  /**
   * POST /candidates/:id/work-history — el shape de la respuesta 201 no
   * está documentado en /docs-json. Se combina defensivamente: lo
   * enviado como piso, lo que el backend devuelva como override, y el
   * `id` siempre tomado de la respuesta (es lo único que el cliente no
   * puede conocer de antemano).
   */
  async createWorkHistory(id: string, payload: WorkHistoryPayload): Promise<WorkHistoryEntry> {
    const { data } = await apiClient.post<Partial<WorkHistoryEntry> & { id: string }>(
      `/candidates/${id}/work-history`,
      payload,
    );
    return { ...payload, ...data, id: data.id };
  },

  /** PUT /candidates/:id/work-history/:workId — mismo criterio defensivo que createWorkHistory. */
  async updateWorkHistory(
    id: string,
    workId: string,
    payload: WorkHistoryPayload,
  ): Promise<WorkHistoryEntry> {
    const { data } = await apiClient.put<Partial<WorkHistoryEntry> & { id?: string }>(
      `/candidates/${id}/work-history/${workId}`,
      payload,
    );
    return { ...payload, ...data, id: data.id ?? workId };
  },

  /** DELETE /candidates/:id/work-history/:workId */
  async deleteWorkHistory(id: string, workId: string): Promise<void> {
    await apiClient.delete(`/candidates/${id}/work-history/${workId}`);
  },

  /**
   * POST /candidates/:id/personal-references — mismo criterio defensivo
   * que createWorkHistory: la respuesta no está documentada, así que se
   * combina lo enviado con lo que devuelva el backend.
   */
  async createPersonalReference(
    id: string,
    payload: PersonalReferencePayload,
  ): Promise<PersonalReferenceEntry> {
    const { data } = await apiClient.post<Partial<PersonalReferenceEntry> & { id: string }>(
      `/candidates/${id}/personal-references`,
      payload,
    );
    return { ...payload, ...data, id: data.id };
  },

  /** PUT /candidates/:id/personal-references/:refId */
  async updatePersonalReference(
    id: string,
    refId: string,
    payload: PersonalReferencePayload,
  ): Promise<PersonalReferenceEntry> {
    const { data } = await apiClient.put<Partial<PersonalReferenceEntry> & { id?: string }>(
      `/candidates/${id}/personal-references/${refId}`,
      payload,
    );
    return { ...payload, ...data, id: data.id ?? refId };
  },

  /** DELETE /candidates/:id/personal-references/:refId */
  async deletePersonalReference(id: string, refId: string): Promise<void> {
    await apiClient.delete(`/candidates/${id}/personal-references/${refId}`);
  },

  /** POST /candidates/:id/neighborhood-references — mismo criterio defensivo que createPersonalReference. */
  async createNeighborhoodReference(
    id: string,
    payload: NeighborhoodReferencePayload,
  ): Promise<NeighborhoodReferenceEntry> {
    const { data } = await apiClient.post<Partial<NeighborhoodReferenceEntry> & { id: string }>(
      `/candidates/${id}/neighborhood-references`,
      payload,
    );
    return { ...payload, ...data, id: data.id };
  },

  /** PUT /candidates/:id/neighborhood-references/:refId */
  async updateNeighborhoodReference(
    id: string,
    refId: string,
    payload: NeighborhoodReferencePayload,
  ): Promise<NeighborhoodReferenceEntry> {
    const { data } = await apiClient.put<Partial<NeighborhoodReferenceEntry> & { id?: string }>(
      `/candidates/${id}/neighborhood-references/${refId}`,
      payload,
    );
    return { ...payload, ...data, id: data.id ?? refId };
  },

  /** DELETE /candidates/:id/neighborhood-references/:refId */
  async deleteNeighborhoodReference(id: string, refId: string): Promise<void> {
    await apiClient.delete(`/candidates/${id}/neighborhood-references/${refId}`);
  },

  /**
   * PUT /candidates/:id/social-network — upsert (crea o actualiza según
   * exista o no el registro, sin distinguir en la URL). Igual que el
   * resto, la respuesta no está documentada en /docs-json; se reconstruye
   * campo por campo (no un spread crudo) para que el resultado nunca
   * pueda traer campos de control colados, sin importar qué devuelva el
   * backend.
   */
  async upsertSocialNetwork(id: string, payload: SocialNetworkPayload): Promise<CandidateSocialNetwork> {
    const { data } = await apiClient.put<Partial<CandidateSocialNetwork>>(
      `/candidates/${id}/social-network`,
      payload,
    );
    return {
      facebook: data.facebook ?? payload.facebook,
      linkedin: data.linkedin ?? payload.linkedin,
      instagram: data.instagram ?? payload.instagram,
      profileComments: data.profileComments ?? payload.profileComments,
    };
  },

  /** PUT /candidates/:id/interviewer-integration — upsert, mismo criterio defensivo que upsertSocialNetwork. */
  async upsertInterviewerIntegration(
    id: string,
    payload: InterviewerIntegrationPayload,
  ): Promise<CandidateInterviewerIntegration> {
    const { data } = await apiClient.put<Partial<CandidateInterviewerIntegration>>(
      `/candidates/${id}/interviewer-integration`,
      payload,
    );
    return { comment: data.comment ?? payload.comment };
  },

  /** GET /candidates/:id/evidence — `?category=` opcional para filtrar (Fase 3, S3). */
  async getEvidence(id: string, category?: EvidenceCategory): Promise<EvidencePhoto[]> {
    const { data } = await apiClient.get<EvidencePhoto[]>(`/candidates/${id}/evidence`, {
      params: category ? { category } : undefined,
    });
    return data;
  },

  /**
   * POST /candidates/:id/evidence — multipart/form-data, contrato dado por
   * el usuario en el chat (`category` reemplaza al `section` libre de la
   * versión anterior). `Content-Type: undefined` es necesario porque
   * `apiClient` fuerza 'application/json' por defecto (ver
   * lib/http/apiClient.ts): con un body `FormData` el navegador debe poner
   * su propio boundary, así que hay que quitar ese default explícitamente
   * en esta llamada en vez de heredarlo.
   */
  async uploadEvidence(id: string, file: File, category: EvidenceCategory): Promise<EvidencePhoto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    const { data } = await apiClient.post<EvidencePhoto>(`/candidates/${id}/evidence`, formData, {
      headers: { 'Content-Type': undefined },
    });
    return data;
  },

  /** PUT /candidates/:id/evidence/:evidenceId — reemplaza el archivo en S3. Mismo criterio de Content-Type que uploadEvidence. */
  async updateEvidence(id: string, evidenceId: string, file: File): Promise<EvidencePhoto> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.put<EvidencePhoto>(`/candidates/${id}/evidence/${evidenceId}`, formData, {
      headers: { 'Content-Type': undefined },
    });
    return data;
  },

  /** DELETE /candidates/:id/evidence/:evidenceId */
  async deleteEvidence(id: string, evidenceId: string): Promise<void> {
    await apiClient.delete(`/candidates/${id}/evidence/${evidenceId}`);
  },

  /**
   * GET {url relativa} — la propiedad `url` de EvidencePhoto ya es la ruta
   * completa a pedir (ej. `/candidates/evidence/1A2B3C`), requiere Bearer
   * (que `apiClient` ya inyecta por su interceptor) y se pide como blob
   * porque un `<img src>` no puede mandar ese header.
   */
  async getEvidenceImageBlob(relativeUrl: string): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(relativeUrl, { responseType: 'blob' });
    return data;
  },
};
