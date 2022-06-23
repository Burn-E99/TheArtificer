import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
} from '../../../deps.ts';
import { infoColor2 } from '../../commandUtils.ts';
import utils from '../../utils.ts';

export const auditGuilds = (message: DiscordenoMessage) => {
	message.send({
		embeds: [{
			color: infoColor2,
			title: 'Guilds Audit',
			description: 'WIP',
			timestamp: new Date().toISOString(),
		}],
	}).catch((e: Error) => utils.commonLoggers.messageSendError('auditGuild.ts:19', message, e));
};
