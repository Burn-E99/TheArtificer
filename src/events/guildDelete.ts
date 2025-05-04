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
  }).catch((e: Error) => utils.commonLoggers.messageSendError('mod.ts:99', 'Leave Guild', e));
  dbClient
    .execute('DELETE FROM allowed_guilds WHERE guildid = ? AND banned = 0', [guild.id])
    .catch((e) => utils.commonLoggers.dbError('mod.ts:100', 'delete from', e));
};
