import axios from 'axios';
import { BankOperationDTO } from '../payments/bank.response';

const CONNECT_URL = process.env.CONNECT_URL || 'http://localhost:3000';

export async function notifyMoney(
  operation: BankOperationDTO
): Promise<void> {

  try {
    await axios.post(`${CONNECT_URL}/connect`, {
      clientName: 'BANK',
      clientVersion: '1.0.0',
      serviceName: 'MONEY',
      path: '/bank/operations',
      payload: [operation]
    });

    console.log(`Application MONEY notifiée pour ${operation.invoiceRef}`);
  } catch (error) {
    console.error('Erreur notification MONEY', error);
  }
}
