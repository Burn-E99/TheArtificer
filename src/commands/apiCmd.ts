import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	hasGuildPermissions,
	log,
	// Log4Deno deps
	LT,
} from '../../deps.ts';
import apiCommands from './apiCmd/_index.ts';
import { constantCmds } from '../constantCmds.ts';

export const api = async (message: DiscordenoMessage, args: string[]) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("api");`).catch((e) => {
		log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	// Local apiArg in lowercase
	const apiArg = (args[0] || 'help').toLowerCase();

	// Alert users who DM the bot that this command is for guilds only
	if (message.guildId === 0n) {
		message.send(constantCmds.apiGuildOnly).catch((e) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
		return;
	}

	// Makes sure the user is authenticated to run the API command
	if (await hasGuildPermissions(message.authorId, message.guildId, ['ADMINISTRATOR'])) {
		// [[api help
		// Shows API help details
		if (apiArg === 'help' || apiArg === 'h') {
			apiCommands.help(message);
		} // [[api allow/block
		// Lets a guild admin allow or ban API rolls from happening in said guild
		else if (apiArg === 'allow' || apiArg === 'block' || apiArg === 'enable' || apiArg === 'disable') {
			apiCommands.allowBlock(message, apiArg);
		} // [[api delete
		// Lets a guild admin delete their server from the database
		else if (apiArg === 'delete') {
			apiCommands.deleteGuild(message);
		} // [[api status
		// Lets a guild admin check the status of API rolling in said guild
		else if (apiArg === 'status') {
			apiCommands.status(message);
		} // [[api show-warn/hide-warn
		// Lets a guild admin decide if the API warning should be shown on messages from the API
		else if (apiArg === 'show-warn' || apiArg === 'hide-warn') {
			apiCommands.showHideWarn(message, apiArg);
		}
	} else {
		message.send(constantCmds.apiPermError).catch((e) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
	}
};
