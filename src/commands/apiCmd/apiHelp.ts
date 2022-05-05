import { DiscordenoMessage } from "../../../deps.ts";
import utils from "../../utils.ts";
import { constantCmds } from "../../constantCmds.ts";
import { LogTypes as LT } from "../../utils.enums.ts";

export const help = (message: DiscordenoMessage) => {
	message.send(constantCmds.apiHelp).catch(e => {
		utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
