import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	hasGuildPermissions,
	// Log4Deno deps
	log,
	LT,
} from '../../deps.ts';
import apiCommands from './apiCmd/_index.ts';
import { failColor } from '../commandUtils.ts';
import utils from '../utils.ts';

export const api = async (message: DiscordenoMessage, args: string[]) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("api");`).catch((e) => utils.commonLoggers.dbError('apiCmd.ts:16', 'call sproc INC_CNT on', e));

	// Local apiArg in lowercase
	const apiArg = (args[0] || 'help').toLowerCase();

	// Alert users who DM the bot that this command is for guilds only
	if (message.guildId === 0n) {
		message.send({
			embeds: [{
				color: failColor,
				title: 'API commands are only available in guilds.',
			}],
		}).catch((e: Error) => utils.commonLoggers.messageSendError('apiCmd.ts:30', message, e));
		return;
	}

	// Makes sure the user is authenticated to run the API command
	if (await hasGuildPermissions(message.authorId, message.guildId, ['ADMINISTRATOR'])) {
		switch (apiArg) {
			case 'help':
			case 'h':
				// [[api help
				// Shows API help details
				apiCommands.help(message);
				break;
			case 'allow':
			case 'block':
			case 'enable':
			case 'disable':
				// [[api allow/block
				// Lets a guild admin allow or ban API rolls from happening in said guild
				apiCommands.allowBlock(message, apiArg);
				break;
			case 'delete':
				// [[api delete
				// Lets a guild admin delete their server from the database
				apiCommands.deleteGuild(message);
				break;
			case 'status':
				// [[api status
				// Lets a guild admin check the status of API rolling in said guild
				apiCommands.status(message);
				break;
			case 'show-warn':
			case 'hide-warn':
				// [[api show-warn/hide-warn
				// Lets a guild admin decide if the API warning should be shown on messages from the API
				apiCommands.showHideWarn(message, apiArg);
				break;
			default:
				break;
		}
	} else {
		message.send({
			embeds: [{
				color: failColor,
				title: 'API commands are powerful and can only be used by guild Owners and Admins.',
				description: 'For information on how to use the API, please check the GitHub README for more information [here](https://github.com/Burn-E99/TheArtificer).',
			}],
		}).catch((e: Error) => utils.commonLoggers.messageSendError('apiCmd.ts:77', message, e));
	}
};
