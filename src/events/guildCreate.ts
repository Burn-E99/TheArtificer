import { DiscordenoGuild, sendMessage } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { successColor } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const guildCreateHandler = (guild: DiscordenoGuild) => {
  log(LT.LOG, `Handling joining guild ${JSON.stringify(guild)}`);
  sendMessage(config.logChannel, {
    embeds: [
      {
        title: 'New Guild Joined!',
        color: successColor,
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
  }).catch((e: Error) => utils.commonLoggers.messageSendError('guildCreate.ts:36', 'Join Guild', e));
};
