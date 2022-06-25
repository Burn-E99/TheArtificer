/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

import {
	// Discordeno deps
	cache,
	cacheHandlers,
	// Log4Deno deps
	log,
	LT,
} from '../deps.ts';
import { PastCommandCount } from './mod.d.ts';
import { dbClient } from './db.ts';
import utils from './utils.ts';
import config from '../config.ts';

// getRandomStatus() returns status as string
// Gets a new random status for the bot
const getRandomStatus = async (): Promise<string> => {
	let status = '';
	switch (Math.floor((Math.random() * 4) + 1)) {
		case 1:
			status = `${config.prefix}help for commands`;
			break;
		case 2:
			status = `Running V${config.version}`;
			break;
		case 3:
			status = `${config.prefix}info to learn more`;
			break;
		default: {
			const cachedCount = await cacheHandlers.size('guilds');
			status = `Rolling dice for ${cachedCount + cache.dispatchedGuildIds.size} servers`;
			break;
		}
	}

	return status;
};

// updateListStatistics(bot ID, current guild count) returns nothing
// Sends the current server count to all bot list sites we are listed on
const updateListStatistics = (botID: bigint, serverCount: number): void => {
	config.botLists.forEach(async (e) => {
		log(LT.LOG, `Updating statistics for ${JSON.stringify(e)}`);
		if (e.enabled) {
			const tempHeaders = new Headers();
			tempHeaders.append(e.headers[0].header, e.headers[0].value);
			tempHeaders.append('Content-Type', 'application/json');
			// ?{} is a template used in config, just need to replace it with the real value
			const response = await fetch(e.apiUrl.replace('?{bot_id}', botID.toString()), {
				'method': 'POST',
				'headers': tempHeaders,
				'body': JSON.stringify(e.body).replace('"?{server_count}"', serverCount.toString()), // ?{server_count} needs the "" removed from around it aswell to make sure its sent as a number
			});
			log(LT.INFO, `Posted server count to ${e.name}.  Results: ${JSON.stringify(response)}`);
		}
	});
};

// Keep one week of data
const hoursToKeep = 7 * 24;
const previousHours: Array<Array<PastCommandCount>> = []
// updateHourlyRates() returns nothing
// Updates the hourlyRate for command usage
const updateHourlyRates = async () => {
	try {
		const newestHour = await dbClient.query(`SELECT command, count FROM command_cnt ORDER BY command;`).catch((e) => utils.commonLoggers.dbError('intervals.ts:71', 'query', e));
		previousHours.push(newestHour);
		if (previousHours.length > 1) {
			const oldestHour = previousHours[0];

			const computedDiff: Array<PastCommandCount> = []
			for (let i = 0; i < newestHour.length; i++) {
				computedDiff.push({
					command: newestHour[i].command,
					count: (newestHour[i].count - oldestHour[i].count),
				});
				log(LT.LOG, `Updating hourlyRate | Computing diffs: ${JSON.stringify(computedDiff)}`);
			}

			// Update DB
			computedDiff.forEach(async (cmd) => {
				log(LT.LOG, `Updating hourlyRate | Storing to DB: ${JSON.stringify(cmd)}`);
				await dbClient.execute(`UPDATE command_cnt SET hourlyRate = ? WHERE command = ?`, [(cmd.count / previousHours.length), cmd.command]).catch((e) => utils.commonLoggers.dbError('intervals.ts:88', 'update', e));
			});
		}

		if (previousHours.length > hoursToKeep) {
			previousHours.unshift();
		}
	} catch (e) {
		log(LT.ERROR, `Something went wrong in previousHours interval | Error: ${e.name} - ${e.message}`)
	}
};

export default { getRandomStatus, updateListStatistics, updateHourlyRates };
