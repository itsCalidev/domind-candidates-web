import type { CandidateDetail, CandidateGeneralInfo, EvidencePhoto } from '../types/candidate.types';
import { DOCUMENT_DEFINITIONS } from './documentCatalog';

/** Mínimo de fotografías de vivienda exigido para poder finalizar la captura. */
const MIN_HOUSING_EVIDENCE_COUNT = 3;

/**
 * Validador de "Perfil Mínimo Viable" para el botón "Finalizar captura".
 * El backend acepta guardados parciales (`@IsOptional()` en casi todos los
 * DTO de esta app), así que nada impide que un candidato quede en `DRAFT`
 * con secciones a medio llenar — este archivo es la única fuente de
 * verdad de "qué le falta" antes de permitir marcarlo `COMPLETED`.
 *
 * Recorre exclusivamente campos reales de `CandidateDetail` (nunca
 * `curp`/`rfc`, que no existen como texto en este proyecto — solo como
 * `DocumentType` de evidencia subida, fuera del alcance de este
 * validador). Los pares booleano→detalle (`hasPastDiseases`→`pastDiseases`,
 * `hasInfonavitDebt`→`infonavitAmount`, etc.) solo exigen el detalle
 * cuando el booleano es explícitamente `true`; si es `false`, esa
 * sub-regla se da por completa. Si el booleano mismo sigue sin responder
 * (`null`/`undefined`), se reporta como faltante — un "Pendiente" nunca
 * cuenta como perfil completo, mismo criterio ya aplicado en las tarjetas
 * de Salud/Familia.
 */

/** Placeholder que candidateService.ts usa en `generalInfo` cuando el backend no trae el dato — nunca es un valor real. */
const NOT_REGISTERED = 'No registrado';

/** `maritalStatus` (código del backend, no la etiqueta en español) para los que el cónyuge sí aplica. */
const MARITAL_STATUSES_WITH_SPOUSE: readonly string[] = ['MARRIED', 'FREE_UNION'];

function isMissingText(value: string): boolean {
  return value.trim() === '' || value === NOT_REGISTERED;
}

function isMissingNullableText(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim() === '';
}

function isMissingNumber(value: number | null | undefined): boolean {
  return value === null || value === undefined;
}

function isMissingBoolean(value: boolean | null | undefined): boolean {
  return value === null || value === undefined;
}

export interface MissingDataReport {
  isComplete: boolean;
  /** Nombre de sección → lista de campos faltantes en esa sección, en el orden en que se evaluaron. */
  bySection: Record<string, string[]>;
}

/**
 * Reglas de "Información General" completa — extraídas de
 * `getMissingDataReport` para que el flujo MAGIC_LINK de "Finalizar
 * Captura" (ver CandidateDetailPage.tsx) pueda validar ÚNICAMENTE esta
 * sección, sin correr el resto del reporte completo (Familia/Salud/
 * Vivienda/Documentación/Economía las sigue llenando el propio candidato
 * vía el Wizard, el reclutador no las edita para MAGIC_LINK). Misma
 * fuente de verdad para ambos modos — ningún criterio duplicado.
 */
export function getMissingGeneralInfoFields(info: CandidateGeneralInfo): string[] {
  const missing: string[] = [];
  function add(field: string, isMissing: boolean) {
    if (isMissing) missing.push(field);
  }

  add('Domicilio', isMissingText(info.address));
  add('Colonia', isMissingText(info.neighborhood));
  add('Código postal', isMissingText(info.postalCode));
  add('Teléfono', isMissingText(info.phone));
  add('Correo electrónico', isMissingText(info.email));
  add('Fecha de nacimiento', isMissingText(info.birthDate));
  add('Lugar de nacimiento', isMissingText(info.birthPlace));
  add('Estado civil', isMissingText(info.civilStatus));
  if (MARITAL_STATUSES_WITH_SPOUSE.includes(info.civilStatus)) {
    add('Fecha de nacimiento del cónyuge', isMissingText(info.spouseBirthDate));
  }
  add('Último grado de estudios', isMissingText(info.highestEducation));
  add('Tipo de comprobante de estudios', isMissingText(info.studiesProofType));
  add('Fecha del comprobante de estudios', isMissingText(info.studiesProofDate));
  add('Empresa', isMissingText(info.companyName));
  add('Puesto solicitado', isMissingText(info.positionApplied));

  return missing;
}

/**
 * `documentEvidence`/`housingEvidence`: la evidencia (documentos y fotos
 * de vivienda) no vive embebida en `CandidateDetail` — es su propio
 * endpoint (`GET /candidates/:id/evidence?category=...`, ver
 * `useGetEvidence`). Por eso el llamador (CandidateDetailPage) debe
 * pasarlas explícitamente, ya obtenidas de esas queries.
 */
