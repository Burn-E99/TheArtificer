import { DiscordenoMessage, hasGuildPermissions } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';

import { generateAliasError } from 'embeds/alias.ts';
import { failColor, successColor } from 'embeds/colors.ts';

import { SlashCommandInteractionWithGuildId } from 'src/mod.d.ts';

import utils from 'utils/utils.ts';

interface QueryShape {
  aliasName: string;
}

export const rename = async (msgOrInt: DiscordenoMessage | SlashCommandInteractionWithGuildId, guildMode: boolean, argSpaces: string[]) => {
  if (guildMode && !(await hasGuildPermissions(BigInt(msgOrInt.guildId), utils.getAuthorIdFromMessageOrInteraction(msgOrInt), ['ADMINISTRATOR']))) {
    utils.sendOrInteract(msgOrInt, 'rename.ts:20', {
      embeds: [
        {
          color: failColor,
          title: `Error: Only Guild Owners and Admins can rename a guild aliases`,
        },
      ],
    });
    return;
  }

  const oldAliasName = (argSpaces.shift() || '').trim().toLowerCase();
  argSpaces.shift();
  const newAliasName = (argSpaces.shift() || '').trim().toLowerCase();

  if (!oldAliasName || !newAliasName) {
    utils.sendOrInteract(msgOrInt, 'rename.ts:37', {
      embeds: [
        {
          color: failColor,
          title: `Error: Please specify both an alias to rename, and the new name to set it to.`,
        },
      ],
    });
    return;
  }

  // make sure old alias exists, and new doesn't exist first
  let errorOut = false;
  const queryOld: QueryShape[] = await dbClient
    .query(
      `SELECT aliasName FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?`,
      guildMode ? [BigInt(msgOrInt.guildId), 0n, oldAliasName] : [0n, utils.getAuthorIdFromMessageOrInteraction(msgOrInt), oldAliasName],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('rename.ts:44', 'query', e0);
      utils.sendOrInteract(
        msgOrInt,
        'rename.ts:58',
        generateAliasError(
          'DB Query Failed.',
          `rename-q0-${guildMode ? 't' : 'f'}-${oldAliasName}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
        ),
      );
      errorOut = true;
    });
  if (errorOut) return;

  if (!queryOld.length) {
    utils.sendOrInteract(msgOrInt, 'rename.ts:70', {
      embeds: [
        {
          color: failColor,
          title: `Error: \`${oldAliasName}\` does not exist as a ${guildMode ? 'guild' : 'personal'} alias.`,
          description: `If you are trying to update an existing alias, but forgot the name, please run the following command to view all your ${guildMode ? 'guild ' : ''}aliases:
\`${config.prefix}ra ${guildMode ? 'guild ' : ''}list\``,
        },
      ],
    });
    return;
  }

  const queryNew: QueryShape[] = await dbClient
    .query(
      `SELECT aliasName FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?`,
      guildMode ? [BigInt(msgOrInt.guildId), 0n, newAliasName] : [0n, utils.getAuthorIdFromMessageOrInteraction(msgOrInt), newAliasName],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('rename.ts:44', 'query', e0);
      utils.sendOrInteract(
        msgOrInt,
        'rename.ts:91',
        generateAliasError(
          'DB Query Failed.',
          `rename-q1-${guildMode ? 't' : 'f'}-${newAliasName}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
        ),
      );
      errorOut = true;
    });
  if (errorOut) return;

  if (queryNew.length) {
    utils.sendOrInteract(msgOrInt, 'rename.ts:103', {
      embeds: [
        {
          color: failColor,
          title: `Error: \`${newAliasName}\` already exists as a ${guildMode ? 'guild' : 'personal'} alias.`,
          description: 'Please choose a different name for this alias.',
        },
      ],
    });
    return;
  }

  // do the rename
  await dbClient
    .execute('UPDATE aliases SET aliasName = ? WHERE guildid = ? AND userid = ? AND aliasName = ?', [
      newAliasName,
      guildMode ? BigInt(msgOrInt.guildId) : 0n,
      guildMode ? 0n : utils.getAuthorIdFromMessageOrInteraction(msgOrInt),
      oldAliasName,
    ])
    .catch((e0) => {
      utils.commonLoggers.dbError('rename.ts:169', 'update', e0);
      utils.sendOrInteract(
        msgOrInt,
        'rename.ts:126',
        generateAliasError(
          'DB Update Failed.',
          `rename-q2-${guildMode ? 't' : 'f'}-${oldAliasName}-${newAliasName}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
        ),
      );
      errorOut = true;
    });

  utils.sendOrInteract(msgOrInt, 'rename.ts:136', {
    embeds: [
      {
        color: successColor,
        title: `Successfully renamed the ${guildMode ? 'guild' : 'personal'} alias \`${oldAliasName}\` to \`${newAliasName}\`!`,
        description: `\`${newAliasName}\` is now available as an alias ${guildMode ? 'in this guild' : 'on your account'}.`,
      },
    ],
  });
};
