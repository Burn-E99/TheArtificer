import { dbClient, queries } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
} from '../../deps.ts';
import { } from '../commandUtils.ts';
import { compilingStats } from '../commonEmbeds.ts';
import utils from '../utils.ts';

export const heatmap = async (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(queries.callIncCnt('heatmap')).catch((e) => utils.commonLoggers.dbError('heatmap.ts:14', 'call sproc INC_CNT on', e));

	try {
		const m = await message.send(compilingStats);

		// Calculate how many times commands have been run
		const hmQuery = await dbClient.query(`SELECT * FROM roll_time_heatmap`).catch((e) => utils.commonLoggers.dbError('heatmap.ts:20', 'query', e));
		console.log(hmQuery);

		m.edit('').catch((e: Error) =>
			utils.commonLoggers.messageEditError('heatmap.ts:21', m, e)
		);
	} catch (e) {
		utils.commonLoggers.messageSendError('heatmap.ts:24', message, e);
	}
};
