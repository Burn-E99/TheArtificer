import config from '../../config.ts';
import { DEVMODE } from '../../flags.ts';
import dbClient from '../db/client.ts';
import { queries } from '../db/common.ts';
import {
  // Discordeno deps
  DiscordenoMessage,
  // Log4Deno deps
  log,
  LT,
} from '../../deps.ts';
import { rollingEmbed, warnColor } from '../commandUtils.ts';
import rollFuncs from './roll/_index.ts';
import { queueRoll } from '../solver/rollQueue.ts';
import { QueuedRoll } from '../mod.d.ts';
import utils from '../utils.ts';

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
    const modifiers = rollFuncs.getModifiers(m, args, command, originalCommand);

    // Return early if the modifiers were invalid
    if (!modifiers.valid) {
      return;
    }

    // Rejoin all of the args and send it into the solver, if solver returns a falsy item, an error object will be substituded in
    const rollCmd = message.content.substring(2);

    queueRoll(
      <QueuedRoll> {
        apiRoll: false,
        dd: { m, message },
        rollCmd,
        modifiers,
        originalCommand,
      },
    );
  } catch (e) {
    log(LT.ERROR, `Undandled Error: ${JSON.stringify(e)}`);
  }
};
