import { botId, cache, DiscordActivityTypes, editBotNickname, editBotStatus, sendMessage } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';
import { LOCALMODE } from '~flags';

import { successColor } from 'embeds/colors.ts';

import intervals from 'utils/intervals.ts';
import utils from 'utils/utils.ts';

export const readyHandler = () => {
  log(LT.INFO, `${config.name} Logged in!`);
  editBotStatus({
    activities: [
      {
        name: 'Booting up . . .',
        type: DiscordActivityTypes.Game,
        createdAt: new Date().getTime(),
      },
    ],
    status: 'online',
  });

  // Interval to rotate the status text every 30 seconds to show off more commands
  setInterval(async () => {
    log(LT.LOG, 'Changing bot status');
    try {
      // Wrapped in try-catch due to hard crash possible
      editBotStatus({
        activities: [
          {
            name: await intervals.getRandomStatus(),
            type: DiscordActivityTypes.Game,
            createdAt: new Date().getTime(),
          },
        ],
        status: 'online',
      });
    } catch (e) {
      log(LT.ERROR, `Failed to update status: ${JSON.stringify(e)}`);
    }
  }, 30_000);

  // Interval to update bot list stats every 24 hours
  LOCALMODE ? log(LT.INFO, 'updateListStatistics not running') : setInterval(() => {
    log(LT.LOG, 'Updating all bot lists statistics');
    intervals.updateListStatistics(botId, cache.guilds.size + cache.dispatchedGuildIds.size);
  }, 86_400_000);

  // Interval to update hourlyRates every hour
  setInterval(() => {
    log(LT.LOG, 'Updating all command hourlyRates');
    intervals.updateHourlyRates();
  }, 3_600_000);

  // Interval to update heatmap.png every hour
  setInterval(() => {
    log(LT.LOG, 'Updating heatmap.png');
    intervals.updateHeatmapPng();
  }, 3_600_000);

  // setTimeout added to make sure the startup message does not error out
  setTimeout(() => {
    LOCALMODE && editBotNickname(config.devServer, `LOCAL - ${config.name}`);
    LOCALMODE ? log(LT.INFO, 'updateListStatistics not running') : intervals.updateListStatistics(botId, cache.guilds.size + cache.dispatchedGuildIds.size);
    intervals.updateHourlyRates();
    intervals.updateHeatmapPng();
    editBotStatus({
      activities: [
        {
          name: 'Booting Complete',
          type: DiscordActivityTypes.Game,
          createdAt: new Date().getTime(),
        },
      ],
      status: 'online',
    });
    sendMessage(config.logChannel, {
      embeds: [
        {
          title: `${config.name} is now Online`,
          color: successColor,
          fields: [
            {
              name: 'Version:',
              value: `${config.version}`,
              inline: true,
            },
          ],
        },
      ],
    }).catch((e: Error) => utils.commonLoggers.messageSendError('ready.ts:93', 'Startup', e));
  }, 1_000);
};
