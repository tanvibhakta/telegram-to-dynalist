import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Telegram and Dynalist configuration
const TELEGRAM_API_URL_HOST = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`;
const SEND_MESSAGE_TO_TELEGRAM_API = "/sendMessage";
const DYNALIST_API_URL_HOST = 'https://dynalist.io/api/v1';
const ADD_TO_INBOX_PATH = "/inbox/add";
const body = {
    token: process.env.DYNALIST_TOKEN,
};

app.use(bodyParser.json());

app.post('/webhook', async (req: Request, res: Response) => {
    console.log("request body ", JSON.stringify(req.body));

    const message = req.body.edited_message.text;
    const messageID = req.body.message.id;
    const chatId = req.body.message.chat.id;

    if (message.startsWith('/add ')) {
        const content = message.slice(5);  // Extract the content after the command
        await addToDynalist(content);
        await sendMessage(chatId, `Added to Dynalist ✅`, messageID);
    }

    res.status(200).send('OK');
});

async function addToDynalist(content: string): Promise<void> {

    console.log("we're sending the message to dynalist now, ", content);
    const data = {
        ...body,
        index: 0,
        content: content,
        checkbox: true,
    };

    try {
        await axios.post(`${DYNALIST_API_URL_HOST}${ADD_TO_INBOX_PATH}`, data);
    } catch (error) {
        console.error('Error updating Dynalist:', error);
    }
}

async function sendMessage(chatId: number, text: string, message_id: number): Promise<void> {
    try {
        await axios.post(`${TELEGRAM_API_URL_HOST}${SEND_MESSAGE_TO_TELEGRAM_API}`, {
            chat_id: chatId,
            text: text,
            reply_parameters: {
                message_id: message_id
            }
        });
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
