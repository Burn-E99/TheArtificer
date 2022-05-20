import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	log,
	// Log4Deno deps
	LT,
} from '../../deps.ts';
import { constantCmds } from '../constantCmds.ts';

export const rollHelp = (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("rollhelp");`).catch((e) => {
		log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	message.send(constantCmds.rollHelp).catch((e) => {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
