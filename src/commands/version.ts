import config from '../../config.ts';
import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
} from '../../deps.ts';
import { infoColor1 } from '../commandUtils.ts';

export const version = (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("version");`).catch((e) => {
		log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	message.send({
		embeds: [{
			color: infoColor1,
			title: `My current version is ${config.version}`,
		}],
	}).catch((e) => {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
