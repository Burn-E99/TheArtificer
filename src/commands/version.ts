import { DiscordenoMessage } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor1 } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const version = (message: DiscordenoMessage) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('version')).catch((e) => utils.commonLoggers.dbError('version.ts:15', 'call sproc INC_CNT on', e));

  message
    .send({
      embeds: [
        {
          color: infoColor1,
          title: `My current version is ${config.version}`,
        },
      ],
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('version.ts:24', message, e));
};
