import config from '../../config.ts';
import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	log,
	// Log4Deno deps
	LT,
	sendMessage,
} from '../../deps.ts';
import { failColor, generateReport, successColor } from '../commandUtils.ts';

export const report = (message: DiscordenoMessage, args: string[]) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("report");`).catch((e) => {
		log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	if (args.join(' ')) {
		sendMessage(config.reportChannel, generateReport(args.join(' '))).catch((e) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
		message.send({
			embeds: [{
				color: successColor,
				title: 'Failed command has been reported to my developer.',
				description: `For more in depth support, and information about planned maintenance, please join the support server [here](https://discord.gg/peHASXMZYv).`,
			}],
		}).catch((e) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
	} else {
		message.send({
			embeds: [{
				color: failColor,
				title: 'Please provide a short description of what failed',
				description: 'Providing a short description helps my developer quickly diagnose what went wrong.',
			}],
		}).catch((e) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
	}
};
