import { DiscordenoMessage } from '@discordeno';

import { generateHelpMessage } from 'commands/helpLibrary/generateHelpMessage.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import utils from 'utils/utils.ts';

export const help = (message: DiscordenoMessage) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('help')).catch((e) => utils.commonLoggers.dbError('help.ts:15', 'call sproc INC_CNT on', e));
  message.send(generateHelpMessage()).catch((e: Error) => utils.commonLoggers.messageSendError('help.ts:16', message, e));
};
