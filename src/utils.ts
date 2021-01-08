/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

import { Message } from "https://deno.land/x/discordeno@10.0.0/mod.ts";

// split2k(longMessage) returns shortMessage[]
// split2k takes a long string in and cuts it into shorter strings to be sent in Discord
const split2k = (chunk: string): string[] => {
	// Replace any malformed newline characters
	chunk = chunk.replace(/\\n/g, "\n");
	const bites = [];

	// While there is more characters than allowed to be sent in discord
	while (chunk.length > 2000) {
		// Take 2001 chars to see if word magically ends on char 2000
		let bite = chunk.substr(0, 2001);
		const lastI = bite.lastIndexOf(" ");
		if (lastI < 2000) {
			// If there is a final word before the 2000 split point, split right after that word
			bite = bite.substr(0, lastI);
		} else {
			// Else cut exactly 2000 characters
			bite = bite.substr(0, 2000);
		}

		// Push and remove the bite taken out of the chunk
		bites.push(bite);
		chunk = chunk.slice(bite.length);
	}
	// Push leftovers into bites
	bites.push(chunk);

	return bites;
};

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

				// Utilize the split2k function to ensure a message over 2000 chars is not sent
				const messages = split2k(message);
				for (let i = 0; i < messages.length; i++) {
					sendMessage(channelID, messages[i]).catch(reason => {
						console.error(reason);
					});
				}
			}
			catch (e) {
				console.error(e);
			}
		}
		
		// ml [message]
		// Sends a message to the specified log channel
		else if (command === "ml") {
			const message = args.join(" ");

			// Utilize the split2k function to ensure a message over 2000 chars is not sent
			const messages = split2k(message);
			for (let i = 0; i < messages.length; i++) {
				sendMessage(logChannel, messages[i]).catch(reason => {
					console.error(reason);
				});
			}
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
const sendIndirectMessage = async (originalMessage: Message, messageContent: string, sendMessage: (c: string, m: string) => Promise<Message>, sendDirectMessage: (c: string, m: string) => Promise<Message>): Promise<Message> => {
	if (originalMessage.guildID === "") {
		// guildID was empty, meaning the original message was sent as a DM
		return await sendDirectMessage(originalMessage.author.id, messageContent);
	} else {
		// guildID was not empty, meaning the original message was sent in a server
		return await sendMessage(originalMessage.channelID, messageContent);
	}
};

export default { split2k, cmdPrompt, sendIndirectMessage };
