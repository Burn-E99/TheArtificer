import config from '../../config.ts';
import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
} from '../../deps.ts';
import { infoColor1 } from '../commandUtils.ts';
import utils from '../utils.ts';

export const version = (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("version");`).catch((e) => utils.commonLoggers.dbError('version.ts:15', 'call sproc INC_CNT on', e));

	message.send({
		embeds: [{
			color: infoColor1,
			title: `My current version is ${config.version}`,
		}],
	}).catch((e: Error) => utils.commonLoggers.messageSendError('version.ts:24', message, e));
};
