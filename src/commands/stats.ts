import { cache, cacheHandlers, CreateGlobalApplicationCommand, DiscordenoMessage, Interaction } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor2 } from 'embeds/colors.ts';
import { compilingStats } from 'embeds/common.ts';

import utils from 'utils/utils.ts';

export const statsSC: CreateGlobalApplicationCommand = {
  name: 'stats',
  description: 'Shows general statistics on how much the bot is being used.',
};

export const stats = async (msgOrInt: DiscordenoMessage | Interaction) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('stats')).catch((e) => utils.commonLoggers.dbError('stats.ts:14', 'call sproc INC_CNT on', e));

  try {
    const m = await utils.sendOrInteract(msgOrInt, 'stats.ts:23', compilingStats, true);

    const startTime = new Date().getTime();
    // Calculate how many times commands have been run
    const rollQuery = await dbClient
      .query(`SELECT count, hourlyRate FROM command_cnt WHERE command = "roll";`)
      .catch((e) => utils.commonLoggers.dbError('stats.ts:23', 'query', e));
    const totalQuery = await dbClient
      .query(`SELECT SUM(count) as count, SUM(hourlyRate) as hourlyRate FROM command_cnt;`)
      .catch((e) => utils.commonLoggers.dbError('stats.ts:24', 'query', e));
    const rolls = BigInt(rollQuery[0].count);
    const rollRate = parseFloat(rollQuery[0].hourlyRate);
    const total = BigInt(totalQuery[0].count);
    const totalRate = parseFloat(totalQuery[0].hourlyRate);

    const cachedGuilds = await cacheHandlers.size('guilds');
    const cachedChannels = await cacheHandlers.size('channels');
    const cachedMembers = await cacheHandlers.size('members');

    const endTime = new Date().getTime();

    m?.edit({
      embeds: [
        {
          color: infoColor2,
          title: `${config.name}'s Statistics:`,
          timestamp: new Date().toISOString(),
          fields: [
            {
              name: 'Guilds:',
              value: `${(cachedGuilds + cache.dispatchedGuildIds.size).toLocaleString()}`,
              inline: true,
            },
            {
              name: 'Channels:',
              value: `${(cachedChannels + cache.dispatchedChannelIds.size).toLocaleString()}`,
              inline: true,
            },
            {
              name: 'Active Members:',
              value: `${cachedMembers.toLocaleString()}`,
              inline: true,
            },
            {
              name: 'Roll Commands:',
              value: `${rolls.toLocaleString()}\n(${Math.abs(rollRate).toFixed(2)} per hour)`,
              inline: true,
            },
            {
              name: 'Utility Commands:',
              value: `${(total - rolls).toLocaleString()}\n(${Math.abs(totalRate - rollRate).toFixed(2)} per hour)`,
              inline: true,
            },
          ],
          footer: {
            text: `Total query time: ${endTime - startTime}ms`,
          },
        },
      ],
    }).catch((e: Error) => utils.commonLoggers.messageEditError('stats.ts:82', m, e));
  } catch (e) {
    utils.commonLoggers.messageSendError('stats.ts:84', msgOrInt, e as Error);
  }
};
