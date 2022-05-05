import { dbClient } from "../db.ts";
import { DiscordenoMessage } from "../../deps.ts";
import utils from "../utils.ts";
import { constantCmds } from "../constantCmds.ts";
import { LogTypes as LT } from "../utils.enums.ts";

export const rollHelp = (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("rollhelp");`).catch(e => {
		utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	message.send(constantCmds.rollHelp).catch(e => {
		utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
