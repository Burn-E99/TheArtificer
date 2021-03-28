/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

import {
	// Discordeno deps
	Message, MessageContent,

	// nanoid deps
	nanoid
} from "../deps.ts";

import { DEBUG } from "../flags.ts";
import { LogTypes } from "./utils.enums.ts";

// Constant initialized at runtime for consistent file names
let startDate: string;
let logFolder: string;
let initialized = false;

// ask(prompt) returns string
// ask prompts the user at command line for message
const ask = async (question: string, stdin = Deno.stdin, stdout = Deno.stdout): Promise<string> => {
	const buf = new Uint8Array(1024);

	// Write question to console
	await stdout.write(new TextEncoder().encode(question));

	// Read console's input into answer
	const n = <number>await stdin.read(buf);
	const answer = new TextDecoder().decode(buf.subarray(0, n));

	return answer.trim();
};

// cmdPrompt(logChannel, botName, sendMessage) returns nothing
// cmdPrompt creates an interactive CLI for the bot, commands can vary
const cmdPrompt = async (logChannel: string, botName: string, sendMessage: (c: string, m: string) => Promise<Message>): Promise<void> => {
	let done = false;

	while (!done) {
		// Get a command and its args
		const fullCmd = await ask("cmd> ");

		// Split the args off of the command and prep the command
		const args = fullCmd.split(" ");
		const command = args.shift()?.toLowerCase();

		// All commands below here

		// exit or e
		// Fully closes the bot
		if (command === "exit" || command === "e") {
			console.log(`${botName} Shutting down.\n\nGoodbye.`);
			done = true;
			Deno.exit(0);
		}
		
		// stop
		// Closes the CLI only, leaving the bot running truly headless
		else if (command === "stop") {
			console.log(`Closing ${botName} CLI.  Bot will continue to run.\n\nGoodbye.`);
			done = true;
		}
		
		// m [channel] [message]
		// Sends [message] to specified [channel]
		else if (command === "m") {
			try {
				const channelID = args.shift() || "";
				const message = args.join(" ");

				sendMessage(channelID, message).catch(reason => {
					console.error(reason);
				});
			}
			catch (e) {
				console.error(e);
			}
		}
		
		// ml [message]
		// Sends a message to the specified log channel
		else if (command === "ml") {
			const message = args.join(" ");

			sendMessage(logChannel, message).catch(reason => {
				console.error(reason);
			});
		}
		
		// help or h
		// Shows a basic help menu
		else if (command === "help" || command === "h") {
			console.log(`${botName} CLI Help:\n\nAvailable Commands:\n  exit - closes bot\n  stop - closes the CLI\n  m [ChannelID] [messgae] - sends message to specific ChannelID as the bot\n  ml [message] sends a message to the specified botlog\n  help - this message`);
		}
		
		// Unhandled commands die here
		else {
			console.log("undefined command");
		}
	}
};

// sendIndirectMessage(originalMessage, messageContent, sendMessage, sendDirectMessage) returns Message
// sendIndirectMessage determines if the message needs to be sent as a direct message or as a normal message
const sendIndirectMessage = async (originalMessage: Message, messageContent: (string | MessageContent), sendMessage: (c: string, m: (string | MessageContent)) => Promise<Message>, sendDirectMessage: (c: string, m: (string | MessageContent)) => Promise<Message>): Promise<Message> => {
	if (originalMessage.guildID === "") {
		// guildID was empty, meaning the original message was sent as a DM
		return await sendDirectMessage(originalMessage.author.id, messageContent);
	} else {
		// guildID was not empty, meaning the original message was sent in a server
		return await sendMessage(originalMessage.channelID, messageContent);
	}
};

// initLog() returns nothing
// Handles ensuring the required directory structure is created
const initLog = (name: string): void => {
	// Initialize the file name
	startDate = new Date().toISOString().split("T")[0];
	logFolder = name;
	const startupMessage = `
---------------------------------------------------------------------------------------------------
---------------------------------------- LOGGING  STARTED -----------------------------------------
------------------------------------ ${new Date().toISOString()} -------------------------------------
---------------------------------------------------------------------------------------------------`;

	// Make all required folders if they are missing
	const folders = ["combined", "traces"];
	Object.values(LogTypes).forEach(level => {
		folders.push(level)
	});

	// Make each folder if its missing and insert the startup message
	folders.forEach(level => {
		Deno.mkdirSync(`./${logFolder}/${level}`, { recursive: true });
		Deno.writeTextFileSync(`./${logFolder}/${level}/${startDate}.log`, `${startupMessage}\n`, {append: true});
	});
	initialized = true;
};

// log(level, message) returns nothing
// Handles sending messages to console.log and sending a copy of the log to a file for review on crashes
const log = async (level: LogTypes, message: string, error = new Error()): Promise<void> => {
	const msgId = await nanoid(10);
	const formattedMsg = `${new Date().toISOString()} | ${msgId} | ${level.padEnd(5)} | ${message}`;
	const traceMsg = `${error.stack}`
	// Default functionality of logging to console
	if (level !== LogTypes.LOG || DEBUG) {
		console[level](formattedMsg);
	}

	// Logging to files for permanent info
	if (initialized) {
		await Deno.writeTextFile(`./${logFolder}/${level}/${startDate}.log`, `${formattedMsg}\n`, {append: true});
		await Deno.writeTextFile(`./${logFolder}/combined/${startDate}.log`, `${formattedMsg}\n`, {append: true});
		await Deno.writeTextFile(`./${logFolder}/traces/${startDate}.log`, `${formattedMsg}\n${traceMsg}\n\n`, {append: true});
	}
};

export default { cmdPrompt, sendIndirectMessage, initLog, log };
