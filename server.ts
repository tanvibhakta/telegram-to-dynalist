import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Telegram and Dynalist configuration
const TELEGRAM_API_URL_HOST = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`;
const SEND_MESSAGE_TO_TELEGRAM_API = "/sendMessage";
const SET_REACTION_TELEGRAM_API = "/setMessageReaction";

const DYNALIST_API_URL_HOST = "https://dynalist.io/api/v1";
const ADD_TO_INBOX_PATH = "/inbox/add";
const EDIT_DOCUMENT = "/doc/edit";

const body = {
  token: process.env.DYNALIST_API_KEY,
};

const ACTIONS = {
  ADD: "add",
  EDIT: "edit",
  DELETE: "delete",
  DONE: "done"
  // LIST_ALL_TO_DO: "listAllToDo",
};

app.use(bodyParser.json());

// Check if the API is running
app.get("/health", (req, res) => {
  res.status(200).send({ status: "OK", message: "API is running" });
});

// Receive the webhook update from telegram when a new message is posted/a message is edited, etc
app.post("/webhook", async (req: Request, res: Response) => {

  let message, messageId, chatId;

  switch (getActionType(req)) {
    case ACTIONS.ADD:
      message = getPureMessage(req.body.message.text);
      messageId = req.body.message.message_id;
      chatId = req.body.message.chat.id;
      await addToDynalist(message);
      await setReaction(chatId, messageId);
      break;

    // case ACTIONS.EDIT:
    //   message = getPureMessage(req.body.edited_message.text);
    //   messageId = req.body.edited_message.message_id;
    //   chatId = req.body.edited_message.chat.id;

    case ACTIONS.DONE:
      message = req.body.reply_to_message.text;
      messageId = req.body.message.message_id;
      chatId = req.body.message.chat.id;
      // find the node id of the message to be marked
      await markItemAsDone(nodeId);
      await setReaction(chatId, messageId);
      break;


  }

  res.status(200).send("OK");
});

// This function gets the action type from the message whether declared explicitly or heuristics
function getActionType(req: Request) {

  let actionType = ACTIONS.ADD;
  if (req.body.message) {
    actionType = ACTIONS.ADD;
  } else if (req.body.edited_message) {
    actionType = ACTIONS.EDIT;
  }

  let message: string = req.body.message?.text || req.body.edited_message.text;

  if (message.startsWith("/add")) {
    actionType = ACTIONS.ADD;
  } else if (message?.startsWith("/edit")) {
    actionType = ACTIONS.EDIT;
  } else if (message?.startsWith("/delete")) {
    actionType = ACTIONS.DELETE;
  }  else if (message?.startsWith("/done")) {
    actionType = ACTIONS.DONE;
  }

  //TODO: if "/add" but edited_message, set actionType to ACTION.EDIT anyway

  return actionType;
}

// This function strips the message from any commands like /add /edit /delete that are present at the beginning of the message
function getPureMessage(text: string): string {
  return text.startsWith("/")
    ? text.slice(text.split(" ")[0].length + 1)
    : text;
}

// Create a list item in the Dynalist inbox
async function addToDynalist(content: string): Promise<void> {
  const data = {
    ...body,
    index: 0,
    content: content,
    checkbox: true,
  };

  try {
    await axios.post(`${DYNALIST_API_URL_HOST}${ADD_TO_INBOX_PATH}`, data);
  } catch (error) {
    console.error("Error updating Dynalist:", error);
  }
}

async function markItemAsDone(nodeId: string): Promise<void> {
  try {
    await axios.post(`${DYNALIST_API_URL_HOST}${EDIT_DOCUMENT}`, {
      ...body,
      file_id: process.env.DYNALIST_INBOX_ID,
      changes: [{
        action: "edit",
        node_id: nodeId,
        checked: true
      }]
    });
  } catch (error) {
    console.error("Error marking item as done in Dynalist:", error);
  }
}

async function getContentOfInbox() {
  try {
    await axios.post(`${DYNALIST_API_URL_HOST}/doc/read`, {
      ...body,
      file_id: process.env.DYNALIST_INBOX_ID,
    })
  } catch (error) {
    console.error("Error getting inbox content:", error);
  }
}

// function getNodeIdOfMessage(content, message: string) {
//   let nodeIds = []
//   content.nodes.forEach((node) => {
//     if (node.content.contains(message)) {
//       nodeIds.push(node.id);
//     }
//   })
// }

async function editItemInDynalist(content: string): Promise<void> {
  const data = {
    ...body,
    // index: 0,
    content: content,
    checkbox: true,
  };

  try {
    await axios.post(`${DYNALIST_API_URL_HOST}${EDIT_DOCUMENT}`, data);
  } catch (error) {
    console.error("Error editing item in Dynalist:", error);
  }
}

// Send a message from the bot to the user on the telegram channel
async function sendMessage(
  chatId: number,
  text: string,
  messageId: number,
): Promise<void> {
  try {
    await axios.post(
      `${TELEGRAM_API_URL_HOST}${SEND_MESSAGE_TO_TELEGRAM_API}`,
      {
        chat_id: chatId,
        text: text,
        reply_parameters: {
          message_id: messageId,
        },
      },
    );
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

// Set a reaction on the user's message, to show that the bot has completed an action
async function setReaction(chatId: number, messageId: number): Promise<void> {
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
  }
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
