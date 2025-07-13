import { DiscordenoGuild, EmbedField, sendMessage } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { infoColor1 } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

let guildsJoined: EmbedField[] = [];

const sendGuildJoinedBatch = () => {
  if (guildsJoined.length) {
    sendMessage(config.logChannel, {
      embeds: [
        {
          title: 'Guild Joined!',
          color: infoColor1,
          fields: guildsJoined,
        },
      ],
    }).catch((e: Error) => utils.commonLoggers.messageSendError('guildCreate.ts:21', 'Join Guild', e));
    guildsJoined = [];
  }
};

setInterval(() => {
  sendGuildJoinedBatch();
}, 60_000);

export const guildCreateHandler = (guild: DiscordenoGuild) => {
  log(LT.LOG, `Handling joining guild ${JSON.stringify(guild)}`);
  guildsJoined.push({
    name: `${guild.name}: (${guild.memberCount})`,
    value: `${guild.id}`,
  });
  if (guildsJoined.length === 25) {
    sendGuildJoinedBatch();
  }
};
