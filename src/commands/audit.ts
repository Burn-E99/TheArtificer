import config from '../../config.ts';
import dbClient from '../db/client.ts';
import { queries } from '../db/common.ts';
import {
  // Discordeno deps
  DiscordenoMessage,
} from '../../deps.ts';
import auditCommands from './auditCmd/_index.ts';
import { failColor } from '../commandUtils.ts';
import utils from '../utils.ts';

export const audit = async (message: DiscordenoMessage, args: string[]) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('audit')).catch((e) => utils.commonLoggers.dbError('audit.ts:16', 'call sproc INC_CNT on', e));

  // Local apiArg in lowercase
  const auditArg = (args[0] || 'help').toLowerCase();

  // Makes sure the user is authenticated to run the API command
  if (message.authorId === config.api.admin) {
    switch (auditArg) {
      case 'help':
      case 'h':
        // [[audit help or [[audit h
        // Shows API help details
        auditCommands.auditHelp(message);
        break;
      case 'db':
        // [[audit db
        // Shows current DB table sizes
        auditCommands.auditDB(message);
        break;
      case 'guilds':
        // [[audit guilds
        // Shows breakdown of guilds and detials on them
        auditCommands.auditGuilds(message);
        break;
      default:
        break;
    }
  } else {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: `Audit commands are powerful and can only be used by ${config.name}'s owner.`,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('audit.ts:51', message, e));
  }
};
