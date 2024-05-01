import dotenv from 'dotenv';
dotenv.config();

export const config = {
    httpPort: process.env.PORT || 3000,
    telegramToken: process.env.TELEGRAM_TOKEN,
    dynalistApiKey: process.env.DYNALIST_API_KEY,
    dynalistInboxId: process.env.DYNALIST_INBOX_ID,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    databasePort: process.env.DB_PORT,

};
