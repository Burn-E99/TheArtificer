import { dbClient } from '../../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	log,
	// Log4Deno deps
	LT,
} from '../../../deps.ts';
import { failColor, successColor } from '../../commandUtils.ts';

export const deleteGuild = async (message: DiscordenoMessage) => {
	let errorOut = false;
	await dbClient.execute(`DELETE FROM allowed_guilds WHERE guildid = ? AND channelid = ?`, [message.guildId, message.channelId]).catch((e0) => {
		log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e0)}`);
		message.send({
			embeds: [{
				color: failColor,
				title: 'Failed to delete this guild from the database.',
				description: 'If this issue persists, please report this to the developers.',
			}],
		}).catch((e1) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
		});
		errorOut = true;
	});
	if (errorOut) return;

	// We won't get here if there's any errors, so we know it has bee successful, so report as such
	message.send({
		embeds: [{
			color: successColor,
			title: 'This guild\'s API setting has been removed from The Artifier\'s Database.',
		}],
	}).catch((e) => {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
