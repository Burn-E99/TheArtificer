import {
	// Discordeno deps
	DiscordenoMessage,

	// Log4Deno deps
	LT, log
} from "../../../deps.ts";
import { constantCmds } from "../../constantCmds.ts";

export const help = (message: DiscordenoMessage) => {
	message.send(constantCmds.apiHelp).catch(e => {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
