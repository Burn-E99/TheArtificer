import { dbClient } from '../../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	log,
	// Log4Deno deps
	LT,
} from '../../../deps.ts';
import { generateApiFailed, generateApiSuccess } from '../../constantCmds.ts';

export const allowBlock = async (message: DiscordenoMessage, apiArg: string) => {
	let errorOutInitial = false;
	const guildQuery = await dbClient.query(`SELECT guildid, channelid FROM allowed_guilds WHERE guildid = ? AND channelid = ?`, [message.guildId, message.channelId]).catch((e0) => {
		log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e0)}`);
		message.send(generateApiFailed(apiArg)).catch((e1) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
		});
		errorOutInitial = true;
	});
	if (errorOutInitial) return;

	let errorOut = false;
	if (guildQuery.length === 0) {
		// Since guild is not in our DB, add it in
		await dbClient.execute(`INSERT INTO allowed_guilds(guildid,channelid,active) values(?,?,?)`, [message.guildId, message.channelId, (apiArg === 'allow' || apiArg === 'enable') ? 1 : 0]).catch(
			(e0) => {
				log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e0)}`);
				message.send(generateApiFailed(apiArg)).catch((e1) => {
					log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
				});
				errorOut = true;
			},
		);
	} else {
		// Since guild is in our DB, update it
		await dbClient.execute(`UPDATE allowed_guilds SET active = ? WHERE guildid = ? AND channelid = ?`, [(apiArg === 'allow' || apiArg === 'enable') ? 1 : 0, message.guildId, message.channelId]).catch(
			(e0) => {
				log(LT.ERROR, `Failed to update DB: ${JSON.stringify(e0)}`);
				message.send(generateApiFailed(apiArg)).catch((e1) => {
					log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
				});
				errorOut = true;
			},
		);
	}
	if (errorOut) return;

	// We won't get here if there's any errors, so we know it has bee successful, so report as such
	message.send(generateApiSuccess(`${apiArg}ed`)).catch((e) => {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
