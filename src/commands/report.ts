import { DiscordenoMessage, sendMessage } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { failColor, infoColor2, successColor } from 'embeds/colors.ts';
import utils from 'utils/utils.ts';

export const report = (message: DiscordenoMessage, args: string[]) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('report')).catch((e) => utils.commonLoggers.dbError('report.ts:17', 'call sproc INC_CNT on', e));

  if (args.join(' ')) {
    sendMessage(config.reportChannel, {
      embeds: [
        {
          color: infoColor2,
          title: 'USER REPORT:',
          description: args.join(' ') || 'No message',
        },
      ],
    }).catch((e: Error) => utils.commonLoggers.messageSendError('report.ts:22', message, e));
    message
      .send({
        embeds: [
          {
            color: successColor,
            title: 'Failed command has been reported to my developer.',
            description: `For more in depth support, and information about planned maintenance, please join the support server [here](${config.links.supportServer}).`,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('report.ts:29', message, e));
  } else {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: 'Please provide a short description of what failed',
            description: 'Providing a short description helps my developer quickly diagnose what went wrong.',
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('report.ts:37', message, e));
  }
};
