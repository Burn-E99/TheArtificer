/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
	// Discordeno deps
	sendMessage,
} from '../deps.ts';

// ask(prompt) returns string
// ask prompts the user at command line for message
const ask = async (question: string, stdin = Deno.stdin, stdout = Deno.stdout): Promise<string> => {
	const buf = new Uint8Array(1024);

	// Write question to console
	await stdout.write(new TextEncoder().encode(question));

	// Read console's input into answer
	const n = <number> await stdin.read(buf);
	const answer = new TextDecoder().decode(buf.subarray(0, n));

	return answer.trim();
};

// cmdPrompt(logChannel, botName) returns nothing
// cmdPrompt creates an interactive CLI for the bot, commands can vary
const cmdPrompt = async (logChannel: bigint, botName: string): Promise<void> => {
	let done = false;

	while (!done) {
		// Get a command and its args
		const fullCmd = await ask('cmd> ');

		// Split the args off of the command and prep the command
		const args = fullCmd.split(' ');
		const command = args.shift()?.toLowerCase();

		// All commands below here

		// exit or e
		// Fully closes the bot
		if (command === 'exit' || command === 'e') {
			console.log(`${botName} Shutting down.\n\nGoodbye.`);
			done = true;
			Deno.exit(0);
		} // stop
		// Closes the CLI only, leaving the bot running truly headless
		else if (command === 'stop') {
			console.log(`Closing ${botName} CLI.  Bot will continue to run.\n\nGoodbye.`);
			done = true;
		} // m [channel] [message]
		// Sends [message] to specified [channel]
		else if (command === 'm') {
			try {
				const channelId = args.shift() || '';
				const message = args.join(' ');

				sendMessage(BigInt(channelId), message).catch((reason) => {
					console.error(reason);
				});
			} catch (e) {
				console.error(e);
			}
		} // ml [message]
		// Sends a message to the specified log channel
		else if (command === 'ml') {
			const message = args.join(' ');

			sendMessage(logChannel, message).catch((reason) => {
				console.error(reason);
			});
		} // help or h
		// Shows a basic help menu
		else if (command === 'help' || command === 'h') {
			console.log(`${botName} CLI Help:

Available Commands:
  exit - closes bot
  stop - closes the CLI
  m [ChannelID] [messgae] - sends message to specific ChannelID as the bot
  ml [message] sends a message to the specified botlog
  help - this message`);
		} // Unhandled commands die here
		else {
			console.log('undefined command');
		}
	}
};

const genericLogger = (level: LT, message: string) => log(level, message);
const messageEditError = (location: string, message: DiscordenoMessage | string, err: Error) =>
	genericLogger(LT.ERROR, `${location} | Failed to edit message: ${JSON.stringify(message)} | Error: ${err.name} - ${err.message}`);
const messageSendError = (location: string, message: DiscordenoMessage | string, err: Error) =>
	genericLogger(LT.ERROR, `${location} | Failed to send message: ${JSON.stringify(message)} | Error: ${err.name} - ${err.message}`);
const messageDeleteError = (location: string, message: DiscordenoMessage | string, err: Error) =>
	genericLogger(LT.ERROR, `${location} | Failed to delete message: ${JSON.stringify(message)} | Error: ${err.name} - ${err.message}`);
const dbError = (location: string, type: string, err: Error) => genericLogger(LT.ERROR, `${location} | Failed to ${type} database | Error: ${err.name} - ${err.message}`);

export default {
	commonLoggers: {
		dbError,
		messageEditError,
		messageSendError,
		messageDeleteError,
	},
	cmdPrompt,
};
