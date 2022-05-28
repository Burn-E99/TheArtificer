import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	cache,
	cacheHandlers,
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
} from '../../deps.ts';
import { generateStats, warnColor } from '../commandUtils.ts';

export const stats = async (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("stats");`).catch((e) => {
		log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	try {
		const m = await message.send({
			embeds: [{
				color: warnColor,
				title: 'Compiling latest statistics . . .',
			}],
		});

		// Calculate how many times commands have been run
		const rollQuery = await dbClient.query(`SELECT count FROM command_cnt WHERE command = "roll";`).catch((e) => {
			log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e)}`);
		});
		const totalQuery = await dbClient.query(`SELECT SUM(count) as count FROM command_cnt;`).catch((e) => {
			log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e)}`);
		});
		const rolls = BigInt(rollQuery[0].count);
		const total = BigInt(totalQuery[0].count);

		const cachedGuilds = await cacheHandlers.size('guilds');
		const cachedChannels = await cacheHandlers.size('channels');
		const cachedMembers = await cacheHandlers.size('members');
		m.edit(generateStats(cachedGuilds + cache.dispatchedGuildIds.size, cachedChannels + cache.dispatchedChannelIds.size, cachedMembers, rolls, total - rolls)).catch((e) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
	} catch (e) {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	}
};
