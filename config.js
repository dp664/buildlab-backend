const { config } = require('dotenv');
const path = require('path');

// Determine which .env file to load based on NODE_ENV
let envFileName = '.env.development'; // Default to development
if (process.env.NODE_ENV === 'production') {
    console.log('Loading .env.production');
    envFileName = '.env.production';
} else if (process.env.NODE_ENV === 'test') {
    console.log('Loading .env.test');
    envFileName = '.env.test';
}

// Load the appropriate .env file
const envFilePath = path.resolve(process.cwd(), envFileName);
config({ path: envFilePath });

const APP_CONFIG = {
    SERVER_PORT: process.env.SERVER_PORT,
    HOST: process.env.HOST,
    PORT: process.env.PORT,
    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD,
    DATABASE: process.env.DATABASE,
    DB_PORT: process.env.DB_PORT,
    CORS_TRUSTED_ORIGIN: process.env.CORS_TRUSTED_ORIGIN,
    LOG_LEVEL: process.env.LOG_LEVEL,
    LOG_FILE_DIRECTORY: process.env.LOG_FILE_DIRECTORY,
    LOG_FILE_NAME: process.env.LOG_FILE_NAME,
    BL_AUTH_JWT_TOKEN_NAME: process.env.BL_AUTH_JWT_TOKEN_NAME,
    SECRET_KEY: process.env.AUTH_SECRET_KEY,
    BL_AUTH_COOKIE_NAME: process.env.BL_AUTH_COOKIE_NAME,
    BL_AUTH_SECRET_KEY: process.env.BL_AUTH_SECRET_KEY,
    BL_AUTH_COOKIE_HTTP_ONLY: process.env.BL_AUTH_COOKIE_HTTP_ONLY,
    BL_AUTH_COOKIE_HTTP_ONLY: process.env.BL_AUTH_COOKIE_HTTP_ONLY,
    BL_AUTH_COOKIE_SECURE: process.env.BL_AUTH_COOKIE_SECURE,
    BL_AUTH_COOKIE_SAME_SITE: process.env.BL_AUTH_COOKIE_SAME_SITE,
    BL_AUTH_COOKIE_ALLOWED_DOMAIN: process.env.BL_AUTH_COOKIE_ALLOWED_DOMAIN,
    BL_AUTH_COOKIE_MAXAGE: process.env.BL_AUTH_COOKIE_MAXAGE,
    GITHUB_CLIENT_SECRET: process.env.BL_AUTH_GITHUB_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.BL_AUTH_GITHUB_CLIENT_ID
    }

module.exports = APP_CONFIG