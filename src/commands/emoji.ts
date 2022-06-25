import config from '../../config.ts';
import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
} from '../../deps.ts';
import { EmojiConf } from '../mod.d.ts';
import utils from '../utils.ts';

const allEmojiAliases: string[] = [];

config.emojis.forEach((emji: EmojiConf) => {
	allEmojiAliases.push(...emji.aliases);
});

export const emoji = (message: DiscordenoMessage, command: string) => {
	// shortcut
	if (allEmojiAliases.indexOf(command)) {
		// Start looping thru the possible emojis
		config.emojis.some((emji: EmojiConf) => {
			log(LT.LOG, `Checking if command was emoji ${JSON.stringify(emji)}`);
			// If a match gets found
			if (emji.aliases.indexOf(command || '') > -1) {
				// Light telemetry to see how many times a command is being run
				dbClient.execute(`CALL INC_CNT("emojis");`).catch((e) => utils.commonLoggers.dbError('emojis.ts:28', 'call sproc INC_CNT on', e));

				// Send the needed emoji
				message.send(`<${emji.animated ? 'a' : ''}:${emji.name}:${emji.id}>`).catch((e: Error) => utils.commonLoggers.messageSendError('emoji.ts:33', message, e));
				// And attempt to delete if needed
				if (emji.deleteSender) {
					message.delete().catch((e: Error) => utils.commonLoggers.messageDeleteError('emoji.ts:36', message, e));
				}
				return true;
			}
		});
	}
};
