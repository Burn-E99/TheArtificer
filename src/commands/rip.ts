import { DiscordenoMessage } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor2 } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const rip = (message: DiscordenoMessage) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('rip')).catch((e) => utils.commonLoggers.dbError('rip.ts:14', 'call sproc INC_CNT on', e));

  message
    .send({
      embeds: [
        {
          color: infoColor2,
          title: `${config.name} was built in memory of my Grandmother, Babka`,
          description: 'With much love, Ean',
          footer: { text: 'December 21, 2020' },
        },
      ],
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('rip.ts:26', message, e));
};
