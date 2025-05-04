import { DiscordenoMessage } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor2 } from 'embeds/colors.ts';

import utils from 'src/utils.ts';

export const info = (message: DiscordenoMessage) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('info')).catch((e) => utils.commonLoggers.dbError('info.ts:12', 'call sproc INC_CNT on', e));

  message
    .send({
      embeds: [
        {
          color: infoColor2,
          title: `${config.name}, a Discord bot that specializing in rolling dice and calculating math`,
          description: `${config.name} is developed by Ean AKA Burn_E99.
Additional information can be found on my website [here](${config.links.homePage}).
Want to check out my source code?  Check it out [here](${config.links.sourceCode}).
Need help with this bot?  Join my support server [here](${config.links.supportServer}).`,
        },
      ],
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('info.ts:23', message, e));
};
