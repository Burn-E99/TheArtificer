import { DiscordenoMessage } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor2 } from 'src/commandUtils.ts';
import utils from 'src/utils.ts';

export const rollDecorators = (message: DiscordenoMessage) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('rollDecorators')).catch((e) => utils.commonLoggers.dbError('rollHelp.ts:15', 'call sproc INC_CNT on', e));

  message
    .send({
      embeds: [
        {
          color: infoColor2,
          title: 'Roll Command Decorators:',
          description: `This command also has some useful decorators that can used.  These decorators simply need to be placed after all rolls in the message.

Examples: \`${config.prefix}d20${config.postfix} -nd\`, \`${config.prefix}d20${config.postfix} -nd -s\`, \`${config.prefix}d20${config.postfix} ${config.prefix}d20${config.postfix} ${config.prefix}d20${config.postfix} -o a\``,
          fields: [
            {
              name: '`-nd` - No Details',
              value: 'Suppresses all details of the requested roll',
              inline: true,
            },
            {
              name: '`-snd` - Super No Details',
              value: 'Suppresses all details of the requested roll and hides no details message',
              inline: true,
            },
            {
              name: '`-s` - Spoiler',
              value: 'Spoilers all details of the requested roll',
              inline: true,
            },
            {
              name: '`-m` or `-max` - Maximize Roll',
              value: 'Rolls the theoretical maximum roll, cannot be used with `-n` or `-min`',
              inline: true,
            },
            {
              name: '`-min` - Minimize Roll',
              value: 'Rolls the theoretical minimum roll, cannot be used with `-m`, `-max`, or `-n`',
              inline: true,
            },
            {
              name: '`-n` - Nominal Roll',
              value: 'Rolls the theoretical nominal roll, cannot be used with `-m`, `-max`, or `-min`',
              inline: true,
            },
            {
              name: '`-gm @user1 @user2 @userN` - GM Roll',
              value: 'Rolls the requested roll in GM mode, suppressing all publicly shown results and details and sending the results directly to the specified GMs',
              inline: true,
            },
            {
              name: '`-c` - Count Rolls',
              value: 'Shows the Count Embed, containing the count of successful rolls, failed rolls, rerolls, drops, and explosions',
              inline: true,
            },
            {
              name: '`-o [direction]` - Order Roll',
              value: `Rolls the requested roll and orders the results in the requested direction

Available directions:
\`a\` - Ascending (least to greatest)
\`d\` - Descending (greatest to least)`,
              inline: true,
            },
            {
              name: '`-ct` - Comma Totals',
              value: 'Adds commas to totals for readability',
              inline: true,
            },
          ],
        },
      ],
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('rollHelp.ts:247', message, e));
};
