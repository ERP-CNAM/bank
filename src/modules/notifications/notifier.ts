import { callService } from '../../core/connect'
import { BankOperationDTO } from '../payments/bank.response'

const CONNECT_URL = process.env.CONNECT_URL || 'http://localhost:3000'

export async function notifyMoney(
    operation: BankOperationDTO | BankOperationDTO[],
): Promise<void> {
    const payload = Array.isArray(operation) ? operation : [operation]
    try {
        // Appel via Connect : Service "MONEY", Route "/bank/operations" (selon spec du groupe 3)
        await callService('MONEY', '/bank/operations', 'POST', payload)

        console.log(
            `[NOTIF] Application MONEY notifiée pour ${payload.length} opération(s).`,
        )
    } catch (error: any) {
        // On ne bloque pas le processus si Money est éteint, mais on log l'erreur
        console.error(
            '[NOTIF ERROR] Impossible de notifier MONEY (Service éteint ou erreur Connect).',
        )
    }
}
