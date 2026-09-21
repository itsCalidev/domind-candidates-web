import { EconomyForm } from './forms/EconomyForm';
import type {
  BankCard,
  CandidateCaptureMode,
  CandidateCaptureStatus,
  CandidateEconomy,
  Debt,
  Income,
  OtherExpense,
  Vehicle,
} from '../types/candidate.types';

interface EconomyTabProps {
  candidateId: string;
  economy: CandidateEconomy;
  incomes: Income[];
  vehicles: Vehicle[];
  debts: Debt[];
  bankCards: BankCard[];
  otherExpenses: OtherExpense[];
  captureMode: CandidateCaptureMode;
  captureStatus: CandidateCaptureStatus;
}

/**
 * Envoltorio delgado: toda la lógica vive en EconomyForm.tsx, compartida
 * con el paso correspondiente del Wizard de Autollenado
 * (`mode="candidate"`). Este componente solo fija `mode="admin"`.
 */
export function EconomyTab({
  candidateId,
  economy,
  incomes,
  vehicles,
  debts,
  bankCards,
  otherExpenses,
  captureMode,
  captureStatus,
}: EconomyTabProps) {
  return (
    <EconomyForm
      mode="admin"
      candidateId={candidateId}
      economy={economy}
      incomes={incomes}
      vehicles={vehicles}
      debts={debts}
      bankCards={bankCards}
      otherExpenses={otherExpenses}
      captureMode={captureMode}
      captureStatus={captureStatus}
    />
  );
}
