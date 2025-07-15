import { DiscordenoMessage } from '@discordeno';

import aliasCommands from 'commands/aliasCmd/_index.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { failColor } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const alias = (message: DiscordenoMessage, argSpaces: string[]) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('alias')).catch((e) => utils.commonLoggers.dbError('aliasCmd.ts:16', 'call sproc INC_CNT on', e));

  // argSpaces will come in with a space or \n before every real arg, so extra shifts exist to remove them
  argSpaces.shift();
  let aliasArg = (argSpaces.shift() || '').toLowerCase().trim();
  argSpaces.shift();

  let guildMode = false;
  if (aliasArg === 'guild') {
    guildMode = true;
    aliasArg = (argSpaces.shift() || '').toLowerCase().trim();
    argSpaces.shift();
  }

  if (guildMode && message.guildId === 0n) {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: 'Guild Aliases can only be modified from within the desired guild.',
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('aliasCmd.ts:38', message, e));
    return;
  }

  // Makes sure the user is authenticated to run the API command
  switch (aliasArg) {
    case 'help':
    case 'h':
    case '?':
    case '':
      aliasCommands.help(message, guildMode);
      break;
    case 'list':
    case 'list-all':
      aliasCommands.list(message, guildMode);
      break;
    case 'add':
    case 'create':
    case 'set':
      aliasCommands.add(message, guildMode, argSpaces);
      break;
    case 'update':
    case 'replace':
      aliasCommands.update(message, guildMode, argSpaces);
      break;
    case 'preview':
    case 'view':
      aliasCommands.view(message, guildMode, argSpaces);
      break;
    case 'delete':
    case 'remove':
      aliasCommands.deleteOne(message, guildMode, argSpaces);
      break;
    case 'delete-all':
    case 'remove-all':
      aliasCommands.deleteAll(message, guildMode, argSpaces);
      break;
    case 'clone':
    case 'copy':
      aliasCommands.clone(message, guildMode, argSpaces);
      break;
    case 'run':
    case 'execute':
    default:
      aliasCommands.run(message, guildMode, aliasArg, argSpaces);
      break;
  }
};
