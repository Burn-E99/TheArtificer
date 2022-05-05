import { dbClient } from "../../db.ts";
import { DiscordenoMessage } from "../../../deps.ts";
import utils from "../../utils.ts";
import { generateApiFailed, generateApiSuccess } from "../../constantCmds.ts";
import { LogTypes as LT } from "../../utils.enums.ts";

export const allowBlock = async (message: DiscordenoMessage, apiArg: string) => {
	const guildQuery = await dbClient.query(`SELECT guildid FROM allowed_guilds WHERE guildid = ?`, [message.guildId]).catch(e0 => {
		utils.log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e0)}`);
		message.send(generateApiFailed(apiArg)).catch(e1 => {
			utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
		});
		return;
	});

	if (guildQuery.length === 0) {
		// Since guild is not in our DB, add it in
		await dbClient.execute(`INSERT INTO allowed_guilds(guildid,active) values(?,?)`, [BigInt(message.guildId), ((apiArg === "allow" || apiArg === "enable") ? 1 : 0)]).catch(e0 => {
			utils.log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e0)}`);
			message.send(generateApiFailed(apiArg)).catch(e1 => {
				utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
			});
			return;
		});
	} else {
		// Since guild is in our DB, update it
		await dbClient.execute(`UPDATE allowed_guilds SET active = ? WHERE guildid = ?`, [((apiArg === "allow" || apiArg === "enable") ? 1 : 0), BigInt(message.guildId)]).catch(e0 => {
			utils.log(LT.ERROR, `Failed to update DB: ${JSON.stringify(e0)}`);
			message.send(generateApiFailed(apiArg)).catch(e1 => {
				utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
			});
			return;
		});
	}
	// We won't get here if there's any errors, so we know it has bee successful, so report as such
	message.send(generateApiSuccess(apiArg)).catch(e => {
		utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
