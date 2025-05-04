/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */
import { Intents, startBot } from '@discordeno';
import { initLog } from '@Log4Deno';

import config from '~config';
import { DEBUG, DEVMODE, LOCALMODE } from '~flags';

import api from 'src/api.ts';
import eventHandlers from 'src/events.ts';

import utils from 'utils/utils.ts';

// Extend the BigInt prototype to support JSON.stringify
interface BigIntX extends BigInt {
  // Convert to BigInt to string form in JSON.stringify
  toJSON: () => string;
}
(BigInt.prototype as BigIntX).toJSON = function () {
  return this.toString();
};

// Initialize logging client with folder to use for logs, needs --allow-write set on Deno startup
initLog('logs', DEBUG);

// Start up the Discord Bot
startBot({
  token: LOCALMODE ? config.localtoken : config.token,
  intents: [Intents.GuildMessages, Intents.DirectMessages, Intents.Guilds],
  eventHandlers,
});

// Start up the command prompt for debug usage
if (DEBUG && DEVMODE) {
  utils.cmdPrompt(config.logChannel, config.name);
}

// Start up the API for rolling from third party apps (like excel macros)
if (config.api.enable) {
  api.start();
}
