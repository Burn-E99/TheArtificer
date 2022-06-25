import config from '../../config.ts';
import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	// Discordeno deps
	sendMessage,
} from '../../deps.ts';
import { failColor, generateReport, successColor } from '../commandUtils.ts';
import utils from '../utils.ts';

export const report = (message: DiscordenoMessage, args: string[]) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("report");`).catch((e) => utils.commonLoggers.dbError('report.ts:17', 'call sproc INC_CNT on', e));

	if (args.join(' ')) {
		sendMessage(config.reportChannel, generateReport(args.join(' '))).catch((e: Error) => utils.commonLoggers.messageSendError('report.ts:22', message, e));
		message.send({
			embeds: [{
				color: successColor,
				title: 'Failed command has been reported to my developer.',
				description: `For more in depth support, and information about planned maintenance, please join the support server [here](https://discord.gg/peHASXMZYv).`,
			}],
		}).catch((e: Error) => utils.commonLoggers.messageSendError('report.ts:29', message, e));
	} else {
		message.send({
			embeds: [{
				color: failColor,
				title: 'Please provide a short description of what failed',
				description: 'Providing a short description helps my developer quickly diagnose what went wrong.',
			}],
		}).catch((e: Error) => utils.commonLoggers.messageSendError('report.ts:37', message, e));
	}
};
