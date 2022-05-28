import config from '../../../config.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
} from '../../../deps.ts';
import { infoColor1 } from '../../commandUtils.ts';

export const auditHelp = (message: DiscordenoMessage) => {
	message.send({
		embeds: [{
			color: infoColor1,
			title: 'Audit Help',
			fields: [
				{
					name: `\`${config.prefix}audit help\``,
					value: 'This command',
					inline: true,
				},
				{
					name: `\`${config.prefix}audit db\``,
					value: 'Shows current DB table sizes',
					inline: true,
				},
				{
					name: `\`${config.prefix}audit guilds\``,
					value: 'Shows breakdown of guilds and detials on them',
					inline: true,
				},
			],
		}],
	}).catch((e) => {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
