/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

import {
	// Discordeno deps
	CacheData
} from "../deps.ts";
import { LogTypes as LT } from "./utils.enums.ts";
import utils from "./utils.ts";

import config from "../config.ts";

// getRandomStatus(bot cache) returns status as string
// Gets a new random status for the bot
const getRandomStatus = (cache: CacheData): string => {
	let status = "";
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
		default:
			status = `Rolling dice for ${cache.guilds.size} servers`;
			break;
	}
	
	return status;
};

// updateListStatistics(bot ID, current guild count) returns nothing
// Sends the current server count to all bot list sites we are listed on
const updateListStatistics = (botID: string, serverCount: number): void => {
	config.botLists.forEach(async e => {
		if (e.enabled) {
			const tempHeaders = new Headers();
			tempHeaders.append(e.headers[0].header, e.headers[0].value);
			tempHeaders.append("Content-Type", "application/json");
			// ?{} is a template used in config, just need to replace it with the real value
			const response = await fetch(e.apiUrl.replace("?{bot_id}", botID), {
				"method": 'POST',
				"headers": tempHeaders,
				"body": JSON.stringify(e.body).replace('"?{server_count}"', serverCount.toString()) // ?{server_count} needs the "" removed from around it aswell to make sure its sent as a number
			});
			utils.log(LT.LOG, `${JSON.stringify(response)}`);
		}
	});
};

export default { getRandomStatus, updateListStatistics };
