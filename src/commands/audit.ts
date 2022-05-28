import config from '../../config.ts';
import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
} from '../../deps.ts';
import auditCommands from './auditCmd/_index.ts';
import { failColor } from '../commandUtils.ts';

export const audit = async (message: DiscordenoMessage, args: string[]) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("audit");`).catch((e) => {
		log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	// Local apiArg in lowercase
	const auditArg = (args[0] || 'help').toLowerCase();

	// Makes sure the user is authenticated to run the API command
	if (message.authorId === config.api.admin) {
		switch (auditArg) {
			case 'help':
			case 'h':
				// [[audit help or [[audit h
				// Shows API help details
				auditCommands.auditHelp(message);
				break;
			case 'db':
				// [[audit db
				// Shows current DB table sizes
				auditCommands.auditDB(message);
				break;
			case 'guilds':
				// [[audit guilds
				// Shows breakdown of guilds and detials on them
				auditCommands.auditGuilds(message);
				break;
			default:
				break;
		}
	} else {
		message.send({
			embeds: [{
				color: failColor,
				title: `Audit commands are powerful and can only be used by ${config.name}'s owner.`,
			}],
		}).catch((e) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
	}
};
