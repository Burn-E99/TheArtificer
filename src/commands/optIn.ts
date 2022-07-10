import config from '../../config.ts';
import { dbClient, ignoreList, queries } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
} from '../../deps.ts';
import { failColor, successColor } from '../commandUtils.ts';
import utils from '../utils.ts';

export const optIn = async (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(queries.callIncCnt('opt-out')).catch((e) => utils.commonLoggers.dbError('optIn.ts:11', 'call sproc INC_CNT on', e));

	const idIdx = ignoreList.indexOf(message.authorId);
	if (idIdx !== -1) {
		try {
			ignoreList.splice(idIdx, 1);
			await dbClient.execute('DELETE FROM ignore_list WHERE userid = ?', [message.authorId]);

			message.reply({
				embeds: [{
					color: successColor,
					title: `${config.name} will now respond to you again.`,
					description: `If you want ${config.name} to ignore to you again, please run the following command:
					
					\`${config.prefix}opt-out\``,
				}],
			}).catch((e: Error) => utils.commonLoggers.messageSendError('optIn.ts:27', message, e));
		} catch (err) {
			message.reply({
				embeds: [{
					color: failColor,
					title: 'Opt-In failed',
					description: 'Please try the command again.  If the issue persists, please join the support server, linked in my About Me section.',
				}],
			}).catch((e: Error) => utils.commonLoggers.messageSendError('optIn.ts:27', message, e));
		}
	}
};
