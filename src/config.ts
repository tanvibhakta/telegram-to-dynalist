import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    telegramToken: process.env.TELEGRAM_TOKEN,
    dynalistApiKey: process.env.DYNALIST_API_KEY,
    dynalistInboxId: process.env.DYNALIST_INBOX_ID
};
