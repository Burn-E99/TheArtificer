import dbClient from '../db/client.ts';
import { queries } from '../db/common.ts';
import {
  // Discordeno deps
  DiscordenoMessage,
} from '../../deps.ts';
import config from '../../config.ts';
import { failColor, infoColor2 } from '../commandUtils.ts';
import utils from '../utils.ts';
import intervals from '../intervals.ts';

export const heatmap = (message: DiscordenoMessage) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('heatmap')).catch((e) => utils.commonLoggers.dbError('heatmap.ts:14', 'call sproc INC_CNT on', e));

  if (config.api.enable) {
    message
      .send({
        embeds: [
          {
            title: 'Roll Heatmap',
            description: `Over time, this image will show a nice pattern of when rolls are requested the most.

Least Rolls: ${intervals.getMinRollCnt()}
Most Rolls: ${intervals.getMaxRollCnt()}`,
            footer: {
              text: 'Data is shown in US Eastern Time. | This heatmap uses data starting 6/26/2022.',
            },
            color: infoColor2,
            image: {
              url: `${config.api.publicDomain}api/heatmap.png?now=${new Date().getTime()}`,
            },
          },
        ],
      })
      .catch((e) => utils.commonLoggers.messageSendError('heatmap.ts:21', message, e));
  } else {
    message
      .send({
        embeds: [
          {
            title: 'Roll Heatmap Disabled',
            description: "This command requires the bot's API to be enabled.  If you are the host of this bot, check your `config.ts` file to enable it.",
            color: failColor,
          },
        ],
      })
      .catch((e) => utils.commonLoggers.messageSendError('heatmap.ts:21', message, e));
  }
};
