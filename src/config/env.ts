import dotenv from 'dotenv'
dotenv.config()

export const env = {
    BANK_PORT: process.env.BANK_PORT,
    CONNECT_URL: process.env.CONNECT_URL,
    BANK_NODE_ENV: process.env.BANK_NODE_ENV,
    CONNECT_API_KEY: process.env.CONNECT_API_KEY,
    BANK_SERVICE_NAME: process.env.BANK_SERVICE_NAME,
    BANK_SERVICE_VERSION: process.env.BANK_SERVICE_VERSION,
    SERVICE_HOST: process.env.SERVICE_HOST,
    CRON_ENABLED: process.env.CRON_ENABLED || 'false',     
    CRON_SCHEDULE: process.env.CRON_SCHEDULE || '0 2 1 * *'
}
