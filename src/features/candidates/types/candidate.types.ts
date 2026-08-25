/**
 * Renombrado 2026-08 para alinear con la terminología real de RH
 * (confirmado en vivo contra /docs-json: el enum del backend ya usa
 * estos nombres): IN_PROGRESS→IN_EVALUATION, APPROVED→RECOMMENDED,
 * REJECTED→NOT_RECOMMENDED. Un candidato no se "aprueba", se "recomienda".
 */
export type CandidateStatus =
  | 'IN_EVALUATION'
  | 'COMPLETED'
  | 'UNDER_REVIEW'
  | 'RECOMMENDED'
  | 'NOT_RECOMMENDED'
  | 'ARCHIVED';

/**
 * Reclutador asignado, tal como lo anida el backend en `assignedRecruiter`
 * dentro de GET /candidates y GET /candidates/:id. Es un subconjunto de
 * User (sin createdAt/updatedAt), así que se declara aquí en vez de
 * reutilizar `User`: el contrato de Candidates no depende del de Users.
 */
export interface AssignedRecruiter {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface CandidateListItem {
  id: string;
  folio: string;
  fullName: string;
  email: string;
  companyName: string;
  positionName: string;
  status: CandidateStatus;
  isActive: boolean;
  /** `null` cuando el candidato no tiene reclutador (ver acción UNASSIGN_CANDIDATE). */
  assignedRecruiter: AssignedRecruiter | null;
}

export interface CandidateGeneralInfo {
  fullName: string;
  positionApplied: string;
  address: string;
  neighborhood: string;
  postalCode: string;
  phone: string;
  email: string;
  birthDate: string;
  birthPlace: string;
  civilStatus: string;
}

export interface FamilyMember {
  name: string;
  relationship: string | null;
  age: number | null;
  occupation: string | null;
  education: string | null;
  maritalStatus: string | null;
}

export interface CandidateFamily {
  hasGovRelatives: boolean | null;
  govRelativesDetails: string | null;
  hasPoliticalPosts: boolean | null;
  politicalPostsDetails: string | null;
}

export interface CandidateHealth {
  chronicDiseasesFamily: boolean | null;
  chronicDiseasesDetails: string | null;
  healthcareAccess: string[];
  usesGlasses: boolean | null;
  height: number | null;
  weight: number | null;
  physicalAspect: string | null;
  currentHealth: string | null;
  pastDiseases: string | null;
  surgeries: string | null;
  alcoholFrequency: string | null;
  alcoholTypes: string[];
  smokes: boolean | null;
  cigarettesPerDay: number | null;
  smokingExpensePerWeek: number | null;
  usedDrugs: boolean | null;
  drugsDetails: string | null;
  /**
   * Hábitos de vida agregados al modelo de `health` (2026-08). No
   * aparecen todavía en `UpdateCandidateHealthDto` de /docs-json — el
   * backend puede no haber redesplegado Swagger. Se mapean igual porque
   * el usuario confirmó el cambio de base de datos explícitamente, pero
   * quedan opcionales y con `?? null` en candidateService.ts para no
   * romper nada si el backend real todavía no los envía.
   */
  dietQuality: string | null;
  physicalActivity: string | null;
  sedentaryHours: number | null;
  screenTimeHours: number | null;
}

export interface CandidateHousing {
  propertyOwner: string | null;
  timeLivingThere: string | null;
  previousAddress: string | null;
  hasInfonavitDebt: boolean | null;
  infonavitAmount: number | null;
  infonavitCreditNumber: string | null;
  housingConditions: string | null;
  housingType: string | null;
  roomsCount: number | null;
  livingRoomCount: number | null;
  diningRoomCount: number | null;
  kitchenCount: number | null;
  bathroomsCount: number | null;
  patioCount: number | null;
  publicServices: string[];
}

export interface Income {
  source: string;
  amount: number;
}

export interface Vehicle {
  model: string;
  value: number;
}

export interface Debt {
  creditor: string;
  amount: number;
  monthlyPayment: number;
}

export interface BankCard {
  bank: string;
  creditLimit: number;
}

export interface CandidateEconomy {
  expensesFood: number | null;
  expensesLight: number | null;
  expensesGas: number | null;
  expensesPhone: number | null;
  expensesTransport: number | null;
  expensesEducation: number | null;
  expensesMedical: number | null;
  expensesRentOther: number | null;
  expensesExtra: number | null;
  expensesTotal: number | null;
  hasOtherIncome: boolean | null;
  otherIncomeDetails: string | null;
}

/**
 * `familyMembers`, `incomes`, `vehicles`, `debts` y `bankCards` viven en la
 * raíz del objeto candidato en GET /candidates/:id, como arreglos hermanos
 * de `family`/`economy` (no anidados dentro de ellos) — así lo modela la
 * base de datos relacional del backend, confirmado en vivo por el usuario.
 */
export interface CandidateDetail extends CandidateListItem {
  generalInfo: CandidateGeneralInfo;
  family: CandidateFamily;
  familyMembers: FamilyMember[];
  health: CandidateHealth;
  housing: CandidateHousing;
  economy: CandidateEconomy;
  incomes: Income[];
  vehicles: Vehicle[];
  debts: Debt[];
  bankCards: BankCard[];
  /** Arreglo raíz `workHistories` (plural) — nombre de campo confirmado por el usuario. */
  workHistories: WorkHistoryEntry[];
  /** Arreglos raíz `personalReferences`/`neighborhoodReferences` — nombres confirmados por el usuario. */
  personalReferences: PersonalReferenceEntry[];
  neighborhoodReferences: NeighborhoodReferenceEntry[];
}

export type EvaluationRating = 'GREEN' | 'YELLOW' | 'RED';

/**
 * IDs de sección tal como los espera PUT /candidates/:id/evaluations/:section
 * en la URL — confirmados por el usuario en vivo (no hay DTO documentado
 * en /docs-json todavía). `WORK_HISTORY` (Antecedentes Laborales) y
 * `REFERENCES` (Referencias Personales/Vecinales) se agregaron cuando se
 * construyó cada sub-pestaña; "Redes Sociales" sigue sin sección propia
 * porque no hay nada real que calificar ahí todavía.
 */
export type EvaluationSection =
  | 'PERSONAL'
  | 'IDENTITY'
  | 'FAMILY'
  | 'HEALTH'
  | 'HOUSING'
  | 'ECONOMY'
  | 'WORK_HISTORY'
  | 'REFERENCES';

export interface SectionEvaluation {
  section: EvaluationSection;
  rating: EvaluationRating;
  comments: string | null;
}

/**
 * Las 6 secciones que el backend exige para el dictamen (ver
 * GET /candidates/:id/evaluations → `required`). WORK_HISTORY tiene
 * SectionGrader propio pero el usuario no confirmó que sea obligatoria
 * para completar el expediente, así que no se agrega aquí — este
 * arreglo solo se usa como valor de respaldo antes de que cargue esa
 * consulta, nunca como la cuenta real (esa siempre viene del backend).
 */
export const REQUIRED_EVALUATION_SECTIONS: EvaluationSection[] = [
  'PERSONAL',
  'IDENTITY',
  'FAMILY',
  'HEALTH',
  'HOUSING',
  'ECONOMY',
];

/**
 * Antecedente laboral — formato de validación cruzada: cada rubro
 * dividido candidateX/companyX compara lo que dijo el candidato contra
 * lo que confirmó (o no) la empresa al verificarlo. Nombres de campo
 * confirmados por el usuario (modelo de Prisma) — el backend expone
 * POST/PUT/DELETE /candidates/:id/work-history(/:workId), pero sus DTOs
 * llegan vacíos en /docs-json (CreateWorkHistoryDto/UpdateWorkHistoryDto
 * sin `@ApiProperty`), así que no hay forma de confirmarlos ahí. Los
 * registros existentes llegan embebidos en GET /candidates/:id bajo
 * `workHistories` (también confirmado por el usuario, no documentado).
 *
 * `id: null` marca un registro capturado en el navegador que todavía no
 * se guardó en el backend (dispara POST al guardar); con `id` presente,
 * guardar dispara PUT sobre ese `workId`.
 */
export interface WorkHistoryEntry {
  id: string | null;
  companyName: string;
  address: string;
  activity: string;
  contactNamePhone: string;
  candidatePosition: string;
  companyPosition: string;
  candidatePeriod: string;
  companyPeriod: string;
  candidateBoss: string;
  companyBoss: string;
  candidateSalary: string;
  companySalary: string;
  candidateSeparation: string;
  companySeparation: string;
  companyComments: string;
}

/** Body de POST/PUT /candidates/:id/work-history(/:workId) — WorkHistoryEntry sin `id`, que nunca se envía. */
export type WorkHistoryPayload = Omit<WorkHistoryEntry, 'id'>;

/**
 * Referencia personal — contacto que da fe del candidato (no confundir
 * con `neighborhoodReferences`, que además captura una `opinion` sobre
 * el vecino). Campos y endpoints (POST/PUT/DELETE
 * /candidates/:id/personal-references(/:refId)) confirmados por el
 * usuario directamente en el chat, junto con el nombre del arreglo raíz
 * `personalReferences` en GET /candidates/:id.
 */
export interface PersonalReferenceEntry {
  id: string | null;
  name: string;
  occupation: string;
  timeKnown: string;
  phone: string;
}

/** Body de POST/PUT /candidates/:id/personal-references(/:refId) — sin `id`, que nunca se envía. */
export type PersonalReferencePayload = Omit<PersonalReferenceEntry, 'id'>;

/**
 * Referencia vecinal — mismos datos base que una referencia personal más
 * `address` (domicilio del vecino) y `opinion` (lo que opina del
 * candidato). Campos y endpoints (POST/PUT/DELETE
 * /candidates/:id/neighborhood-references(/:refId)) confirmados por el
 * usuario, junto con el nombre del arreglo raíz `neighborhoodReferences`
 * en GET /candidates/:id.
 */
export interface NeighborhoodReferenceEntry {
  id: string | null;
  name: string;
  occupation: string;
  timeKnown: string;
  address: string;
  opinion: string;
}

/** Body de POST/PUT /candidates/:id/neighborhood-references(/:refId) — sin `id`, que nunca se envía. */
export type NeighborhoodReferencePayload = Omit<NeighborhoodReferenceEntry, 'id'>;

/**
 * Texto del reclutador asignado. Una sola fuente para la tabla, el
 * detalle y el diálogo — evita que cada uno invente su propio placeholder
 * ("—", "N/D", "Sin reclutador") para el mismo caso nulo.
 */
export const UNASSIGNED_RECRUITER_LABEL = 'Sin asignar';

export function recruiterFullName(recruiter: AssignedRecruiter | null): string {
  if (!recruiter) return UNASSIGNED_RECRUITER_LABEL;
  return `${recruiter.firstName} ${recruiter.lastName}`.trim();
}

export const CANDIDATE_STATUS_LABEL: Record<CandidateStatus, string> = {
  IN_EVALUATION: 'En evaluación',
  COMPLETED: 'Completo',
  UNDER_REVIEW: 'En revisión',
  RECOMMENDED: 'Recomendable',
  NOT_RECOMMENDED: 'No recomendable',
  ARCHIVED: 'Archivado',
};

/** Todos los estados posibles, en el mismo orden que CANDIDATE_STATUS_LABEL. */
export const ALL_CANDIDATE_STATUSES = Object.keys(CANDIDATE_STATUS_LABEL) as CandidateStatus[];

/**
 * Estados que un RECRUITER puede ver y aplicar en cualquier dropdown de
 * estado (filtro del listado, diálogo de cambio de estado en el detalle).
 * No incluye ARCHIVED: archivar es una acción reservada a SYSTEM/ADMIN, y
 * el backend además la trata como una máquina de estados con efectos
 * colaterales (desactiva al candidato, le quita el reclutador asignado y
 * registra finishedAt) que no corresponde exponer al flujo de RECRUITER.
 */
export const RECRUITER_EDITABLE_STATUSES: CandidateStatus[] = [
  'IN_EVALUATION',
  'UNDER_REVIEW',
  'COMPLETED',
  'RECOMMENDED',
  'NOT_RECOMMENDED',
];

/**
 * Máquina de estados del diálogo "Cambiar estado", dado el estado
 * ACTUAL del candidato — una versión por rol, porque los destinos
 * válidos dependen de si quien pregunta es RECRUITER o SYSTEM/ADMIN
 * (ver getValidStatusTransitions, más abajo). Distintas de
 * RECRUITER_EDITABLE_STATUSES (la lista plana del filtro del listado,
 * sin noción de "desde dónde" ni de rol).
 *
 * Reglas confirmadas por el usuario (corrigen una versión anterior de
 * este mismo mapa que le daba ARCHIVED a RECRUITER — era un error,
 * archivar sigue siendo exclusivo de SYSTEM/ADMIN):
 *
 * - IN_EVALUATION, UNDER_REVIEW y COMPLETED son "intocables": el
 *   sistema los asigna solo (asignar reclutador → UNDER_REVIEW;
 *   terminar de calificar las 6 secciones → COMPLETED automático).
 *   NINGÚN rol puede seleccionarlos como destino manual, sin importar
 *   el estado de origen — por eso no aparecen como target en ninguna
 *   entrada de ninguno de los dos mapas. UpdateCandidateStatusDialog ya
 *   sabe mostrar el estado actual con "(actual)" aunque no esté en la
 *   lista, así que el <Select> no se rompe visualmente cuando el
 *   candidato SÍ está en uno de estos tres estados.
 * - RECRUITER: desde COMPLETED solo puede emitir el dictamen
 *   (RECOMMENDED/NOT_RECOMMENDED); desde uno de esos dos, solo puede
 *   alternar al otro. Nunca ve ARCHIVED.
 * - SYSTEM/ADMIN: mismas opciones de dictamen que RECRUITER, más
 *   ARCHIVED disponible desde COMPLETED, RECOMMENDED o NOT_RECOMMENDED.
 *
 * Ninguno de los dos mapas define una salida manual desde
 * IN_EVALUATION/UNDER_REVIEW/ARCHIVED (quedan en `[]`): el usuario no
 * describió esa transición para ningún rol, así que no se inventa.
 */
export const RECRUITER_STATUS_TRANSITIONS: Record<CandidateStatus, CandidateStatus[]> = {
  IN_EVALUATION: [],
  UNDER_REVIEW: [],
  COMPLETED: ['RECOMMENDED', 'NOT_RECOMMENDED'],
  RECOMMENDED: ['NOT_RECOMMENDED'],
  NOT_RECOMMENDED: ['RECOMMENDED'],
  ARCHIVED: [],
};

/** Ver RECRUITER_STATUS_TRANSITIONS — misma idea, para SYSTEM/ADMIN (hasFullAccess). */
export const ADMIN_STATUS_TRANSITIONS: Record<CandidateStatus, CandidateStatus[]> = {
  IN_EVALUATION: [],
  UNDER_REVIEW: [],
  COMPLETED: ['RECOMMENDED', 'NOT_RECOMMENDED', 'ARCHIVED'],
  RECOMMENDED: ['NOT_RECOMMENDED', 'ARCHIVED'],
  NOT_RECOMMENDED: ['RECOMMENDED', 'ARCHIVED'],
  ARCHIVED: [],
};

/**
 * Único punto que decide "qué puede elegir este usuario" en el diálogo
 * de cambio de estado — recibe el rol ya resuelto a un booleano
 * (`hasFullAccessRole`, ver role.enum.ts) en vez de un `UserRole` crudo,
 * para no acoplar este archivo de tipos de dominio a la jerarquía de
 * roles de auth.
 */
export function getValidStatusTransitions(
  currentStatus: CandidateStatus,
  hasFullAccessRole: boolean,
): CandidateStatus[] {
  return hasFullAccessRole
    ? ADMIN_STATUS_TRANSITIONS[currentStatus]
    : RECRUITER_STATUS_TRANSITIONS[currentStatus];
}

/**
 * Estados en los que un expediente se considera "cerrado" y puede
 * exportarse a Excel desde CandidateDetailPage — decisión de negocio:
 * el reporte solo tiene sentido una vez que el proceso terminó, no
 * mientras el candidato sigue En evaluación/En revisión/Archivado.
 */
export const EXCEL_REPORT_STATUSES: CandidateStatus[] = ['COMPLETED', 'RECOMMENDED', 'NOT_RECOMMENDED'];

/**
 * IN_EVALUATION usa un azul distinto al de COMPLETED (que ya ocupaba el
 * azul "info" del theme, #67B1E3) para que ambos estados sigan viéndose
 * distinguibles en los Chips y en la gráfica del dashboard — no es el
 * hex exacto de theme.palette.info.main, es una variante de la misma
 * familia. RECOMMENDED/NOT_RECOMMENDED sí usan el verde/rojo exactos de
 * theme.palette.success.main / error.main.
 */
export const CANDIDATE_STATUS_COLOR: Record<CandidateStatus, string> = {
  IN_EVALUATION: '#0083C1',
  COMPLETED: '#67B1E3',
  UNDER_REVIEW: '#69478E',
  RECOMMENDED: '#76B82A',
  NOT_RECOMMENDED: '#D32F2F',
  ARCHIVED: '#808080',
};
