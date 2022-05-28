import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
} from '../../../deps.ts';
import { infoColor2 } from '../../commandUtils.ts';

export const auditGuilds = (message: DiscordenoMessage) => {
	message.send({
		embeds: [{
			color: infoColor2,
			title: 'Guilds Audit',
			description: 'WIP',
			timestamp: new Date().toISOString(),
		}],
	}).catch((e) => {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
