import { CreateGlobalApplicationCommand, DiscordenoMessage, Interaction } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { failColor, infoColor2 } from 'embeds/colors.ts';

import intervals from 'utils/intervals.ts';
import utils from 'utils/utils.ts';

export const heatmapSC: CreateGlobalApplicationCommand = {
  name: 'heatmap',
  description: 'Shows a heatmap of when the roll command is run the most.',
};

export const heatmap = (msgOrInt: DiscordenoMessage | Interaction) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('heatmap')).catch((e) => utils.commonLoggers.dbError('heatmap.ts:14', 'call sproc INC_CNT on', e));

  if (config.api.enable) {
    utils.sendOrInteract(msgOrInt, 'heatmap.ts:23', {
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
    });
  } else {
    utils.sendOrInteract(msgOrInt, 'heatmap.ts:42', {
      embeds: [
        {
          title: 'Roll Heatmap Disabled',
          description: "This command requires the bot's API to be enabled.  If you are the host of this bot, check your `config.ts` file to enable it.",
          color: failColor,
        },
      ],
    });
  }
};
