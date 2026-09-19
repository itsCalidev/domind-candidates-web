/**
 * Ciclo de vida rehecho 2026-09 tras una junta de definición de negocio
 * (dado explícitamente por el usuario, no inferido): candidato creado →
 * `UNASSIGNED` (nuevo estado inicial, sin reclutador); asignar
 * reclutador → `IN_EVALUATION` (¡ojo! antes este era el estado inicial —
 * ahora es el intermedio, tras la asignación); terminar de calificar
 * todas las secciones → `EVALUATED` (reemplaza a `COMPLETED`); dictamen
 * manual del reclutador → `RECOMMENDED`/`NOT_RECOMMENDED` (sin cambios);
 * `ARCHIVED` sigue siendo exclusivo de SYSTEM/ADMIN. `UNDER_REVIEW` deja
 * de existir como estado propio — su lugar en el ciclo lo ocupa el
 * `IN_EVALUATION` re-significado.
 */
export type CandidateStatus =
  | 'UNASSIGNED'
  | 'IN_EVALUATION'
  | 'EVALUATED'
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

/**
 * Cómo se está llenando la información del candidato — mismo concepto que
 * `fillMode` en `CreateAndAssignCandidateDialog`, ya persistido en el
 * candidato con este nombre (confirmado por el usuario). `captureStatus`
 * es el avance de esa captura: `DRAFT` mientras falta completarla,
 * `COMPLETED` una vez terminada. Ambos confirmados por el usuario en el
 * chat, incluyendo que GET /candidates ya los devuelve en cada item de la
 * lista.
 */
export type CandidateCaptureMode = 'MANUAL' | 'MAGIC_LINK';
export type CandidateCaptureStatus = 'DRAFT' | 'COMPLETED';

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
  captureMode: CandidateCaptureMode;
  captureStatus: CandidateCaptureStatus;
}

export interface CandidateGeneralInfo {
  /** `firstName` + `lastName` ya concatenados por candidateService — solo para modo lectura. */
  fullName: string;
  firstName: string;
  lastName: string;
  /** Duplicado de `CandidateListItem.companyName`, con fallback "No registrado" — ver comentario de PersonalInfoPayload sobre por qué se edita desde aquí. */
  companyName: string;
  positionApplied: string;
  address: string;
  neighborhood: string;
  postalCode: string;
  phone: string;
  email: string;
  birthDate: string;
  birthPlace: string;
  civilStatus: string;
  /** Fecha de nacimiento del cónyuge, mismo formato `YYYY-MM-DD` que `birthDate`. */
  spouseBirthDate: string;
  /** Texto libre (backend: String, máx. 100) — el Select de la UI solo restringe qué se puede escribir, el backend acepta cualquier texto de ese largo. */
  highestEducation: string;
  /** Texto libre, mismo criterio que `highestEducation`. */
  studiesProofType: string;
  studiesProofDate: string;
}

/**
 * Body de `PATCH /candidates/:id/personal` (contrato dado directamente
 * por el usuario en el chat).
 *
 * `highestEducation`/`studiesProofType` son String libres en el backend
 * (máx. 100 caracteres, no Enums) — confirmado por el usuario en el
 * chat; el Select de la UI solo ofrece un set fijo de opciones sugeridas,
 * pero el tipo aquí es `string` sin restricción de valores.
 *
 * `companyName`/`positionName`: aunque este mismo endpoint también
 * actualiza datos personales, el usuario confirmó que el backend acepta
 * estos dos campos aquí y los guarda en la tabla raíz del candidato
 * (no en `personal`) — no son un capricho de nombres, es el contrato
 * real que dio explícitamente.
 */
