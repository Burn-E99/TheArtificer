import { dbClient } from "../../db.ts";
import {
	// Discordeno deps
	DiscordenoMessage,

	// Log4Deno deps
	LT, log
} from "../../../deps.ts";
import { constantCmds, generateApiStatus } from "../../constantCmds.ts";

export const status = async (message: DiscordenoMessage) => {
	// Get status of guild from the db
	const guildQuery = await dbClient.query(`SELECT active, banned FROM allowed_guilds WHERE guildid = ? AND channelid = ?`, [message.guildId, message.channelId]).catch(e0 => {
		log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e0)}`);
		message.send(constantCmds.apiStatusFail).catch(e1 => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
		});
		return;
	});

	// Check if we got an item back or not
	if (guildQuery.length > 0) {
		// Check if guild is banned from using API and return appropriate message
		if (guildQuery[0].banned) {
			message.send(generateApiStatus(true, false)).catch(e => {
				log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
			});
		} else {
			message.send(generateApiStatus(false, guildQuery[0].active)).catch(e => {
				log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
			});
		}
	} else {
		// Guild is not in DB, therefore they are blocked
		message.send(generateApiStatus(false, false)).catch(e => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
	}
};
