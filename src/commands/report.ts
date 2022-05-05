import config from "../../config.ts";
import { dbClient } from "../db.ts";
import { DiscordenoMessage, sendMessage } from "../../deps.ts";
import utils from "../utils.ts";
import { constantCmds, generateReport } from "../constantCmds.ts";
import { LogTypes as LT } from "../utils.enums.ts";

export const report = (message: DiscordenoMessage, args: string[]) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("report");`).catch(e => {
		utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	if (args.join(" ")) {
		sendMessage(config.reportChannel, generateReport(args.join(" "))).catch(e => {
			utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
		message.send(constantCmds.report).catch(e => {
			utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
	} else {
		message.send(constantCmds.reportFail).catch(e => {
			utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
	}
};
