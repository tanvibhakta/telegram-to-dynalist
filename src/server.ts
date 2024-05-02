import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import {sendMessage, setReaction} from "./telegramService";
import {addToDynalist, editItem, getContent, markItemAsDone} from "./dynalistService";
import {createRecord, getNodeId} from "./postgresService";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const ACTIONS = {
  ADD: "add",
  EDIT: "edit",
  DELETE: "delete",
  DONE: "done",
  SHOW_ALL_TASKS: "showAllTasks"
};

app.use(bodyParser.json());

// Check if the API is running
app.get("/health", (req, res) => {
  res.status(200).send({ status: "OK", message: "API is running" });
});

// Receive the webhook update from telegram when a new message is posted/a message is edited, etc
app.post("/webhook", async (req: Request, res: Response) => {


  let message, messageId, chatId;

  // TODO: Surface all errors that happen here to the client so they don't fail silently
  switch (getActionType(req)) {
    case ACTIONS.ADD:
      message = getPureMessage(req.body.message.text);
      messageId = req.body.message.message_id;
      chatId = req.body.message.chat.id;
      try {
        const dynalistRes = await addToDynalist(message);
        await createRecord(messageId, dynalistRes.node_id);
        await setReaction(chatId, messageId);
      } catch (error) {
        console.error('Error adding to dynalist:', error);
      }

      break;

    case ACTIONS.EDIT:
      message = getPureMessage(req.body.edited_message.text);
      messageId = req.body.edited_message.message_id;
      chatId = req.body.edited_message.chat.id;
      try {
        const nodeId = await getNodeId(messageId);
        await editItem(message, nodeId);
      } catch (error) {
          console.error('Error editing in dynalist:', error);
      }
      break;

    case ACTIONS.DONE:
      const replyMessageId = req.body.message.reply_to_message.message_id;
      messageId = req.body.message.message_id;
      chatId = req.body.message.chat.id;
      // find the node id of the message to be marked
    try {
      const nodeId = await getNodeId(replyMessageId);
      await markItemAsDone(nodeId);
      await setReaction(chatId, messageId);
    } catch (error) {
      console.error('Error marking item as done:', error);
    }
      break;

    case ACTIONS.SHOW_ALL_TASKS:
      chatId = req.body.message ? req.body.message.chat.id :  req.body.edited_message.chat.id;
        try {
            const items = await getContent();
            const tasks = getUndoneTasks(items);
            for (const task of tasks) {
                await sendMessage(chatId, task.content);
            }
        } catch (error) {
            console.error('Error getting items:', error);
        }
      break;

  }

  res.status(200).send("OK");
});

// This function gets the action type from the message whether declared explicitly or heuristics
function getActionType(req: Request) {

  let actionType = ACTIONS.ADD;

  let message: string = req.body.message?.text || req.body.edited_message.text;

  if (message.startsWith("/add")) {
    actionType = ACTIONS.ADD;
  } else if (message?.startsWith("/edit")) {
    actionType = ACTIONS.EDIT;
  } else if (message?.startsWith("/delete")) {
    actionType = ACTIONS.DELETE;
  }  else if (message?.startsWith("/done")) {
    actionType = ACTIONS.DONE;
  } else if (message?.startsWith("/showAllTasks")) {
    actionType = ACTIONS.SHOW_ALL_TASKS;
  }

    if ( actionType == ACTIONS.ADD && req.body.edited_message) {
    actionType = ACTIONS.EDIT;
  }

  return actionType;
}

// This function strips the message from any commands like /add /edit /delete that are present at the beginning of the message
function getPureMessage(text: string): string {
  return text.startsWith("/")
    ? text.slice(text.split(" ")[0].length + 1)
    : text;
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

function getUndoneTasks(items: any[]) {
  const rootItem = items.find(item => item.id === "root");

  // TODO: surface this to the client (for example if their inbox is empty)
  if (!rootItem || !rootItem.children) {
    console.error("Root item not found or it has no children");
    return [];
  }

  const childrenIds = rootItem.children;
  return items.filter(item => childrenIds.includes(item.id) && item.checked == undefined);
}