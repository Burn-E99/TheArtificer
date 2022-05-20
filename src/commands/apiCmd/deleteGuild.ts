import { dbClient } from '../../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	log,
	// Log4Deno deps
	LT,
} from '../../../deps.ts';
import { constantCmds } from '../../constantCmds.ts';

export const deleteGuild = async (message: DiscordenoMessage) => {
	await dbClient.execute(`DELETE FROM allowed_guilds WHERE guildid = ? AND channelid = ?`, [message.guildId, message.channelId]).catch((e0) => {
		log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e0)}`);
		message.send(constantCmds.apiDeleteFail).catch((e1) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
		});
		return;
	});

	// We won't get here if there's any errors, so we know it has bee successful, so report as such
	message.send(constantCmds.apiRemoveGuild).catch((e) => {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
