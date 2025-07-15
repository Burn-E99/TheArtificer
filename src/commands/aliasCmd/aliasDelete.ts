import { DiscordenoMessage, hasGuildPermissions } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';

import { generateAliasError } from 'embeds/alias.ts';
import { failColor, successColor, warnColor } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

const handleDelete = async (message: DiscordenoMessage, guildMode: boolean, argSpaces: string[], deleteAll: boolean) => {
  if (guildMode && !(await hasGuildPermissions(message.guildId, message.authorId, ['ADMINISTRATOR']))) {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: 'Error: Only Guild Owners and Admins can delete guild aliases',
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('aliasDelete.ts:16', message, e));
    return;
  }

  const verificationCode = (guildMode ? message.guildId : message.authorId).toString().slice(-4);
  const aliasName = (argSpaces.shift() || '').trim();
  argSpaces.shift();
  const userEnteredVCode = (argSpaces.shift() || '').trim();
  let errorOut = false;

  if (!deleteAll) {
    if (!aliasName) {
      message
        .send({
          embeds: [
            {
              color: failColor,
              title: 'Error: Please specify one alias to delete',
            },
          ],
        })
        .catch((e: Error) => utils.commonLoggers.messageSendError('aliasDelete.ts:38', message, e));
      return;
    } else if (!userEnteredVCode) {
      message
        .send({
          embeds: [
            {
              color: warnColor,
              title: `Deletion is permanent, please confirm you want to delete \`${aliasName}\``,
              description: `Are you sure you want to delete the ${guildMode ? 'guild' : 'personal'} alias \`${aliasName}\`?

If you are certain you want to delete \`${aliasName}\` from ${guildMode ? 'this guild' : 'your account'}, please run the following command:
\`${config.prefix}ra ${guildMode ? 'guild ' : ''}delete ${aliasName} ${verificationCode}\``,
            },
          ],
        })
        .catch((e: Error) => utils.commonLoggers.messageSendError('aliasDelete.ts:54', message, e));
      return;
    } else if (userEnteredVCode !== verificationCode) {
      message
        .send({
          embeds: [
            {
              color: failColor,
              title: 'Error: Incorrect verification code',
              description: `If you are certain you want to delete \`${aliasName}\` from ${guildMode ? 'this guild' : 'your account'}, please run the following command:
\`${config.prefix}ra ${guildMode ? 'guild ' : ''}delete ${aliasName} ${verificationCode}\``,
            },
          ],
        })
        .catch((e: Error) => utils.commonLoggers.messageSendError('aliasDelete.ts:70', message, e));
      return;
    } else if (userEnteredVCode === verificationCode) {
      const deleteResults = await dbClient
        .execute('DELETE FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?', [
          guildMode ? message.guildId : 0n,
          guildMode ? 0n : message.authorId,
          aliasName,
        ])
        .catch((e) => {
          utils.commonLoggers.dbError('aliasDelete.ts:76', 'delete from aliases', e);
          errorOut = true;
        });
      if (errorOut || !deleteResults) {
        message
          .send(generateAliasError('Delete failed.', `delete-q0-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? message.guildId : message.authorId}`))
          .catch((e: Error) => utils.commonLoggers.messageSendError('aliasDelete.ts:86', message, e));
        return;
      } else if (deleteResults.affectedRows) {
        message.send({
          embeds: [
            {
              color: successColor,
              title: 'Alias Deleted Successfully',
              description: `The ${guildMode ? 'guild' : 'personal'} alias named \`${aliasName}\` was successfully deleted.`,
            },
          ],
        });
      } else {
        message.send({
          embeds: [
            {
              color: warnColor,
              title: 'Nothing deleted',
              description: `Looks like you${guildMode ? "r guild doesn't" : " don't"} have an alias named \`${aliasName}\`.

Please run \`${config.prefix}ra ${guildMode ? 'guild ' : ''}list\` to view the current aliases for ${guildMode ? 'this guild' : 'your account'}.`,
            },
          ],
        });
      }
      return;
    } else {
      message
        .send(generateAliasError('How are you here?', 'deleteOne-how'))
        .catch((e: Error) => utils.commonLoggers.messageSendError('aliasDelete.ts:117', message, e));
      return;
    }
  } else {
    // We're in deleteAll mode, so aliasName will carry the user verification code.
    // Since one wasn't provided, prompt for confirmation
    if (!aliasName) {
      message
        .send({
          embeds: [
            {
              color: warnColor,
              title: 'Deletion is permanent, please confirm you want to delete all aliases',
              description: `Are you sure you want to delete all aliases for ${guildMode ? 'this guild' : 'your account'}?

If you are certain you want to delete all aliases for ${guildMode ? 'this guild' : 'your account'}, please run the following command:
\`${config.prefix}ra ${guildMode ? 'guild ' : ''}delete-all ${verificationCode}\``,
            },
          ],
        })
        .catch((e: Error) => utils.commonLoggers.messageSendError('aliasDelete.ts:137', message, e));
      return;
    } else if (aliasName !== verificationCode) {
      message
        .send({
          embeds: [
            {
              color: failColor,
              title: 'Error: Incorrect verification code',
              description: `If you are certain you want to delete all aliases for ${guildMode ? 'this guild' : 'your account'}, please run the following command:
\`${config.prefix}ra ${guildMode ? 'guild ' : ''}delete-all ${verificationCode}\``,
            },
          ],
        })
        .catch((e: Error) => utils.commonLoggers.messageSendError('aliasDelete.ts:70', message, e));
      return;
    } else if (aliasName === verificationCode) {
      const deleteResults = await dbClient
        .execute('DELETE FROM aliases WHERE guildid = ? AND userid = ?', [guildMode ? message.guildId : 0n, guildMode ? 0n : message.authorId])
        .catch((e) => {
          utils.commonLoggers.dbError('aliasDelete.ts:159', 'delete from aliases', e);
          errorOut = true;
        });
      if (errorOut || !deleteResults) {
        message
          .send(generateAliasError('Delete failed.', `delete-q1-${guildMode ? 't' : 'f'}-${guildMode ? message.guildId : message.authorId}`))
          .catch((e: Error) => utils.commonLoggers.messageSendError('aliasDelete.ts:165', message, e));
        return;
      } else if (deleteResults.affectedRows) {
        message.send({
          embeds: [
            {
              color: successColor,
              title: 'All Aliases Deleted Successfully',
              description: `All ${guildMode ? 'guild' : 'personal'} aliases for ${guildMode ? 'this guild' : 'your account'} were successfully deleted.`,
            },
          ],
        });
      } else {
        message.send({
          embeds: [
            {
              color: warnColor,
              title: 'Nothing deleted',
              description: `Looks like you${guildMode ? "r guild doesn't" : " don't"} have any aliases to delete.

Please run \`${config.prefix}ra ${guildMode ? 'guild ' : ''}list\` to view the current aliases for ${guildMode ? 'this guild' : 'your account'}.
If anything shows up there after running this command, please \`${config.prefix}report\` this to the developer.`,
            },
          ],
        });
      }
      return;
    } else {
      message
        .send(generateAliasError('How are you here?', 'deleteAll-how'))
        .catch((e: Error) => utils.commonLoggers.messageSendError('aliasDelete.ts:194', message, e));
      return;
    }
  }
};

// Using wrappers to limit "magic" booleans
export const deleteOne = (message: DiscordenoMessage, guildMode: boolean, argSpaces: string[]) => handleDelete(message, guildMode, argSpaces, false);
export const deleteAll = (message: DiscordenoMessage, guildMode: boolean, argSpaces: string[]) => handleDelete(message, guildMode, argSpaces, true);
