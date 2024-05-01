import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import { setReaction } from "./telegramService";
import {addToDynalist, editItem, markItemAsDone} from "./dynalistService";
import {createRecord, getAllItems, getNodeId} from "./postgresService";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;


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
      try {
        const dynalistRes = await addToDynalist(message);
        await createRecord(messageId, dynalistRes.node_id);
        await setReaction(chatId, messageId);
      } catch (error) {
        console.error('Error adding to dynalist:', error);
      }

      break;

    case ACTIONS.EDIT:
      console.log("edit")
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
  }

  if (req.body.message) {
    actionType = ACTIONS.ADD;
  } else if (req.body.edited_message) {
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
