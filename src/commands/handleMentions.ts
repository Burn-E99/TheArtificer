import config from '../../config.ts';
import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	log,
	// Log4Deno deps
	LT,
} from '../../deps.ts';
import { infoColor1 } from '../commandUtils.ts';

export const handleMentions = (message: DiscordenoMessage) => {
	log(LT.LOG, `Handling @mention message: ${JSON.stringify(message)}`);

	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("mention");`).catch((e) => {
		log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	message.send({
		embeds: [{
			color: infoColor1,
			title: `Hello!  I am ${config.name}!`,
			fields: [{
				name: 'I am a bot that specializes in rolling dice and doing basic algebra',
				value: `To learn about my available commands, please run \`${config.prefix}help\``,
			}],
		}],
	}).catch((e) => {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
