import { DiscordenoMessage } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';
import { DEVMODE } from '~flags';

import { getModifiers } from 'artigen/dice/getModifiers.ts';

import { sendRollRequest } from 'artigen/managers/queueManager.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { generateRollError, rollingEmbed } from 'embeds/artigen.ts';
import { warnColor } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const roll = async (message: DiscordenoMessage, args: string[], command: string) => {
  // Light telemetry to see how many times a command is being run
  const currDateTime = new Date();
  dbClient.execute(queries.callIncCnt('roll')).catch((e) => utils.commonLoggers.dbError('roll.ts:20', 'call sproc INC_CNT on', e));
  dbClient.execute(queries.callIncHeatmap(currDateTime)).catch((e) => utils.commonLoggers.dbError('roll.ts:21', 'update', e));

  // If DEVMODE is on, only allow this command to be used in the devServer
  if (DEVMODE && message.guildId !== config.devServer) {
    message
      .send({
        embeds: [
          {
            color: warnColor,
            title: 'Command is in development, please try again later.',
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('roll.ts:30', message, e));
    return;
  }

  // Rest of this command is in a try-catch to protect all sends/edits from erroring out
  try {
    const originalCommand = `${config.prefix}${command} ${args.join(' ')}`;

    const m = await message.reply(rollingEmbed);

    // Get modifiers from command
    const modifiers = getModifiers(args);

    // Return early if the modifiers were invalid
    if (!modifiers.valid) {
      m.edit(generateRollError('Modifiers invalid:', modifiers.error.name, modifiers.error.message)).catch((e) =>
        utils.commonLoggers.messageEditError('roll.ts:50', m, e)
      );

      if (DEVMODE && config.logRolls) {
        // If enabled, log rolls so we can verify the bots math
        dbClient
          .execute(queries.insertRollLogCmd(0, 1), [originalCommand, modifiers.error.name, m.id])
          .catch((e) => utils.commonLoggers.dbError('roll.ts:57', 'insert into', e));
      }
      return;
    }

    sendRollRequest({
      apiRoll: false,
      dd: { myResponse: m, originalMessage: message },
      rollCmd: message.content,
      modifiers,
      originalCommand,
    });
  } catch (e) {
    log(LT.ERROR, `Unhandled Error: ${JSON.stringify(e)}`);
  }
};
