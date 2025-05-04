import { DiscordenoMessage } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { ignoreList, queries } from 'db/common.ts';

import { failColor, successColor } from 'embeds/colors.ts';

import utils from 'src/utils.ts';

export const optOut = async (message: DiscordenoMessage) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('opt-out')).catch((e) => utils.commonLoggers.dbError('optOut.ts:11', 'call sproc INC_CNT on', e));

  try {
    ignoreList.push(message.authorId);
    await dbClient.execute('INSERT INTO ignore_list(userid) values(?)', [message.authorId]);

    message
      .reply({
        embeds: [
          {
            color: successColor,
            title: `${config.name} will no longer respond to you.`,
            description: `If you want ${config.name} to respond to you again, please DM ${config.name} the following command:

\`${config.prefix}opt-in\``,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('optOut.ts:25', message, e));
  } catch (_e) {
    message
      .reply({
        embeds: [
          {
            color: failColor,
            title: 'Opt-Out failed',
            description: `Please try the command again.  If the issue persists, please report this using the \`${config.prefix}report opt-out failed\` command.`,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('optOut.ts:33', message, e));
  }
};
