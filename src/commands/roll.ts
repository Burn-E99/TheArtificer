import { DiscordenoMessage } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';
import { DEVMODE } from '~flags';

import { getModifiers } from 'artigen/dice/getModifiers.ts';

import { sendRollRequest } from 'artigen/managers/queueManager.ts';

import { generateRollError, rollingEmbed } from 'artigen/utils/embeds.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

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
    let originalCommand = `${command}${command.length === 0 ? args.join('').trim() : args.join('')}`;
    // Try to ensure the command is wrapped
    if (!originalCommand.includes(config.postfix)) {
      originalCommand = `${originalCommand.trim()}${config.postfix}`;
    }
    if (!originalCommand.includes(config.prefix) || originalCommand.indexOf(config.prefix) > originalCommand.indexOf(config.postfix)) {
      originalCommand = `${config.prefix}${originalCommand.trim()}`;
    }

    const m = await message.reply(rollingEmbed);

    // Get modifiers from command
    const [modifiers, remainingArgs] = getModifiers(args);

    // Return early if the modifiers were invalid
    if (!modifiers.valid) {
      m.edit(generateRollError('Modifiers invalid:', modifiers.error.name, modifiers.error.message)).catch((e) => utils.commonLoggers.messageEditError('roll.ts:50', m, e));
    }

    let rollCmd = message.content.startsWith(`${config.prefix}r`) ? remainingArgs.join('') : `${command}${remainingArgs.join('')}`;

    // Try to ensure the roll is wrapped
    if (!rollCmd.includes(config.postfix)) {
      rollCmd = `${rollCmd.trim()}${config.postfix}`;
    }
    if (!rollCmd.includes(config.prefix) || rollCmd.indexOf(config.prefix) > rollCmd.indexOf(config.postfix)) {
      rollCmd = `${config.prefix}${rollCmd.trim()}`;
    }

    sendRollRequest({
      apiRoll: false,
      ddRoll: true,
      testRoll: false,
      dd: { myResponse: m, originalMessage: message },
      rollCmd,
      modifiers,
      originalCommand,
    });
  } catch (e) {
    log(LT.ERROR, `Unhandled Error: ${JSON.stringify(e)}`);
  }
};
