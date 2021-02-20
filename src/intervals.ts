/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

import {
	// Discordeno deps
	CacheData
} from "../deps.ts";

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

export default { getRandomStatus };
