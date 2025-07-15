import { DiscordenoMessage, hasGuildPermissions } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';

import { generateAliasError } from 'embeds/alias.ts';
import { failColor, successColor } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

interface QueryShape {
  aliasName: string;
}

export const rename = async (message: DiscordenoMessage, guildMode: boolean, argSpaces: string[]) => {
  if (guildMode && !(await hasGuildPermissions(message.guildId, message.authorId, ['ADMINISTRATOR']))) {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: `Error: Only Guild Owners and Admins can rename a guild aliases`,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('rename.ts:25', message, e));
    return;
  }

  const oldAliasName = (argSpaces.shift() || '').trim().toLowerCase();
  argSpaces.shift();
  const newAliasName = (argSpaces.shift() || '').trim().toLowerCase();

  if (!oldAliasName || !newAliasName) {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: `Error: Please specify both an alias to rename, and the new name to set it to.`,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('rename.ts:32', message, e));
    return;
  }

  // make sure old alias exists, and new doesn't exist first
  let errorOut = false;
  const queryOld: QueryShape[] = await dbClient
    .query(
      `SELECT aliasName FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?`,
      guildMode ? [message.guildId, 0n, oldAliasName] : [0n, message.authorId, oldAliasName],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('rename.ts:44', 'query', e0);
      message
        .send(generateAliasError('DB Query Failed.', `rename-q0-${guildMode ? 't' : 'f'}-${oldAliasName}-${guildMode ? message.guildId : message.authorId}`))
        .catch((e: Error) => utils.commonLoggers.messageSendError('rename.ts:47', message, e));
      errorOut = true;
    });
  if (errorOut) return;

  if (!queryOld.length) {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: `Error: \`${oldAliasName}\` does not exist as a ${guildMode ? 'guild' : 'personal'} alias.`,
            description: `If you are trying to update an existing alias, but forgot the name, please run the following command to view all your ${guildMode ? 'guild ' : ''}aliases:
\`${config.prefix}ra ${guildMode ? 'guild ' : ''}list\``,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('add.ts:63', message, e));
    return;
  }

  const queryNew: QueryShape[] = await dbClient
    .query(
      `SELECT aliasName FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?`,
      guildMode ? [message.guildId, 0n, newAliasName] : [0n, message.authorId, newAliasName],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('rename.ts:44', 'query', e0);
      message
        .send(generateAliasError('DB Query Failed.', `rename-q1-${guildMode ? 't' : 'f'}-${newAliasName}-${guildMode ? message.guildId : message.authorId}`))
        .catch((e: Error) => utils.commonLoggers.messageSendError('rename.ts:47', message, e));
      errorOut = true;
    });
  if (errorOut) return;

  if (queryNew.length) {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: `Error: \`${newAliasName}\` already exists as a ${guildMode ? 'guild' : 'personal'} alias.`,
            description: 'Please choose a different name for this alias.',
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('add.ts:63', message, e));
    return;
  }

  // do the rename
  await dbClient
    .execute('UPDATE aliases SET aliasName = ? WHERE guildid = ? AND userid = ? AND aliasName = ?', [
      newAliasName,
      guildMode ? message.guildId : 0n,
      guildMode ? 0n : message.authorId,
      oldAliasName,
    ])
    .catch((e0) => {
      utils.commonLoggers.dbError('rename.ts:169', 'update', e0);
      message
        .send(
          generateAliasError(
            'DB Update Failed.',
            `rename-q2-${guildMode ? 't' : 'f'}-${oldAliasName}-${newAliasName}-${guildMode ? message.guildId : message.authorId}`,
          ),
        )
        .catch((e: Error) => utils.commonLoggers.messageSendError('rename.ts:170', message, e));
      errorOut = true;
    });

  message
    .send({
      embeds: [
        {
          color: successColor,
          title: `Successfully renamed the ${guildMode ? 'guild' : 'personal'} alias \`${oldAliasName}\` to \`${newAliasName}\`!`,
          description: `\`${newAliasName}\` is now available as an alias ${guildMode ? 'in this guild' : 'on your account'}.`,
        },
      ],
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('rename.ts:132', message, e));
};
