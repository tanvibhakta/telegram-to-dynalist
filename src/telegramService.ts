import axios from "axios";
import { config } from "./config";

const TELEGRAM_API_URL_HOST = `https://api.telegram.org/bot${config.telegramToken}`;
const SEND_MESSAGE_TO_TELEGRAM_API = "/sendMessage";
const SET_REACTION_TELEGRAM_API = "/setMessageReaction";

// Send a message from the bot to the user on the telegram channel
export const sendMessage = async (
    chatId: number,
    text: string,
    messageId?: number | undefined,
): Promise<void> => {

    const data = {
            chat_id: chatId,
            text: text,
            ...(messageId ? {
                reply_parameters: { message_id: messageId }
            } : {})
        };

    try {
        await axios.post(`${TELEGRAM_API_URL_HOST}${SEND_MESSAGE_TO_TELEGRAM_API}`, data);
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
}

// Set a reaction on the user's message, to show that the bot has completed an action
export const setReaction = async (chatId: number, messageId: number): Promise<void> => {
    try {
        await axios.post(`${TELEGRAM_API_URL_HOST}${SET_REACTION_TELEGRAM_API}`, {
            chat_id: chatId,
            message_id: messageId,
            reaction: [
                {
                    type: "emoji",
                    emoji: "✍️",
                },
            ],
        });
    } catch (error) {
        console.error("Error setting reaction:", error);
        throw error;
    }
}
