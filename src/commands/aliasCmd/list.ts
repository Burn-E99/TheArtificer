import { DiscordenoMessage } from '@discordeno';

import dbClient from 'db/client.ts';

import { generateAliasError } from 'embeds/alias.ts';
import { successColor } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

interface QueryShape {
  aliasName: string;
  yVarCnt: number;
}

export const list = async (message: DiscordenoMessage, guildMode: boolean) => {
  let errorOut = false;
  const query: QueryShape[] = await dbClient
    .query(
      `SELECT aliasName, yVarCnt FROM aliases WHERE guildid = ? AND userid = ? ORDER BY createdAt ASC`,
      guildMode ? [message.guildId, 0n] : [0n, message.authorId],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('list.ts:10', 'query', e0);
      message
        .send(generateAliasError('DB Query Failed.', `list-q0-${guildMode ? 't' : 'f'}-${guildMode ? message.guildId : message.authorId}`))
        .catch((e: Error) => utils.commonLoggers.messageSendError('list.ts:11', message, e));
      errorOut = true;
    });
  if (errorOut) return;

  message
    .send({
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
    })
    .catch((e0) => {
      utils.commonLoggers.messageSendError('list.ts:39', message, e0);
      message.send(generateAliasError('Message Send Failed.', `list-m0-${guildMode ? 't' : 'f'}-${guildMode ? message.guildId : message.authorId}`));
    });
};
