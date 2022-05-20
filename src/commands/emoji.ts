import config from '../../config.ts';
import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	log,
	// Log4Deno deps
	LT,
} from '../../deps.ts';
import { EmojiConf } from '../mod.d.ts';

const allEmojiAliases: string[] = [];

config.emojis.forEach((emoji: EmojiConf) => {
	allEmojiAliases.push(...emoji.aliases);
});

export const emoji = (message: DiscordenoMessage, command: string) => {
	// shortcut
	if (allEmojiAliases.indexOf(command)) {
		// Start looping thru the possible emojis
		config.emojis.some((emoji: EmojiConf) => {
			log(LT.LOG, `Checking if command was emoji ${JSON.stringify(emoji)}`);
			// If a match gets found
			if (emoji.aliases.indexOf(command || '') > -1) {
				// Light telemetry to see how many times a command is being run
				dbClient.execute(`CALL INC_CNT("emojis");`).catch((e) => {
					log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
				});

				// Send the needed emoji1
				message.send(`<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`).catch((e) => {
					log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
				// And attempt to delete if needed
				if (emoji.deleteSender) {
					message.delete().catch((e) => {
						log(LT.WARN, `Failed to delete message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
					});
				}
				return true;
			}
		});
	}
};
