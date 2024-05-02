import axios from "axios";
import { config } from "./config";

// Dynalist configuration
const DYNALIST_API_URL_HOST = "https://dynalist.io/api/v1";
const ADD_TO_INBOX_PATH = "/inbox/add";
const READ_DOCUMENT = "/doc/read";
const EDIT_DOCUMENT = "/doc/edit";

const body = {
    token: config.dynalistApiKey,
};

// Create a list item in the Dynalist inbox
export const addToDynalist = async (content: string): Promise<any> => {
    const data = {
        ...body,
        index: 0,
        content: content,
        checkbox: true,
    };

    try {
        const response  = await axios.post(`${DYNALIST_API_URL_HOST}${ADD_TO_INBOX_PATH}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating Dynalist:", error);
        throw error;
    }
}

export const markItemAsDone = async (nodeId: string): Promise<void> => {
    try {
        await axios.post(`${DYNALIST_API_URL_HOST}${EDIT_DOCUMENT}`, {
            ...body,
            file_id: config.dynalistInboxId,
            changes: [{
                action: "edit",
                node_id: nodeId,
                checked: true
            }]
        });
    } catch (error) {
        console.error("Error marking item as done in Dynalist:", error);
        throw error;
    }
}

export const getContent = async () => {
    try {
        const res = await axios.post(`${DYNALIST_API_URL_HOST}${READ_DOCUMENT}`, {
            ...body,
            file_id: process.env.DYNALIST_INBOX_ID,
        })
        return res.data.nodes;
    } catch (error) {
        console.error("Error getting inbox content:", error);
        throw error;
    }
}

export const editItem = async (content: string, nodeId: string): Promise<void> => {

    try {
        await axios.post(`${DYNALIST_API_URL_HOST}${EDIT_DOCUMENT}`, {
                ...body,
                file_id: config.dynalistInboxId,
                changes: [{
                    action: "edit",
                    content: content,
                    node_id: nodeId,

                }]
            });
    } catch (error) {
        console.error("Error editing item in Dynalist:", error);
    }
}
