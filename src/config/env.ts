import dotenv from 'dotenv'
dotenv.config()

export const env = {
    PORT: process.env.PORT || 3000,
    CONNECT_URL: process.env.CONNECT_URL || 'http://localhost:8000',
    CONNECT_API_KEY: process.env.CONNECT_API_KEY || 'hello',
    SERVICE_NAME: process.env.SERVICE_NAME || 'BANK',
    SERVICE_VERSION: process.env.SERVICE_VERSION || '1.0.0',
    SERVICE_HOST: process.env.SERVICE_HOST || 'localhost',
}