export function getMissingDataReport(
  candidate: CandidateDetail,
  documentEvidence: EvidencePhoto[],
  housingEvidence: EvidencePhoto[],
): MissingDataReport {
  const bySection: Record<string, string[]> = {};

  function flag(section: string, field: string, missing: boolean) {
    if (!missing) return;
    if (!bySection[section]) bySection[section] = [];
    bySection[section].push(field);
  }

  // ---- Información General ----
  const SECTION_GENERAL = 'Información General';
  getMissingGeneralInfoFields(candidate.generalInfo).forEach((field) => flag(SECTION_GENERAL, field, true));

  // ---- Estructura Familiar ----
  const SECTION_FAMILY = 'Estructura Familiar';
  const family = candidate.family;
  flag(SECTION_FAMILY, '¿Familiares en gobierno?', isMissingBoolean(family.hasGovRelatives));
  if (family.hasGovRelatives === true) {
    flag(SECTION_FAMILY, 'Detalle de familiares en gobierno', isMissingNullableText(family.govRelativesDetails));
  }
  flag(SECTION_FAMILY, '¿Cargos políticos?', isMissingBoolean(family.hasPoliticalPosts));
  if (family.hasPoliticalPosts === true) {
    flag(SECTION_FAMILY, 'Detalle de cargos políticos', isMissingNullableText(family.politicalPostsDetails));
  }
  flag(SECTION_FAMILY, 'Integrantes de la familia', candidate.familyMembers.length === 0);
  candidate.familyMembers.forEach((member, index) => {
    const memberLabel = member.name.trim() || `Integrante #${index + 1}`;
    flag(SECTION_FAMILY, `Edad de ${memberLabel}`, isMissingNumber(member.age));
    flag(SECTION_FAMILY, `Ocupación de ${memberLabel}`, isMissingNullableText(member.occupation));
  });

  // ---- Salud ----
  const SECTION_HEALTH = 'Salud';
  const health = candidate.health;
  flag(SECTION_HEALTH, 'Peso', isMissingNumber(health.weight));
  flag(SECTION_HEALTH, 'Estatura', isMissingNumber(health.height));
  flag(SECTION_HEALTH, '¿Usa lentes?', isMissingBoolean(health.usesGlasses));
  flag(SECTION_HEALTH, 'Aspecto físico', isMissingNullableText(health.physicalAspect));
  flag(SECTION_HEALTH, 'Estado de salud actual', isMissingNullableText(health.currentHealth));
  flag(SECTION_HEALTH, '¿Antecedentes familiares de enfermedades crónicas?', isMissingBoolean(health.chronicDiseasesFamily));
  if (health.chronicDiseasesFamily === true) {
    flag(SECTION_HEALTH, 'Detalle de antecedentes familiares', isMissingNullableText(health.chronicDiseasesDetails));
  }
  flag(SECTION_HEALTH, '¿Enfermedades pasadas?', isMissingBoolean(health.hasPastDiseases));
  if (health.hasPastDiseases === true) {
    flag(SECTION_HEALTH, 'Detalle de enfermedades pasadas', isMissingNullableText(health.pastDiseases));
  }
  flag(SECTION_HEALTH, '¿Cirugías?', isMissingBoolean(health.hasSurgeries));
  if (health.hasSurgeries === true) {
    flag(SECTION_HEALTH, 'Detalle de cirugías', isMissingNullableText(health.surgeries));
  }
  flag(SECTION_HEALTH, 'Acceso a servicios de salud', health.healthcareAccess.length === 0);
  flag(SECTION_HEALTH, 'Frecuencia de consumo de alcohol', isMissingNullableText(health.alcoholFrequency));
  flag(SECTION_HEALTH, '¿Fuma?', isMissingBoolean(health.smokes));
  if (health.smokes === true) {
    flag(SECTION_HEALTH, 'Cigarros por día', isMissingNumber(health.cigarettesPerDay));
    flag(SECTION_HEALTH, 'Gasto semanal en cigarros', isMissingNumber(health.smokingExpensePerWeek));
  }
  flag(SECTION_HEALTH, '¿Ha consumido drogas?', isMissingBoolean(health.usedDrugs));
  if (health.usedDrugs === true) {
    flag(SECTION_HEALTH, 'Detalle de consumo de drogas', isMissingNullableText(health.drugsDetails));
  }
  flag(SECTION_HEALTH, 'Calidad de la alimentación', isMissingNullableText(health.dietQuality));
  flag(SECTION_HEALTH, 'Actividad física', isMissingNullableText(health.physicalActivity));
  flag(SECTION_HEALTH, 'Horas sedentarias al día', isMissingNumber(health.sedentaryHours));
  flag(SECTION_HEALTH, 'Horas de pantalla al día', isMissingNumber(health.screenTimeHours));

  // ---- Vivienda ----
  const SECTION_HOUSING = 'Vivienda';
  const housing = candidate.housing;
  flag(SECTION_HOUSING, 'Tipo de vivienda', isMissingNullableText(housing.housingType));
  flag(SECTION_HOUSING, 'Condiciones de la vivienda', isMissingNullableText(housing.housingConditions));
  flag(SECTION_HOUSING, 'Propietario', isMissingNullableText(housing.propertyOwner));
  flag(SECTION_HOUSING, 'Tiempo de vivir ahí', isMissingNullableText(housing.timeLivingThere));
  flag(SECTION_HOUSING, 'Habitaciones', isMissingNumber(housing.roomsCount));
  flag(SECTION_HOUSING, 'Baños', isMissingNumber(housing.bathroomsCount));
  flag(SECTION_HOUSING, 'Salas', isMissingNumber(housing.livingRoomCount));
  flag(SECTION_HOUSING, 'Comedores', isMissingNumber(housing.diningRoomCount));
  flag(SECTION_HOUSING, 'Cocinas', isMissingNumber(housing.kitchenCount));
  flag(SECTION_HOUSING, 'Patios', isMissingNumber(housing.patioCount));
  flag(SECTION_HOUSING, 'Servicios públicos', housing.publicServices.length === 0);
  flag(SECTION_HOUSING, '¿Deuda Infonavit/hipotecaria?', isMissingBoolean(housing.hasInfonavitDebt));
  if (housing.hasInfonavitDebt === true) {
    flag(SECTION_HOUSING, 'Monto de deuda Infonavit', isMissingNumber(housing.infonavitAmount));
    flag(SECTION_HOUSING, 'Número de crédito Infonavit', isMissingNullableText(housing.infonavitCreditNumber));
  }
  flag(
    SECTION_HOUSING,
    `Fotografías de la vivienda (mínimo ${MIN_HOUSING_EVIDENCE_COUNT})`,
    housingEvidence.length < MIN_HOUSING_EVIDENCE_COUNT,
  );

  // ---- Documentación ----
  // Solo se exige para MAGIC_LINK: el candidato la sube él mismo en su
  // propio Wizard. En MANUAL, el reclutador es quien captura todo a
  // mano y los documentos dejaron de ser un requisito para poder
  // finalizar — pedido explícito del usuario, ya no deben bloquear
  // "Finalizar Captura" en ese modo.
  if (candidate.captureMode === 'MAGIC_LINK') {
    const SECTION_DOCUMENTS = 'Documentación';
    DOCUMENT_DEFINITIONS.forEach((definition) => {
      const isUploaded = documentEvidence.some((evidence) => evidence.documentType === definition.type);
      flag(SECTION_DOCUMENTS, definition.label, !isUploaded);
    });
  }

  // ---- Economía ----
  const SECTION_ECONOMY = 'Economía';
  const economy = candidate.economy;
  flag(SECTION_ECONOMY, 'Gasto en alimentación', isMissingNumber(economy.expensesFood));
  flag(SECTION_ECONOMY, 'Gasto en luz', isMissingNumber(economy.expensesLight));
  flag(SECTION_ECONOMY, 'Gasto en gas', isMissingNumber(economy.expensesGas));
  flag(SECTION_ECONOMY, 'Gasto en teléfono', isMissingNumber(economy.expensesPhone));
  flag(SECTION_ECONOMY, 'Gasto en transporte', isMissingNumber(economy.expensesTransport));
  flag(SECTION_ECONOMY, 'Gasto en educación', isMissingNumber(economy.expensesEducation));
  flag(SECTION_ECONOMY, 'Gasto médico', isMissingNumber(economy.expensesMedical));
  flag(SECTION_ECONOMY, 'Gasto en renta/otros', isMissingNumber(economy.expensesRentOther));
  flag(SECTION_ECONOMY, 'Gastos extra', isMissingNumber(economy.expensesExtra));
  flag(SECTION_ECONOMY, 'Total de gastos', isMissingNumber(economy.expensesTotal));
  flag(SECTION_ECONOMY, 'Ingresos', candidate.incomes.length === 0);
  flag(SECTION_ECONOMY, '¿Otros gastos?', isMissingBoolean(economy.hasOtherExpenses));
  if (economy.hasOtherExpenses === true) {
    flag(SECTION_ECONOMY, 'Detalle de otros gastos', candidate.otherExpenses.length === 0);
  }
  flag(SECTION_ECONOMY, '¿Tiene vehículos?', isMissingBoolean(economy.hasVehicles));
  if (economy.hasVehicles === true) {
    flag(SECTION_ECONOMY, 'Detalle de vehículos', candidate.vehicles.length === 0);
  }
  flag(SECTION_ECONOMY, '¿Tiene tarjetas bancarias?', isMissingBoolean(economy.hasBankCards));
  if (economy.hasBankCards === true) {
    flag(SECTION_ECONOMY, 'Detalle de tarjetas bancarias', candidate.bankCards.length === 0);
  }
  flag(SECTION_ECONOMY, '¿Tiene deudas?', isMissingBoolean(economy.hasDebts));
  if (economy.hasDebts === true) {
    flag(SECTION_ECONOMY, 'Detalle de deudas', candidate.debts.length === 0);
  }

  return { isComplete: Object.keys(bySection).length === 0, bySection };
}
