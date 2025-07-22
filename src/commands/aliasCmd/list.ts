import { DiscordenoMessage } from '@discordeno';

import dbClient from 'db/client.ts';

import { generateAliasError } from 'embeds/alias.ts';
import { successColor } from 'embeds/colors.ts';

import { SlashCommandInteractionWithGuildId } from 'src/mod.d.ts';

import utils from 'utils/utils.ts';

interface QueryShape {
  aliasName: string;
  yVarCnt: number;
}

export const list = async (msgOrInt: DiscordenoMessage | SlashCommandInteractionWithGuildId, guildMode: boolean) => {
  let errorOut = false;
  const query: QueryShape[] = await dbClient
    .query(
      `SELECT aliasName, yVarCnt FROM aliases WHERE guildid = ? AND userid = ? ORDER BY createdAt ASC`,
      guildMode ? [BigInt(msgOrInt.guildId), 0n] : [0n, utils.getAuthorIdFromMessageOrInteraction(msgOrInt)],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('list.ts:10', 'query', e0);
      utils.sendOrInteract(
        msgOrInt,
        'list.ts:26',
        generateAliasError(
          'DB Query Failed.',
          `list-q0-${guildMode ? 't' : 'f'}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
        ),
      );
      errorOut = true;
    });
  if (errorOut) return;

  utils.sendOrInteract(msgOrInt, 'list.ts:33', {
    embeds: [
      {
        color: successColor,
        title: `Found ${query.length} alias${query.length === 1 ? '' : 'es'} for ${guildMode ? 'this guild' : 'your account'}:`,
        description: query.length
          ? `Format shown is \`alias-name\` followed by the number of yVars required for the alias in parenthesis, if there are any required.

${query.map((a) => `\`${a.aliasName}\`${a.yVarCnt ? ` (${a.yVarCnt})` : ''}`).join(', ')}`
          : '',
      },
    ],
  });
};
