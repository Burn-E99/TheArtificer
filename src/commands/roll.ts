import { CreateGlobalApplicationCommand, DiscordApplicationCommandOptionTypes, DiscordenoMessage, hasOwnProperty, Interaction } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { getModifiers } from 'artigen/dice/getModifiers.ts';

import { sendRollRequest } from 'artigen/managers/queueManager.ts';

import { generateRollError, rollingEmbed } from 'artigen/utils/embeds.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import utils from 'utils/utils.ts';

export const rollSC: CreateGlobalApplicationCommand = {
  name: 'roll',
  description: 'Rolls dice and does math! For help, see the "Dice/Roll/Math Command" section in the /help library.',
  options: [
    {
      type: DiscordApplicationCommandOptionTypes.String,
      name: 'roll-string',
      description: 'The full roll string to execute.',
      required: true,
    },
  ],
};

export const roll = async (msgOrInt: DiscordenoMessage | Interaction, args: string[], command: string) => {
  // Light telemetry to see how many times a command is being run
  const currDateTime = new Date();
  dbClient.execute(queries.callIncCnt('roll')).catch((e) => utils.commonLoggers.dbError('roll.ts:20', 'call sproc INC_CNT on', e));
  dbClient.execute(queries.callIncHeatmap(currDateTime)).catch((e) => utils.commonLoggers.dbError('roll.ts:21', 'update', e));

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

    const m = await utils.sendOrInteract(msgOrInt, 'roll.ts:47', rollingEmbed, true);
    if (!m) {
      throw new Error("My message didn't send!");
    }

    // Get modifiers from command
    const [modifiers, remainingArgs] = getModifiers(args);

    // Return early if the modifiers were invalid
    if (!modifiers.valid) {
      m.edit(generateRollError('Modifiers invalid:', modifiers.error.name, modifiers.error.message)).catch((e) => utils.commonLoggers.messageEditError('roll.ts:50', m, e));
    }

    let rollCmd = (hasOwnProperty(msgOrInt, 'token') ? args.join('') : msgOrInt.content).startsWith(`${config.prefix}r`) ? remainingArgs.join('') : `${command}${remainingArgs.join('')}`;

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
      dd: {
        authorId: utils.getAuthorIdFromMessageOrInteraction(msgOrInt),
        myResponse: m,
        originalMessage: hasOwnProperty(msgOrInt, 'token') ? m : msgOrInt,
      },
      rollCmd,
      modifiers,
      originalCommand,
    });
  } catch (e) {
    log(LT.ERROR, `Unhandled Roll Error: ${JSON.stringify(e)} | msgOrInt: ${JSON.stringify(msgOrInt)} | args: ${JSON.stringify(args)} | command: ${command}`);
  }
};
