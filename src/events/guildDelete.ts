import { DiscordenoGuild, sendMessage } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import dbClient from 'db/client.ts';

import { warnColor } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const guildDeleteHandler = (guild: DiscordenoGuild) => {
  log(LT.LOG, `Handling leaving guild ${JSON.stringify(guild)}`);
  sendMessage(config.logChannel, {
    embeds: [
      {
        title: 'Removed from Guild',
        color: warnColor,
        fields: [
          {
            name: 'Name:',
            value: `${guild.name}`,
            inline: true,
          },
          {
            name: 'Id:',
            value: `${guild.id}`,
            inline: true,
          },
          {
            name: 'Member Count:',
            value: `${guild.memberCount}`,
            inline: true,
          },
        ],
      },
    ],
  }).catch((e: Error) => utils.commonLoggers.messageSendError('guildDelete.ts:38', 'Leave Guild', e));

  // Clean up any guild based data
  dbClient
    .execute('DELETE FROM allowed_guilds WHERE guildid = ? AND banned = 0', [guild.id])
    .catch((e) => utils.commonLoggers.dbError('guildDelete.ts:41', 'delete from', e));
  dbClient.execute('DELETE FROM allow_inline WHERE guildid = ?', [guild.id]).catch((e) => utils.commonLoggers.dbError('guildDelete.ts:42', 'delete from', e));
  dbClient
    .execute('DELETE FROM aliases WHERE guildid = ? AND userid = ?', [guild.id, 0n])
    .catch((e) => utils.commonLoggers.dbError('guildDelete.ts:45', 'delete from', e));
};
