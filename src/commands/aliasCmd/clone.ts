import { DiscordenoMessage, hasGuildPermissions } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';

import { generateAliasError } from 'embeds/alias.ts';
import { failColor, successColor } from 'embeds/colors.ts';

import { SlashCommandInteractionWithGuildId } from 'src/mod.d.ts';

import utils from 'utils/utils.ts';

interface QueryShape {
  aliasName: string;
  yVarCnt: number;
  rollStr: string;
}

export const clone = async (msgOrInt: DiscordenoMessage | SlashCommandInteractionWithGuildId, guildMode: boolean, argSpaces: string[]) => {
  if (!guildMode && !(await hasGuildPermissions(BigInt(msgOrInt.guildId), utils.getAuthorIdFromMessageOrInteraction(msgOrInt), ['ADMINISTRATOR']))) {
    utils.sendOrInteract(msgOrInt, 'clone.ts:22', {
      embeds: [
        {
          color: failColor,
          title: `Error: Only Guild Owners and Admins can copy a personal alias to a guild aliases`,
        },
      ],
    });
    return;
  }

  const aliasName = (argSpaces.shift() || '').trim().toLowerCase();

  if (!aliasName) {
    utils.sendOrInteract(msgOrInt, 'clone.ts:37', {
      embeds: [
        {
          color: failColor,
          title: `Error: Please specify an alias to copy to ${guildMode ? 'your account' : 'this guild'}`,
        },
      ],
    });
    return;
  }

  let errorOut = false;
  const query: QueryShape[] = await dbClient
    .query(
      `SELECT aliasName, yVarCnt, rollStr FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?`,
      guildMode ? [BigInt(msgOrInt.guildId), 0n, aliasName] : [0n, utils.getAuthorIdFromMessageOrInteraction(msgOrInt), aliasName],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('clone.ts:51', 'query', e0);
      utils.sendOrInteract(
        msgOrInt,
        'clone.ts:57',
        generateAliasError(
          'DB Query Failed.',
          `clone-q0-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
        ),
      );
      errorOut = true;
    });
  if (errorOut) return;

  const details = query[0];

  if (!details) {
    utils.sendOrInteract(msgOrInt, 'clone.ts:71', {
      embeds: [
        {
          color: failColor,
          title: `\`${aliasName}\` does not exist as a${guildMode ? ' guild alias' : 'n alias on your account'}.`,
          description: `Did you mean to run \`${config.prefix}ra ${guildMode ? '' : 'guild '}clone ${aliasName}\`?`,
        },
      ],
    });
  }

  const targetQuery: QueryShape[] = await dbClient
    .query(
      `SELECT aliasName, yVarCnt, rollStr FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?`,
      guildMode ? [0n, utils.getAuthorIdFromMessageOrInteraction(msgOrInt), aliasName] : [BigInt(msgOrInt.guildId), 0n, aliasName],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('clone.ts:82', 'query', e0);
      utils.sendOrInteract(
        msgOrInt,
        'clone.ts:90',
        generateAliasError(
          'DB Query Failed.',
          `clone-q1-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
        ),
      );
      errorOut = true;
    });
  if (errorOut) return;

  if (targetQuery.length) {
    utils.sendOrInteract(msgOrInt, 'clone.ts:102', {
      embeds: [
        {
          color: failColor,
          title: `\`${aliasName}\` already exists as an alias ${guildMode ? 'on your account' : 'in this guild'}.`,
          description: `Please delete or rename the ${guildMode ? 'personal' : 'guild'} alias \`${aliasName}\` and try again.`,
        },
      ],
    });
    return;
  }

  await dbClient
    .execute(`INSERT INTO aliases(guildid,userid,aliasName,rollStr,yVarCnt,premium) values(?,?,?,?,?,?)`, [
      guildMode ? 0n : BigInt(msgOrInt.guildId),
      guildMode ? utils.getAuthorIdFromMessageOrInteraction(msgOrInt) : 0n,
      aliasName,
      details.rollStr,
      details.yVarCnt,
      0,
    ])
    .catch((e0) => {
      utils.commonLoggers.dbError('clone.ts:110', 'query', e0);
      utils.sendOrInteract(
        msgOrInt,
        'clone.ts:126',
        generateAliasError(
          'DB Insert Failed.',
          `clone-q2-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
        ),
      );
      errorOut = true;
    });
  if (errorOut) return;

  utils.sendOrInteract(msgOrInt, 'clone.ts:137', {
    embeds: [
      {
        color: successColor,
        title: `Successfully copied the ${guildMode ? 'guild' : 'personal'} alias \`${aliasName}\`!`,
        description: `\`${aliasName}\` is now available as an alias ${guildMode ? 'on your account' : 'in this guild'}.`,
      },
    ],
  });
};
