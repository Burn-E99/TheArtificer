import { dbClient } from "../db.ts";
import {
	// Discordeno deps
	DiscordenoMessage,

	// Log4Deno deps
	LT, log
} from "../../deps.ts";
import { generatePing } from "../constantCmds.ts";

export const ping = async (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("ping");`).catch(e => {
		log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
	try {
		const m = await message.send(generatePing(-1));
		m.edit(generatePing(m.timestamp - message.timestamp));
	} catch (e) {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	}
};
