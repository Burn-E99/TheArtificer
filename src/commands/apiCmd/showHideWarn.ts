import dbClient from '../../db/client.ts';
import {
  // Discordeno deps
  DiscordenoMessage,
} from '../../../deps.ts';
import { generateApiFailed, generateApiSuccess } from '../../commandUtils.ts';
import utils from '../../utils.ts';

export const showHideWarn = async (message: DiscordenoMessage, apiArg: string) => {
  let errorOutInitial = false;
  const guildQuery = await dbClient
    .query(`SELECT guildid, channelid FROM allowed_guilds WHERE guildid = ? AND channelid = ?`, [message.guildId, message.channelId])
    .catch((e0) => {
      utils.commonLoggers.dbError('showHideWarn.ts:15', 'query', e0);
      message.send(generateApiFailed(`${apiArg} on`)).catch((e: Error) => utils.commonLoggers.messageSendError('showHideWarn.ts:16', message, e));
      errorOutInitial = true;
    });
  if (errorOutInitial) return;

  let errorOut = false;
  if (guildQuery.length === 0) {
    // Since guild is not in our DB, add it in
    await dbClient
      .execute(`INSERT INTO allowed_guilds(guildid,channelid,hidewarn) values(?,?,?)`, [message.guildId, message.channelId, apiArg === 'hide-warn' ? 1 : 0])
      .catch((e0) => {
        utils.commonLoggers.dbError('showHideWarn.ts:25', 'insert into', e0);
        message.send(generateApiFailed(`${apiArg} on`)).catch((e: Error) => utils.commonLoggers.messageSendError('showHideWarn.ts:26', message, e));
        errorOut = true;
      });
  } else {
    // Since guild is in our DB, update it
    await dbClient
      .execute(`UPDATE allowed_guilds SET hidewarn = ? WHERE guildid = ? AND channelid = ?`, [
        apiArg === 'hide-warn' ? 1 : 0,
        message.guildId,
        message.channelId,
      ])
      .catch((e0) => {
        utils.commonLoggers.dbError('showHideWarn.ts:32', 'update', e0);
        message.send(generateApiFailed(`${apiArg} on`)).catch((e: Error) => utils.commonLoggers.messageSendError('showHideWarn.ts:33', message, e));
        errorOut = true;
      });
  }
  if (errorOut) return;

  // We won't get here if there's any errors, so we know it has bee successful, so report as such
  message.send(generateApiSuccess(apiArg)).catch((e: Error) => utils.commonLoggers.messageSendError('showHideWarn.ts:40', message, e));
};
