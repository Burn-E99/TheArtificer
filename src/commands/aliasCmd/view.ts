import { DiscordenoMessage } from '@discordeno';

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

export const view = async (msgOrInt: DiscordenoMessage | SlashCommandInteractionWithGuildId, guildMode: boolean, argSpaces: string[]) => {
  const aliasName = argSpaces.shift();

  if (!aliasName) {
    utils.sendOrInteract(msgOrInt, 'view.ts:24', {
      embeds: [
        {
          color: failColor,
          title: 'No alias provided.',
          description: `Please run this command again with an alias to search for, for example

If you need to see all aliases for ${guildMode ? 'this guild' : 'your account'}, please run \`${config.prefix}ra ${guildMode ? 'guild ' : ''}list\` to see all of ${
            guildMode ? "this guild's" : 'your'
          } current aliases.`,
        },
      ],
    });
    return;
  }

  let errorOut = false;
  const query: QueryShape[] = await dbClient
    .query(
      `SELECT aliasName, yVarCnt, rollStr FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?`,
      guildMode ? [BigInt(msgOrInt.guildId), 0n, aliasName.toLowerCase()] : [0n, utils.getAuthorIdFromMessageOrInteraction(msgOrInt), aliasName.toLowerCase()],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('view.ts:46', 'query', e0);
      utils.sendOrInteract(
        msgOrInt,
        'view.ts:50',
        generateAliasError(
          'DB Query Failed.',
          `view-q0-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
        ),
      );
      errorOut = true;
    });
  if (errorOut) return;

  const details = query[0];

  if (details) {
    utils.sendOrInteract(msgOrInt, 'view.ts:63', {
      embeds: [
        {
          color: successColor,
          title: `Found the alias \`${aliasName}\` for ${guildMode ? 'this guild' : 'your account'}:`,
          description: `Y Var Count: \`${details.yVarCnt}\` Alias Name: \`${details.aliasName}\`
${details.rollStr}`,
        },
      ],
    });
  } else {
    utils.sendOrInteract(msgOrInt, 'view.ts:74', {
      embeds: [
        {
          color: failColor,
          title: `\`${aliasName}\` does not exist as a${guildMode ? ' guild alias' : 'n alias on your account'}.`,
          description: `Did you mean to run \`${config.prefix}ra ${guildMode ? '' : 'guild '}view ${aliasName}\`?`,
        },
      ],
    });
  }
};
