import { PaymentRequestDTO } from './payment.request';
import { BankOperationDTO } from './bank.response';

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

export function processPayment(
  request: PaymentRequestDTO
): BankOperationDTO {

  // on créé l'ordre de prélèvement
  const order: DirectDebitOrder = {
    invoiceRef: request.invoiceRef,
    executionDate: request.executionDate,
    amount: request.amountInclVat,
    paymentMethod: request.paymentMethod,
    status: 'TO_SEND'
  };

  // simulation l'exécution bancaire
  const isSuccessful = Math.random() > 0.1;

  order.status = isSuccessful ? 'EXECUTED' : 'REJECTED';

  // transformation en opération bancaiore
  return {
    executionDate: order.executionDate,
    invoiceRef: order.invoiceRef,
    amount: order.amount,
    paymentMethod: order.paymentMethod,
    status: isSuccessful ? 'PAID' : 'REJECTED'
  };
}