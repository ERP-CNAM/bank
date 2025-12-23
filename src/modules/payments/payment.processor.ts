export type DirectDebitStatus =
  | 'TO_SEND'
  | 'SENT'
  | 'EXECUTED'
  | 'REJECTED';

export interface DirectDebitOrder {
  invoiceRef: string;
  executionDate: string;
  amount: number;
  paymentMethod: 'SEPA' | 'CARD';
  status: DirectDebitStatus;
}
