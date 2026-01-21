import axios from 'axios'
import { env } from '../../config/env'
import { IBankProvider } from '../../domain/interfaces/IBankProvider'

export class ConnectAdapter implements IBankProvider {
    // Fonction pour appeler un autre service via Connect
    private async callService(
        targetService: string,
        path: string,
        method: string,
        payload: any = {},
    ) {
        try {
            console.log(
                `Calling ${targetService} via Connect: ${method} ${path}`,
            )

            const axiosResponse = await axios({
                method: method,
                url: `${env.CONNECT_URL}/connect`,
                data: {
                    apiKey: env.CONNECT_API_KEY,
                    clientName: env.BANK_SERVICE_NAME,
                    clientVersion: env.BANK_SERVICE_VERSION,
                    serviceName: targetService,
                    path: path,
                    debug: true,
                    payload: payload,
                },
            })

            const response = axiosResponse.data

            console.log(`📞 Response : `, response)

            if (!response.success) {
                throw new Error(`❌ Connect Error: ${response.message}`)
            }
            return response.payload
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message
            console.error(
                `❌ Erreur lors de l'appel à ${targetService} : ${msg}`,
            )
            throw new Error(msg)
        }
    }
    async fetchDirectDebits(executionDate: string): Promise<any[]> {
        // GET via POST pour Connect
        return this.callService(
            'back',
            `/exports/banking/direct-debits?executionDate=${executionDate}`,
            'GET',
        )
    }

    async notifyPaymentUpdates(updates: any[]): Promise<void> {
        await this.callService('back', '/bank/payment-updates', 'POST', updates)
    }

    async registerService(routes: any[]): Promise<void> {
        let registered = false
        while (!registered) {
            try {
                await axios.post(`${env.CONNECT_URL}/register`, {
                    name: env.BANK_SERVICE_NAME,
                    version: env.BANK_SERVICE_VERSION,
                    description: 'Module bancaire',
                    routes,
                    listeningPort: env.BANK_PORT,
                    overrideIp: env.SERVICE_HOST,
                    apiKey: env.CONNECT_API_KEY,
                })
                console.log('✅ Service enregistré auprès de Connect')
                registered = true
            } catch (e: any) {
                console.log(
                    "⏳ En attente de Connect... Échec de l'enregistrement :",
                    e.message,
                )
                await new Promise((r) => setTimeout(r, 3000))
            }
        }
    }
}
