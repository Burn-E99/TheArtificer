import config from "../../config.ts";
import { dbClient } from "../db.ts";
import { DiscordenoMessage } from "../../deps.ts";
import utils from "../utils.ts";
import { LogTypes as LT } from "../utils.enums.ts";
import { EmojiConf } from "../mod.d.ts";

export const emoji = (message: DiscordenoMessage, command: string) => {
	// Start looping thru the possible emojis
	config.emojis.some((emoji: EmojiConf) => {
		utils.log(LT.LOG, `Checking if command was emoji ${JSON.stringify(emoji)}`);
		// If a match gets found
		if (emoji.aliases.indexOf(command || "") > -1) {
			// Light telemetry to see how many times a command is being run
			dbClient.execute(`CALL INC_CNT("emojis");`).catch(e => {
				utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
			});

			// Send the needed emoji1
			message.send(`<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`).catch(e => {
				utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
			});
			// And attempt to delete if needed
			if (emoji.deleteSender) {
				message.delete().catch(e => {
					utils.log(LT.WARN, `Failed to delete message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
			}
			return true;
		}
	});
};
