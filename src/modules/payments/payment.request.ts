export type PaymentMethodType = 'SEPA' | 'CARD';

export interface PaymentRequestDTO {
  invoiceRef: string;
  billingDate: string;      // format YYYY-MM-DD !!!
  executionDate: string;    // YYYY-MM-DD
  amountInclVat: number;
  paymentMethod: PaymentMethodType;

  iban?: string;
}
