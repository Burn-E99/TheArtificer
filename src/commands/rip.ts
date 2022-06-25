import { dbClient, queries } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
} from '../../deps.ts';
import { infoColor2 } from '../commandUtils.ts';
import utils from '../utils.ts';

export const rip = (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(queries.callIncCnt('rip')).catch((e) => utils.commonLoggers.dbError('rip.ts:14', 'call sproc INC_CNT on', e));

	message.send({
		embeds: [{
			color: infoColor2,
			title: 'The Artificer was built in memory of my Grandmother, Babka',
			description: `With much love, Ean
			
			December 21, 2020`,
		}],
	}).catch((e: Error) => utils.commonLoggers.messageSendError('rip.ts:26', message, e));
};
