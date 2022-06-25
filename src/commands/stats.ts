import { dbClient, queries } from '../db.ts';
import {
	// Discordeno deps
	cache,
	cacheHandlers,
	DiscordenoMessage,
} from '../../deps.ts';
import { generateStats } from '../commandUtils.ts';
import { compilingStats } from '../commonEmbeds.ts';
import utils from '../utils.ts';

export const stats = async (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(queries.callIncCnt('stats')).catch((e) => utils.commonLoggers.dbError('stats.ts', 'call sproc INC_CNT on', e));

	try {
		const m = await message.send(compilingStats);

		// Calculate how many times commands have been run
		const rollQuery = await dbClient.query(`SELECT count FROM command_cnt WHERE command = "roll";`).catch((e) => utils.commonLoggers.dbError('stats.ts:23', 'query', e));
		const totalQuery = await dbClient.query(`SELECT SUM(count) as count FROM command_cnt;`).catch((e) => utils.commonLoggers.dbError('stats.ts:24', 'query', e));
		const rolls = BigInt(rollQuery[0].count);
		const total = BigInt(totalQuery[0].count);

		const cachedGuilds = await cacheHandlers.size('guilds');
		const cachedChannels = await cacheHandlers.size('channels');
		const cachedMembers = await cacheHandlers.size('members');
		m.edit(generateStats(cachedGuilds + cache.dispatchedGuildIds.size, cachedChannels + cache.dispatchedChannelIds.size, cachedMembers, rolls, total - rolls)).catch((e: Error) =>
			utils.commonLoggers.messageSendError('stats.ts:38', message, e)
		);
	} catch (e) {
		utils.commonLoggers.messageSendError('stats.ts:41', message, e);
	}
};
