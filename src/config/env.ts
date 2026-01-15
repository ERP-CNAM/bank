import dotenv from 'dotenv'
dotenv.config()

export const env = {
    PORT: process.env.PORT,
    CONNECT_URL: process.env.CONNECT_URL,
    CONNECT_API_KEY: process.env.CONNECT_API_KEY,
    SERVICE_NAME: process.env.SERVICE_NAME,
    SERVICE_VERSION: process.env.SERVICE_VERSION,
    SERVICE_HOST: process.env.SERVICE_HOST,
}
