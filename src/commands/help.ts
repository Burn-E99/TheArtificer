import { CreateGlobalApplicationCommand, DiscordenoMessage, Interaction } from '@discordeno';

import config from '~config';

import { generateHelpMessage } from 'commands/helpLibrary/generateHelpMessage.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import utils from 'utils/utils.ts';

export const helpSC: CreateGlobalApplicationCommand = {
  name: 'help',
  description: `Opens ${config.name}'s Help Library.`,
};

export const help = (msgOrInt: DiscordenoMessage | Interaction) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('help')).catch((e) => utils.commonLoggers.dbError('help.ts:15', 'call sproc INC_CNT on', e));
  utils.sendOrInteract(msgOrInt, 'help.ts:20', generateHelpMessage());
};
