import { cache, cacheHandlers } from '@discordeno';
import { STATUS_CODE, STATUS_TEXT } from '@std/http/status';

import { basicReducer } from 'artigen/utils/reducers.ts';

import dbClient from 'db/client.ts';

import stdResponses from 'endpoints/stdResponses.ts';

import utils from 'utils/utils.ts';

export const apiStats = async (): Promise<Response> => {
  const headers = new Headers();
  headers.append('Content-Type', 'text/json');

  const memberCount = cache.guilds
    .array()
    .map((guild) => guild.memberCount)
    .reduce(basicReducer, 0);

  const cachedGuilds = await cacheHandlers.size('guilds');

  const rollQuery = await dbClient
    .query(`SELECT count, hourlyRate FROM command_cnt WHERE command = "roll";`)
    .catch((e) => utils.commonLoggers.dbError('stats.ts:23', 'query', e));
  const rollCount = BigInt(rollQuery[0].count ?? '0');

  if (!rollCount) {
    return stdResponses.InternalServerError('');
  }

  return new Response(
    JSON.stringify({
      guildCount: cachedGuilds + cache.dispatchedGuildIds.size,
      memberCount,
      rollCount: Number(rollCount),
    }),
    {
      status: STATUS_CODE.OK,
      statusText: STATUS_TEXT[STATUS_CODE.OK],
      headers,
    },
  );
};
