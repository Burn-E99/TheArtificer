/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

import {
	// Discordeno deps
	cache, cacheHandlers
} from "../deps.ts";
import { LogTypes as LT } from "./utils.enums.ts";
import utils from "./utils.ts";

import config from "../config.ts";

// getRandomStatus() returns status as string
// Gets a new random status for the bot
const getRandomStatus = async (): Promise<string> => {
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
		default: {
			const cachedCount = await cacheHandlers.size("guilds")
			status = `Rolling dice for ${cachedCount + cache.dispatchedGuildIds.size} servers`;
			break;
		}
	}
	
	return status;
};

// updateListStatistics(bot ID, current guild count) returns nothing
// Sends the current server count to all bot list sites we are listed on
const updateListStatistics = (botID: bigint, serverCount: number): void => {
	config.botLists.forEach(async e => {
		utils.log(LT.LOG, `Updating statistics for ${JSON.stringify(e)}`)
		if (e.enabled) {
			const tempHeaders = new Headers();
			tempHeaders.append(e.headers[0].header, e.headers[0].value);
			tempHeaders.append("Content-Type", "application/json");
			// ?{} is a template used in config, just need to replace it with the real value
			const response = await fetch(e.apiUrl.replace("?{bot_id}", botID.toString()), {
				"method": 'POST',
				"headers": tempHeaders,
				"body": JSON.stringify(e.body).replace('"?{server_count}"', serverCount.toString()) // ?{server_count} needs the "" removed from around it aswell to make sure its sent as a number
			});
			utils.log(LT.INFO, `Posted server count to ${e.name}.  Results: ${JSON.stringify(response)}`);
		}
	});
};

export default { getRandomStatus, updateListStatistics };
