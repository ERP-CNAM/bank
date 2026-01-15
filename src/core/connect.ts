import axios from 'axios'
import { env } from '../config/env'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const registerService = async () => {
    let registered = false

    while (!registered) {
        try {
            console.log(
                `🔄 Tentative d'enregistrement de ${env.SERVICE_NAME} auprès de Connect (${env.CONNECT_URL})...`,
            )

            await axios.post(`${env.CONNECT_URL}/register`, {
                name: env.SERVICE_NAME,
                description: 'Module bancaire et facturation',
                version: env.SERVICE_VERSION,
                routes: [
                    { path: 'trigger-sync', method: 'POST', permission: 0 }, // Route pour lancer le traitement manuellement
                    { path: 'ping', method: 'GET', permission: 0 },
                    { path: 'api/payment', method: 'POST', permission: 0 }, // Route adaptée à index.ts
                    { path: 'api/payment/{ref}', method: 'GET', permission: 0 },
                ],
                listeningPort: Number(env.PORT),
                overrideIp: env.SERVICE_HOST,
                apiKey: env.CONNECT_API_KEY,
            })
            console.log('✅ Service enregistré correctement')
            registered = true
        } catch (error: any) {
            console.error(
                "❌ Échec de l'enregistrement du service :",
                error.message,
            )
            await sleep(5000)
            if (error.response) {
                console.error('Données :', error.response.data)
            }
        }
    }
}

// Fonction pour appeler un autre service via Connect
export const callService = async (
    targetService: string,
    path: string,
    method: string,
    payload: any = {},
) => {
    try {
        console.log(`Calling ${targetService} via Connect: ${method} ${path}`)
        const response = await axios.post(`${env.CONNECT_URL}/connect`, {
            apiKey: env.CONNECT_API_KEY,
            clientName: env.SERVICE_NAME,
            clientVersion: env.SERVICE_VERSION,
            serviceName: targetService,
            path: path,
            debug: true,
            payload: payload,
        })
        if (!response.data.success) {
            console.error(`Connect Error Response:`, response.data)
            throw new Error(`Connect Error: ${response.data.message}`)
        }
        return response.data.payload
    } catch (error: any) {
        console.error(
            `Erreur lors de l'appel à ${targetService} :`,
            error.message,
        )
        throw error
    }
}
