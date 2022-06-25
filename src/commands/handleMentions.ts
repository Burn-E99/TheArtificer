import config from '../../config.ts';
import { dbClient, queries } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
} from '../../deps.ts';
import { infoColor1 } from '../commandUtils.ts';
import utils from '../utils.ts';

export const handleMentions = (message: DiscordenoMessage) => {
	log(LT.LOG, `Handling @mention message: ${JSON.stringify(message)}`);

	// Light telemetry to see how many times a command is being run
	dbClient.execute(queries.callIncCnt('mention')).catch((e) => utils.commonLoggers.dbError('handleMentions.ts:17', 'call sproc INC_CNT on', e));

	message.send({
		embeds: [{
			color: infoColor1,
			title: `Hello!  I am ${config.name}!`,
			fields: [{
				name: 'I am a bot that specializes in rolling dice and doing basic algebra',
				value: `To learn about my available commands, please run \`${config.prefix}help\``,
			}],
		}],
	}).catch((e: Error) => utils.commonLoggers.messageSendError('handleMentions.ts:30', message, e));
};
