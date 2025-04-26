import dbClient from '../../db/client.ts';
import {
  // Discordeno deps
  DiscordenoMessage,
} from '../../../deps.ts';
import { failColor, successColor } from '../../commandUtils.ts';
import utils from '../../utils.ts';

export const deleteGuild = async (message: DiscordenoMessage) => {
  let errorOut = false;
  await dbClient.execute(`DELETE FROM allowed_guilds WHERE guildid = ? AND channelid = ?`, [message.guildId, message.channelId]).catch((e0) => {
    utils.commonLoggers.dbError('deleteGuild.ts:15', 'query', e0);
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: 'Failed to delete this guild from the database.',
            description: 'If this issue persists, please report this to the developers.',
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('deleteGuild.ts:22', message, e));
    errorOut = true;
  });
  if (errorOut) return;

  // We won't get here if there's any errors, so we know it has bee successful, so report as such
  message
    .send({
      embeds: [
        {
          color: successColor,
          title: "This guild's API setting has been removed from The Artifier's Database.",
        },
      ],
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('deleteGuild.ts:33', message, e));
};
