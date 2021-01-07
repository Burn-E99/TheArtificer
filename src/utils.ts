import { Message } from "https://deno.land/x/discordeno@10.0.0/mod.ts";

const split2k = (chunk: string): string[] => {
	chunk = chunk.replace(/\\n/g, "\n");
	const bites = [];
	while (chunk.length > 2000) {
		// take 2001 chars to see if word magically ends on char 2000
		let bite = chunk.substr(0, 2001);
		const etib = bite.split("").reverse().join("");
		const lastI = etib.indexOf(" "); // might be able to do lastIndexOf now
		if (lastI > 0) {
			bite = bite.substr(0, 2000 - lastI);
		} else {
			bite = bite.substr(0, 2000);
		}
		bites.push(bite);
		chunk = chunk.slice(bite.length);
	}
	// Push leftovers into bites
	bites.push(chunk);

	return bites;
};

const ask = async (question: string, stdin = Deno.stdin, stdout = Deno.stdout) => {
	const buf = new Uint8Array(1024);

	// Write question to console
	await stdout.write(new TextEncoder().encode(question));

	// Read console's input into answer
	const n = <number>await stdin.read(buf);
	const answer = new TextDecoder().decode(buf.subarray(0, n));

	return answer.trim();
};

const cmdPrompt = async (logChannel: string, botName: string, sendMessage: (c: string, m: string) => Promise<Message>): Promise<void> => {
	let done = false;

	while (!done) {
		const fullCmd = await ask("cmd> ");

		const args = fullCmd.split(" ");
		const command = args.shift()?.toLowerCase();
		if (command === "exit" || command === "e") {
			console.log(`${botName} Shutting down.\n\nGoodbye.`);
			done = true;
			Deno.exit(0);
		} else if (command === "stop") {
			console.log(`Closing ${botName} CLI.  Bot will continue to run.\n\nGoodbye.`);
			done = true;
		} else if (command === "m") {
			try {
				const channelID = args.shift() || "";
				const message = args.join(" ");
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
		} else if (command === "ml") {
			const message = args.join(" ");
			const messages = split2k(message);
			for (let i = 0; i < messages.length; i++) {
				sendMessage(logChannel, messages[i]).catch(reason => {
					console.error(reason);
				});
			}
		} else if (command === "help" || command === "h") {
			console.log(`${botName} CLI Help:\n\nAvailable Commands:\n  exit - closes bot\n  stop - closes the CLI\n  m [ChannelID] [messgae] - sends message to specific ChannelID as the bot\n  ml [message] sends a message to the specified botlog\n  help - this message`);
		} else {
			console.log("undefined command");
		}
	}
};

const sendIndirectMessage = async (message: Message, messageContent: string, sendMessage: (c: string, m: string) => Promise<Message>, sendDirectMessage: (c: string, m: string) => Promise<Message>): Promise<Message> => {
	if (message.guildID === "") {
		return await sendDirectMessage(message.author.id, messageContent);
	} else {
		return await sendMessage(message.channelID, messageContent);
	}
};

export default { split2k, cmdPrompt, sendIndirectMessage };
