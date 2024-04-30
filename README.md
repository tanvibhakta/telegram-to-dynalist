# Telegram to Dynalist 
Telegram is the app I use the most on my phone. Dynalist is my organisational succor on my desktop. I need an effective and simple way to manage one from the other (the dynalist android app is unfortunately just a little too much) and so thsi project was born.

## Stack
1. express.js (it works!)
2. railway.app for hosting 

## Goal 
To build a tool that adds a message from a specific telegram channel as a bullet point in my dynalist inbox. This will allow me to assign tasks to myself from telegram and I can use dynalist as the "get things done" store. But this will be an acceptable substitute on days I can't get to my laptop.

## Roadmap
- [ ] Handle edited messages from telegram correctly 
  - Editing a message currently adds a new item to the list with the edited message 
  - Editing a message on telegram should retrieve the previous item from dynalist and replace it with the new item
- [ ] implement `/edit` (can't do this using edited messages feature because no way to get the original message without implementing a database)
- [ ] implement `/showAllToDo`
- [ ] implement `/done`
- [ ] An inline keyboard on the telegram bot
- [ ] Onboarding flow that allows anyone to use the bot using their own dynalist API key
- [ ] find the file ID of their inbox automatically
- [x] Bot should use message reactions instead of responding to the message
- [x] if a message is sent without any `/commands` then it is assumed to be `/add`

