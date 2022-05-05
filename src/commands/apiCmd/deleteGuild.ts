import { dbClient } from "../../db.ts";
import { DiscordenoMessage } from "../../../deps.ts";
import utils from "../../utils.ts";
import { constantCmds } from "../../constantCmds.ts";
import { LogTypes as LT } from "../../utils.enums.ts";

export const deleteGuild = async (message: DiscordenoMessage) => {
	await dbClient.execute(`DELETE FROM allowed_guilds WHERE guildid = ?`, [message.guildId]).catch(e0 => {
		utils.log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e0)}`);
		message.send(constantCmds.apiDeleteFail).catch(e1 => {
			utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
		});
		return;
	});

	// We won't get here if there's any errors, so we know it has bee successful, so report as such
	message.send(constantCmds.apiRemoveGuild).catch(e => {
		utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
