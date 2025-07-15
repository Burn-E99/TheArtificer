import { DiscordenoMessage } from '@discordeno';

import { generateHelpMessage } from 'commands/helpLibrary/generateHelpMessage.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { InteractionValueSeparator } from 'events/interactionCreate.ts';

import utils from 'utils/utils.ts';

export const rollHelp = (message: DiscordenoMessage, subPage?: string) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('rollhelp')).catch((e) => utils.commonLoggers.dbError('rollHelp.ts:15', 'call sproc INC_CNT on', e));

  message
    .send(generateHelpMessage(subPage ? `roll-help${InteractionValueSeparator}${subPage}` : 'roll-help'))
    .catch((e: Error) => utils.commonLoggers.messageSendError('rollHelp.ts:247', message, e));
};
