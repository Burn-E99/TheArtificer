import { DiscordenoMessage, hasGuildPermissions } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';

import { generateAliasError } from 'embeds/alias.ts';
import { failColor, successColor } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

interface QueryShape {
  aliasName: string;
  yVarCnt: number;
  rollStr: string;
}

export const clone = async (message: DiscordenoMessage, guildMode: boolean, argSpaces: string[]) => {
  if (!guildMode && !(await hasGuildPermissions(message.authorId, message.guildId, ['ADMINISTRATOR']))) {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: `Error: Only Guild Owners and Admins can copy a personal alias to a guild aliases`,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('clone.ts:16', message, e));
    return;
  }

  const aliasName = (argSpaces.shift() || '').trim().toLowerCase();

  if (!aliasName) {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: `Error: Please specify an alias to copy to ${guildMode ? 'your account' : 'this guild'}`,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('clone.ts:32', message, e));
    return;
  }

  let errorOut = false;
  const query: QueryShape[] = await dbClient
    .query(
      `SELECT aliasName, yVarCnt, rollStr FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?`,
      guildMode ? [message.guildId, 0n, aliasName] : [0n, message.authorId, aliasName],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('clone.ts:51', 'query', e0);
      message
        .send(generateAliasError('DB Query Failed.', `clone-q0-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? message.guildId : message.authorId}`))
        .catch((e: Error) => utils.commonLoggers.messageSendError('clone.ts:54', message, e));
      errorOut = true;
    });
  if (errorOut) return;

  const details = query[0];

  if (!details) {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: `\`${aliasName}\` does not exist as a${guildMode ? ' guild alias' : 'n alias on your account'}.`,
            description: `Did you mean to run \`${config.prefix}ra ${guildMode ? '' : 'guild '}clone ${aliasName}\`?`,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('clone.ts:73', message, e));
  }

  const targetQuery: QueryShape[] = await dbClient
    .query(
      `SELECT aliasName, yVarCnt, rollStr FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?`,
      guildMode ? [0n, message.authorId, aliasName] : [message.guildId, 0n, aliasName],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('clone.ts:82', 'query', e0);
      message
        .send(generateAliasError('DB Query Failed.', `clone-q1-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? message.guildId : message.authorId}`))
        .catch((e: Error) => utils.commonLoggers.messageSendError('clone.ts:85', message, e));
      errorOut = true;
    });
  if (errorOut) return;

  if (targetQuery.length) {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: `\`${aliasName}\` already exists as an alias ${guildMode ? 'on your account' : 'in this guild'}.`,
            description: `Please delete or rename the ${guildMode ? 'personal' : 'guild'} alias \`${aliasName}\` and try again.`,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('clone.ts:101', message, e));
    return;
  }

  await dbClient
    .execute(`INSERT INTO aliases(guildid,userid,aliasName,rollStr,yVarCnt,premium) values(?,?,?,?,?,?)`, [
      guildMode ? 0n : message.guildId,
      guildMode ? message.authorId : 0n,
      aliasName,
      details.rollStr,
      details.yVarCnt,
      0,
    ])
    .catch((e0) => {
      utils.commonLoggers.dbError('clone.ts:110', 'query', e0);
      message
        .send(generateAliasError('DB Insert Failed.', `clone-q2-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? message.guildId : message.authorId}`))
        .catch((e: Error) => utils.commonLoggers.messageSendError('clone.ts:113', message, e));
      errorOut = true;
    });
  if (errorOut) return;

  message
    .send({
      embeds: [
        {
          color: successColor,
          title: `Successfully copied the ${guildMode ? 'guild' : 'personal'} alias \`${aliasName}\`!`,
          description: `\`${aliasName}\` is now available as an alias ${guildMode ? 'on your account' : 'in this guild'}.`,
        },
      ],
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('clone.ts:132', message, e));
};
