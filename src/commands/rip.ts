import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
} from '../../deps.ts';
import { infoColor2 } from '../commandUtils.ts';
import utils from '../utils.ts';

export const rip = (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("rip");`).catch((e) => utils.commonLoggers.dbError('rip.ts:14', 'call sproc INC_CNT on', e));

	message.send({
		embeds: [{
			color: infoColor2,
			title: 'The Artificer was built in memory of my Grandmother, Babka',
			description: `With much love, Ean
			
			December 21, 2020`,
		}],
	}).catch((e: Error) => utils.commonLoggers.messageSendError('rip.ts:26', message, e));
};