export interface PersonalInfoPayload {
  firstName: string;
  lastName: string;
  address: string;
  neighborhood: string;
  postalCode: string;
  phone: string;
  email: string;
  birthDate: string;
  birthPlace: string;
  maritalStatus: string;
  spouseBirthDate: string;
  highestEducation: string;
  studiesProofType: string;
  studiesProofDate: string;
  companyName: string;
  positionName: string;
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

/**
 * Body de `PATCH /candidates/:id/family` (dto/update-candidate-family.dto.ts,
 * contrato dado directamente por el usuario en el chat, con nombres de
 * campo confirmados 1:1 contra el DTO real del backend). `name` es el
 * único campo obligatorio de cada integrante; el resto —incluido
 * `maritalStatus`— es texto libre en Prisma (`String?`, a propósito
 * "por si escriben algo fuera del Enum"), NO el enum `MaritalStatus` que
 * sí aplica en `PersonalInfoPayload.maritalStatus` (endpoint distinto).
 *
 * `familyMembers` reemplaza el arreglo completo en el backend (borra y
 * vuelve a crear todos los integrantes) — nunca se manda un solo
 * integrante suelto, siempre el arreglo entero con todos los que deben
 * quedar tras el guardado.
 */
export interface FamilyMemberPayload {
  name: string;
  relationship?: string;
  age?: number;
  occupation?: string;
  education?: string;
  maritalStatus?: string;
}

export interface UpdateCandidateFamilyPayload {
  familyMembers: FamilyMemberPayload[];
  hasGovRelatives?: boolean;
  govRelativesDetails?: string;
  hasPoliticalPosts?: boolean;
  politicalPostsDetails?: string;
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
  /**
   * `null`/`undefined` = todavía sin responder, `false` = confirmado sin
   * antecedentes, `true` = sí tiene (ver `pastDiseases`/`surgeries` para
   * el detalle). Confirmado por el usuario vía pruebas de API — el
   * backend ya guarda y devuelve ambos booleanos junto con su texto.
   */
  hasPastDiseases: boolean | null;
  pastDiseases: string | null;
  hasSurgeries: boolean | null;
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

/**
 * Body de `PATCH /candidates/:id/health` (pestaña Estado de Salud).
 * Contrato dado directamente por el usuario en el chat: payload parcial,
 * todos los campos opcionales. Las 4 dependencias condicionales
 * (`chronicDiseasesFamily`→`chronicDiseasesDetails`,
 * `smokes`→`cigarettesPerDay`/`smokingExpensePerWeek`,
 * `usedDrugs`→`drugsDetails`) no se validan a nivel de tipo — HealthTab
 * las limpia por UI (`setValue`) en cuanto la respuesta pasa a "No",
 * mismo criterio que las preguntas de riesgo de FamilyTab.
 *
 * `hasPastDiseases`/`hasSurgeries` confirmados por el usuario en el chat
 * como booleanos reales del backend (no solo estado de UI) — igual que
 * `chronicDiseasesFamily`, viajan junto con su texto asociado
 * (`pastDiseases`/`surgeries`), que va como `null` cuando el booleano es
 * `false`, no como cadena vacía.
 */
export interface CandidateHealthPayload {
  weight?: number;
  height?: number;
  usesGlasses?: boolean;
  physicalAspect?: string;
  currentHealth?: string;
  chronicDiseasesFamily?: boolean;
  chronicDiseasesDetails?: string;
  hasPastDiseases?: boolean;
  pastDiseases?: string | null;
  hasSurgeries?: boolean;
  surgeries?: string | null;
  healthcareAccess?: string[];
  alcoholFrequency?: string;
  alcoholTypes?: string[];
  smokes?: boolean;
  cigarettesPerDay?: number;
  smokingExpensePerWeek?: number;
  usedDrugs?: boolean;
  drugsDetails?: string;
  dietQuality?: string;
  physicalActivity?: string;
  sedentaryHours?: number;
  screenTimeHours?: number;
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

/**
 * Body de PATCH /candidates/:id/housing — mismos nombres de campo que
 * `CandidateHousing` (confirmados contra el DTO real en /docs-json, ver
 * el comentario de `RawHousing` en candidateService.ts), todos opcionales
 * porque es un PATCH parcial. Usado por el flujo de Magic Link
 * (candidate-auth) para que el candidato capture su propia vivienda.
 */
export interface CandidateHousingPayload {
  propertyOwner?: string;
  timeLivingThere?: string;
  previousAddress?: string;
  hasInfonavitDebt?: boolean;
  infonavitAmount?: number;
  infonavitCreditNumber?: string;
  housingConditions?: string;
  housingType?: string;
  roomsCount?: number;
  livingRoomCount?: number;
  diningRoomCount?: number;
  kitchenCount?: number;
  bathroomsCount?: number;
  patioCount?: number;
  publicServices?: string[];
}

/**
 * Body de la acción combinada "Agregar Candidato" (crear + asignar
 * reclutador + elegir modalidad de llenado), enviado a
 * `POST /candidates` (ver `createAndAssignCandidate` en
 * candidateService.ts).
 *
 * `email` es el único correo del candidato — siempre obligatorio, sin
 * importar `fillMode`. Antes existía `candidateEmail`, un segundo campo
 * exclusivo de `fillMode === 'MAGIC_LINK'` como destinatario transaccional
 * del enlace; se quitó a propósito (confirmado por el usuario) para no
 * duplicar el dato: ahora `email` cumple ambos roles.
 */
export interface CreateAndAssignCandidatePayload {
  firstName: string;
  lastName: string;
  email: string;
  recruiterId: string;
  fillMode: 'MANUAL' | 'MAGIC_LINK';
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

/**
 * Reemplaza a `hasOtherIncome`/`otherIncomeDetails` — el usuario confirmó
 * en el chat que el backend quitó esos 2 campos de `CandidateEconomy` y
 * los sustituyó por `hasOtherExpenses` (boolean) + una tabla relacional
 * nueva `CandidateOtherExpense` (mismo patrón que Income/Vehicle/Debt/
 * BankCard: reemplazo total vía `deleteMany` + `create`).
 */
export interface OtherExpense {
  concept: string;
  amount: number;
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
  hasOtherExpenses: boolean | null;
}

/**
 * Body de `PATCH /candidates/:id/economy` (contrato dado directamente
 * por el usuario en el chat). A diferencia de `/personal`/`/health`, este
 * endpoint hace un reemplazo total de los 4 arreglos (`deleteMany` +
 * `create` en el backend) — por eso aquí NO hay tipos "Payload" opcionales
 * por campo: el formulario siempre debe mandar el objeto completo,
 * incluidos los 4 arreglos enteros, nunca un PATCH parcial.
 * `expensesTotal` no lo calcula el backend — EconomyTab lo suma a partir
 * de las 9 categorías de gasto antes de enviarlo.
 */
export interface IncomePayload {
  source: string;
  amount: number;
}

export interface VehiclePayload {
  model: string;
  value: number;
}

export interface DebtPayload {
  creditor: string;
  amount: number;
  monthlyPayment: number;
}

export interface BankCardPayload {
  bank: string;
  creditLimit: number;
}

export interface OtherExpensePayload {
  concept: string;
  amount: number;
}

export interface UpdateCandidateEconomyPayload {
  expensesFood: number;
  expensesLight: number;
  expensesGas: number;
  expensesPhone: number;
  expensesTransport: number;
  expensesEducation: number;
  expensesMedical: number;
  expensesRentOther: number;
  expensesExtra: number;
  expensesTotal: number;
  hasOtherExpenses: boolean;
  incomes: IncomePayload[];
  vehicles: VehiclePayload[];
  debts: DebtPayload[];
  bankCards: BankCardPayload[];
  otherExpenses: OtherExpensePayload[];
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
  /** Arreglo raíz `otherExpenses`, mismo patrón que incomes/vehicles/debts/bankCards — agregado a `candidateDetailSelect` junto con este campo, confirmado por el usuario. */
  otherExpenses: OtherExpense[];
  /** Arreglo raíz `workHistories` (plural) — nombre de campo confirmado por el usuario. */
  workHistories: WorkHistoryEntry[];
  /** Arreglos raíz `personalReferences`/`neighborhoodReferences` — nombres confirmados por el usuario. */
  personalReferences: PersonalReferenceEntry[];
  neighborhoodReferences: NeighborhoodReferenceEntry[];
  /** Objeto raíz `socialNetwork` (singular) — nombre confirmado por el usuario, mismo patrón que family/health/housing. */
  socialNetwork: CandidateSocialNetwork;
  /** Objeto raíz `interviewerIntegration` (singular) — nombre confirmado por el usuario, mismo patrón que socialNetwork. */
  interviewerIntegration: CandidateInterviewerIntegration;
}

export type EvaluationRating = 'GREEN' | 'YELLOW' | 'RED';

/**
 * IDs de sección tal como los espera PUT /candidates/:id/evaluations/:section
 * en la URL — confirmados por el usuario en vivo (no hay DTO documentado
 * en /docs-json todavía). `WORK_HISTORY`, `REFERENCES`, `SOCIAL_NETWORK`
 * e `INTERVIEWER_INTEGRATION` se agregaron cuando se construyó cada
 * sub-pestaña — ya no queda ninguna sub-pestaña del sistema sin
 * evaluador propio.
 */
export type EvaluationSection =
  | 'PERSONAL'
  | 'IDENTITY'
  | 'FAMILY'
  | 'HEALTH'
  | 'HOUSING'
  | 'ECONOMY'
  | 'WORK_HISTORY'
  | 'REFERENCES'
  | 'SOCIAL_NETWORK'
  | 'INTERVIEWER_INTEGRATION';

export interface SectionEvaluation {
  section: EvaluationSection;
  rating: EvaluationRating;
  comments: string | null;
}

/** Mismos textos que las sub-pestañas de CandidateDetailPage para cada sección — una sola fuente para no desalinearlos. */
export const EVALUATION_SECTION_LABEL: Record<EvaluationSection, string> = {
  PERSONAL: 'Información General',
  IDENTITY: 'Documentación',
  FAMILY: 'Estructura Familiar',
  HEALTH: 'Estado de Salud',
  HOUSING: 'Vivienda',
  ECONOMY: 'Economía Familiar',
  WORK_HISTORY: 'Antecedentes Laborales',
  REFERENCES: 'Referencias',
  SOCIAL_NETWORK: 'Redes Sociales',
  INTERVIEWER_INTEGRATION: 'Comentarios Finales',
};

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
 * Redes sociales del candidato — relación 1 a 1 (no un arreglo): el
 * backend expone un único PUT /candidates/:id/social-network que crea o
 * actualiza el registro (upsert), confirmado por el usuario. El registro
 * existente llega embebido en GET /candidates/:id bajo `socialNetwork`
 * (objeto singular, confirmado por el usuario, mismo patrón que
 * family/health/housing). Sin campo `id`: a diferencia de los antecedentes
 * laborales o las referencias, aquí no hay lista que editar/borrar, así
 * que no hace falta distinguir "nuevo" de "existente".
 */
export interface CandidateSocialNetwork {
  facebook: string;
  linkedin: string;
  instagram: string;
  profileComments: string;
}

/** Body de PUT /candidates/:id/social-network — mismos campos, todos opcionales según el DTO del backend. */
export type SocialNetworkPayload = CandidateSocialNetwork;

/**
 * Categoría de una evidencia (Fase 3 del backend, S3) — enum propio y
 * separado de `EvaluationSection`: `'SOCIAL_MEDIA'` no es uno de sus
 * valores, a diferencia del `section` libre que reemplaza.
 */
export type EvidenceCategory = 'SOCIAL_MEDIA' | 'HOUSING' | 'DOCUMENT';

/**
 * Tipo de documento dentro de la categoría `DOCUMENT` — los 7 documentos
 * esperados del expediente. `INE`, `ACTA_NACIMIENTO` y
 * `ANTECEDENTES_PENALES` dados explícitamente por el usuario;
 * `COMPROBANTE_DOMICILIO`/`COMPROBANTE_ESTUDIOS` confirmados por el
 * usuario siguiendo ese mismo patrón; `NSS`/`RFC` agregados después,
 * también dados explícitamente por el usuario.
 */
export type DocumentType =
  | 'INE'
  | 'ACTA_NACIMIENTO'
  | 'COMPROBANTE_DOMICILIO'
  | 'ANTECEDENTES_PENALES'
  | 'COMPROBANTE_ESTUDIOS'
  | 'NSS'
  | 'RFC';

/**
 * Foto/documento de evidencia subido vía POST /candidates/:id/evidence,
 * listado vía GET /candidates/:id/evidence (con `?category=` opcional),
 * reemplazado vía PUT /candidates/:id/evidence/:evidenceId y borrado vía
 * DELETE — contrato dado directamente por el usuario en el chat. `url` es
 * la ruta relativa (no absoluta) que hay que pedir con Bearer y convertir
 * a blob — ver `getEvidenceImageBlob` en candidateService.ts. El usuario
 * no repitió el shape completo de la respuesta al migrar a S3, solo que
 * `section` pasó a `category` (enum) — el resto de los campos se asume
 * sin cambios respecto al contrato anterior. `documentType` es nuevo y
 * solo aplica a evidencias de categoría `DOCUMENT` — opcional porque
 * `SOCIAL_MEDIA`/`HOUSING` no lo traen.
 */
export interface EvidencePhoto {
  id: string;
  candidateId: string;
  category: EvidenceCategory;
  documentType?: DocumentType;
  fileName: string;
  driveFileId: string;
  url: string;
}

/**
 * Conclusión final del entrevistador — relación 1 a 1 igual que
 * `CandidateSocialNetwork`: un único PUT /candidates/:id/interviewer-integration
 * hace upsert, el registro existente llega embebido en GET /candidates/:id
 * bajo `interviewerIntegration` (objeto singular). Ambos nombres
 * confirmados por el usuario.
 */
export interface CandidateInterviewerIntegration {
  comment: string;
}

/** Body de PUT /candidates/:id/interviewer-integration. */
export type InterviewerIntegrationPayload = CandidateInterviewerIntegration;

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
  UNASSIGNED: 'No asignado',
  IN_EVALUATION: 'En evaluación',
  EVALUATED: 'Evaluado',
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
  'UNASSIGNED',
  'IN_EVALUATION',
  'EVALUATED',
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
 * - UNASSIGNED, IN_EVALUATION y EVALUATED son "intocables": el sistema
 *   los asigna solo (candidato creado → UNASSIGNED; asignar reclutador →
 *   IN_EVALUATION automático; terminar de calificar todas las secciones →
 *   EVALUATED automático). NINGÚN rol puede seleccionarlos como destino
 *   manual, sin importar el estado de origen — por eso no aparecen como
 *   target en ninguna entrada de ninguno de los dos mapas.
 *   UpdateCandidateStatusDialog ya sabe mostrar el estado actual con
 *   "(actual)" aunque no esté en la lista, así que el <Select> no se
 *   rompe visualmente cuando el candidato SÍ está en uno de estos tres
 *   estados.
 * - RECRUITER: desde EVALUATED solo puede emitir el dictamen
 *   (RECOMMENDED/NOT_RECOMMENDED); desde uno de esos dos, solo puede
 *   alternar al otro. Nunca ve ARCHIVED.
 * - SYSTEM/ADMIN: mismas opciones de dictamen que RECRUITER, más
 *   ARCHIVED disponible desde EVALUATED, RECOMMENDED o NOT_RECOMMENDED.
 *
 * Ninguno de los dos mapas define una salida manual desde
 * UNASSIGNED/IN_EVALUATION/ARCHIVED (quedan en `[]`): el usuario no
 * describió esa transición para ningún rol, así que no se inventa.
 */
export const RECRUITER_STATUS_TRANSITIONS: Record<CandidateStatus, CandidateStatus[]> = {
  UNASSIGNED: [],
  IN_EVALUATION: [],
  EVALUATED: ['RECOMMENDED', 'NOT_RECOMMENDED'],
  RECOMMENDED: ['NOT_RECOMMENDED'],
  NOT_RECOMMENDED: ['RECOMMENDED'],
  ARCHIVED: [],
};

/** Ver RECRUITER_STATUS_TRANSITIONS — misma idea, para SYSTEM/ADMIN (hasFullAccess). */
export const ADMIN_STATUS_TRANSITIONS: Record<CandidateStatus, CandidateStatus[]> = {
  UNASSIGNED: [],
  IN_EVALUATION: [],
  EVALUATED: ['RECOMMENDED', 'NOT_RECOMMENDED', 'ARCHIVED'],
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
 * Estados en los que puede descargarse el reporte PDF desde
 * CandidateDetailPage — decisión de negocio: no basta con que el
 * expediente "cierre" (EVALUATED), se exige que el reclutador ya haya
 * emitido el dictamen final (RECOMMENDED/NOT_RECOMMENDED). Con
 * EVALUATED el único botón de acción visible es "Cambiar estado", para
 * forzar esa decisión antes de poder descargar el reporte. Antes se
 * llamaba EXCEL_REPORT_STATUSES, cuando el reporte era un .xlsx
 * generado por el backend; el nombre ya no aplicaba al reemplazar esa
 * exportación por un PDF generado en el cliente.
 */
export const REPORT_AVAILABLE_STATUSES: CandidateStatus[] = ['RECOMMENDED', 'NOT_RECOMMENDED'];

/**
 * Un color por posición en el ciclo de vida (inicio/desarrollo/fin),
 * preservado tal cual tras el refactor 2026-09 — solo se re-etiquetó qué
 * estado ocupa cada posición: UNASSIGNED hereda el azul que antes tenía
 * IN_EVALUATION (era el inicio), IN_EVALUATION hereda el morado que antes
 * tenía UNDER_REVIEW (era el desarrollo), EVALUATED hereda el azul claro
 * que antes tenía COMPLETED (era el fin) — no es el hex exacto de
 * theme.palette.info.main, es una variante de la misma familia.
 * RECOMMENDED/NOT_RECOMMENDED sí usan el verde/rojo exactos de
 * theme.palette.success.main / error.main.
 */
export const CANDIDATE_STATUS_COLOR: Record<CandidateStatus, string> = {
  UNASSIGNED: '#0083C1',
  IN_EVALUATION: '#69478E',
  EVALUATED: '#67B1E3',
  RECOMMENDED: '#76B82A',
  NOT_RECOMMENDED: '#D32F2F',
  ARCHIVED: '#808080',
};

/** Nivel de riesgo global del candidato (distinto de EvaluationRating: ese es por sección, este es el índice de confiabilidad agregado). */
export type RiskLevel = 'ALTO' | 'MEDIO' | 'BAJO';

export const RISK_LEVEL_COLOR: Record<RiskLevel, 'success' | 'warning' | 'error'> = {
  BAJO: 'success',
  MEDIO: 'warning',
  ALTO: 'error',
};

export interface ReportSummarySection {
  section: EvaluationSection;
  rating: EvaluationRating;
}

/**
 * GET /candidates/:id/report-summary — contrato dado directamente por el
 * usuario en el chat (Swagger solo documenta ruta/método, no el shape de
 * la respuesta). `status` llega como `string` genérico en el wire pero
 * sus valores son un subconjunto de CandidateStatus, y `sections[].section`/
 * `.rating` llegan como `string` genérico pero sus valores son
 * EvaluationSection/EvaluationRating — se tipan aquí contra los unions ya
 * existentes de la app para indexar EVALUATION_SECTION_LABEL/RATING_COLOR
 * sin cast, mismos valores en tiempo de ejecución.
 */
export interface ReportSummaryResponse {
  candidateId: string;
  folio: string;
  firstName: string;
  lastName: string;
  positionName: string;
  companyName: string;
  status: CandidateStatus;
  conclusion: string | null;
  reliabilityScore: number;
  riskLevel: RiskLevel;
  relevantFindings: string[];
  attentionAreas: string[];
  redFlags: string[];
  sections: ReportSummarySection[];
}
