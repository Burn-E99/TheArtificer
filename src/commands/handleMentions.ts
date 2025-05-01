import { DiscordenoMessage } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor1 } from 'src/commandUtils.ts';
import utils from 'src/utils.ts';

export const handleMentions = (message: DiscordenoMessage) => {
  log(LT.LOG, `Handling @mention message: ${JSON.stringify(message)}`);

  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('mention')).catch((e) => utils.commonLoggers.dbError('handleMentions.ts:17', 'call sproc INC_CNT on', e));

  message
    .send({
      embeds: [
        {
          color: infoColor1,
          title: `Hello!  I am ${config.name}!`,
          fields: [
            {
              name: 'I am a bot that specializes in rolling dice and doing basic algebra.',
              value: `To learn about my available commands, please run \`${config.prefix}help\`.

Want me to ignore you?  Simply run \`${config.prefix}opt-out\` and ${config.name} will no longer read your messages or respond to you.`,
            },
          ],
        },
      ],
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('handleMentions.ts:30', message, e));
};
