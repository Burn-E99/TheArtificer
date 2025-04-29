import config from '../../../config.ts';
import {
  // Discordeno deps
  cache,
  cacheHandlers,
  DiscordenoGuild,
  DiscordenoMessage,
} from '../../../deps.ts';
import { infoColor2 } from '../../commandUtils.ts';
import utils from '../../utils.ts';

const sortGuildByMemberCount = (a: DiscordenoGuild, b: DiscordenoGuild) => {
  if (a.memberCount < b.memberCount) {
    return 1;
  }
  if (a.memberCount > b.memberCount) {
    return -1;
  }
  return 0;
};

export const auditGuilds = async (message: DiscordenoMessage) => {
  const cachedGuilds = await cacheHandlers.size('guilds');
  const guildOwnerCounts = new Map<bigint, number>();

  let totalCount = 0;
  let realCount = 0;
  let botsCount = 0;

  let auditText = '';

  cache.guilds
    .array()
    .sort(sortGuildByMemberCount)
    .forEach((guild) => {
      totalCount += guild.memberCount;
      let localBotCount = 0;
      let localRealCount = 0;
      guild.members.forEach((member) => {
        if (member.bot) {
          botsCount++;
          localBotCount++;
        } else {
          realCount++;
          localRealCount++;
        }
      });

      // Track repeat guild owners
      guildOwnerCounts.set(guild.ownerId, (guildOwnerCounts.get(guild.ownerId) ?? 0) + 1);

      auditText += `Guild: ${guild.name} (${guild.id})
Owner: ${guild.owner?.username}#${guild.owner?.discriminator} (${guild.ownerId})
Tot mem: ${guild.memberCount} | Real: ${localRealCount} | Bot: ${localBotCount}

`;
    });

  const b = await new Blob([auditText as BlobPart], { type: 'text' });
  const tooBig = await new Blob(['tooBig' as BlobPart], { type: 'text' });

  // Condense repeat guild owners
  const repeatCounts: number[] = [];
  Array.from(guildOwnerCounts).map(([_owenId, cnt]) => {
    repeatCounts[cnt - 1] = (repeatCounts[cnt - 1] ?? 0) + 1;
  });

  message
    .send({
      embeds: [
        {
          color: infoColor2,
          title: 'Guilds Audit',
          description: `Shows details of the guilds that ${config.name} serves.

Please see attached file for audit details on cached guilds and members.`,
          timestamp: new Date().toISOString(),
          fields: [
            {
              name: 'Total Guilds:',
              value: `${cache.guilds.size}`,
              inline: true,
            },
            {
              name: 'Cached Guilds:',
              value: `${cachedGuilds}`,
              inline: true,
            },
            {
              name: 'Uncached Guilds:',
              value: `${cache.dispatchedGuildIds.size}`,
              inline: true,
            },
            {
              name: 'Total Members\n(may be artificially higher if 1 user is in multiple guilds the bot is in):',
              value: `${totalCount}`,
              inline: true,
            },
            {
              name: 'Cached Real People:',
              value: `${realCount}`,
              inline: true,
            },
            {
              name: 'Cached Bots:',
              value: `${botsCount}`,
              inline: true,
            },
            {
              name: 'Average members per guild:',
              value: `${(totalCount / cache.guilds.size).toFixed(2)}`,
              inline: true,
            },
            {
              name: 'Repeat Guild Owners:',
              value: repeatCounts
                .map((ownerCnt, serverIdx) => `${ownerCnt} ${ownerCnt === 1 ? 'person has' : 'people have'} me in ${serverIdx + 1} of their guilds`)
                .filter((str) => str)
                .join('\n') || 'No Repeat Guild Owners',
            },
          ],
        },
      ],
      file: {
        blob: b.size > 8388290 ? tooBig : b,
        name: 'auditDetails.txt',
      },
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('auditGuild.ts:19', message, e));
};
