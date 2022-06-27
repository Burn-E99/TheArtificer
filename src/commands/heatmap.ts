import { dbClient, queries } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
} from '../../deps.ts';
import config from '../../config.ts';
import { LOCALMODE } from '../../flags.ts';
import { failColor, infoColor2 } from '../commandUtils.ts';
import utils from '../utils.ts';

export const heatmap = async (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(queries.callIncCnt('heatmap')).catch((e) => utils.commonLoggers.dbError('heatmap.ts:14', 'call sproc INC_CNT on', e));

	if (config.api.enable) {
		const m = await message.send({
			embeds: [{
				title: 'Roll Heatmap',
				color: infoColor2,
				image: {
					url: `${config.api.publicDomain}api/heatmap.png`,
				},
			}],
		}).catch((e) => utils.commonLoggers.messageSendError('heatmap.ts:21', message, e));

		console.log(m);
	} else {
		message.send({
			embeds: [{
				title: 'Roll Heatmap Disabled',
				description: 'This command requires the bot\'s API to be enabled.  If you are the host of this bot, check your `config.ts` file to enable it.',
				color: failColor,
			}],
		}).catch((e) => utils.commonLoggers.messageSendError('heatmap.ts:21', message, e));
	}
};
