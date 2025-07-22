import { DiscordenoMessage, hasGuildPermissions } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';

import { generateAliasError } from 'embeds/alias.ts';
import { failColor, successColor, warnColor } from 'embeds/colors.ts';

import { SlashCommandInteractionWithGuildId } from 'src/mod.d.ts';

import utils from 'utils/utils.ts';

const handleDelete = async (msgOrInt: DiscordenoMessage | SlashCommandInteractionWithGuildId, guildMode: boolean, argSpaces: string[], deleteAll: boolean) => {
  if (guildMode && !(await hasGuildPermissions(BigInt(msgOrInt.guildId), utils.getAuthorIdFromMessageOrInteraction(msgOrInt), ['ADMINISTRATOR']))) {
    utils.sendOrInteract(msgOrInt, 'aliasDelete.ts:16', {
      embeds: [
        {
          color: failColor,
          title: 'Error: Only Guild Owners and Admins can delete guild aliases',
        },
      ],
    });
    return;
  }

  const verificationCode = (guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)).toString().slice(-4);
  const aliasName = (argSpaces.shift() || '').trim();
  argSpaces.shift();
  const userEnteredVCode = (argSpaces.shift() || '').trim();
  let errorOut = false;

  if (!deleteAll) {
    if (!aliasName) {
      utils.sendOrInteract(msgOrInt, 'aliasDelete.ts:36', {
        embeds: [
          {
            color: failColor,
            title: 'Error: Please specify one alias to delete',
          },
        ],
      });
      return;
    } else if (!userEnteredVCode) {
      utils.sendOrInteract(msgOrInt, 'aliasDelete.ts:47', {
        embeds: [
          {
            color: warnColor,
            title: `Deletion is permanent, please confirm you want to delete \`${aliasName}\``,
            description: `Are you sure you want to delete the ${guildMode ? 'guild' : 'personal'} alias \`${aliasName}\`?

If you are certain you want to delete \`${aliasName}\` from ${guildMode ? 'this guild' : 'your account'}, please run the following command:
\`${config.prefix}ra ${guildMode ? 'guild ' : ''}delete ${aliasName} ${verificationCode}\``,
          },
        ],
      });
      return;
    } else if (userEnteredVCode !== verificationCode) {
      utils.sendOrInteract(msgOrInt, 'aliasDelete.ts:62', {
        embeds: [
          {
            color: failColor,
            title: 'Error: Incorrect verification code',
            description: `If you are certain you want to delete \`${aliasName}\` from ${guildMode ? 'this guild' : 'your account'}, please run the following command:
\`${config.prefix}ra ${guildMode ? 'guild ' : ''}delete ${aliasName} ${verificationCode}\``,
          },
        ],
      });
      return;
    } else if (userEnteredVCode === verificationCode) {
      const deleteResults = await dbClient
        .execute('DELETE FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?', [
          guildMode ? BigInt(msgOrInt.guildId) : 0n,
          guildMode ? 0n : utils.getAuthorIdFromMessageOrInteraction(msgOrInt),
          aliasName,
        ])
        .catch((e) => {
          utils.commonLoggers.dbError('aliasDelete.ts:76', 'delete from aliases', e);
          errorOut = true;
        });
      if (errorOut || !deleteResults) {
        utils.sendOrInteract(
          msgOrInt,
          'aliasDelete.ts:86',
          generateAliasError(
            'Delete failed.',
            `delete-q0-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
          ),
        );
        return;
      } else if (deleteResults.affectedRows) {
        utils.sendOrInteract(msgOrInt, 'aliasDelete.ts:95', {
          embeds: [
            {
              color: successColor,
              title: 'Alias Deleted Successfully',
              description: `The ${guildMode ? 'guild' : 'personal'} alias named \`${aliasName}\` was successfully deleted.`,
            },
          ],
        });
      } else {
        utils.sendOrInteract(msgOrInt, 'aliasDelete.ts:105', {
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
      utils.sendOrInteract(msgOrInt, 'aliasDelete.ts:119', generateAliasError('How are you here?', 'deleteOne-how'));
      return;
    }
  } else {
    // We're in deleteAll mode, so aliasName will carry the user verification code.
    // Since one wasn't provided, prompt for confirmation
    if (!aliasName) {
      utils.sendOrInteract(msgOrInt, 'aliasDelete.ts:119', {
        embeds: [
          {
            color: warnColor,
            title: 'Deletion is permanent, please confirm you want to delete all aliases',
            description: `Are you sure you want to delete all aliases for ${guildMode ? 'this guild' : 'your account'}?

If you are certain you want to delete all aliases for ${guildMode ? 'this guild' : 'your account'}, please run the following command:
\`${config.prefix}ra ${guildMode ? 'guild ' : ''}delete-all ${verificationCode}\``,
          },
        ],
      });
      return;
    } else if (aliasName !== verificationCode) {
      utils.sendOrInteract(msgOrInt, 'aliasDelete.ts:142', {
        embeds: [
          {
            color: failColor,
            title: 'Error: Incorrect verification code',
            description: `If you are certain you want to delete all aliases for ${guildMode ? 'this guild' : 'your account'}, please run the following command:
\`${config.prefix}ra ${guildMode ? 'guild ' : ''}delete-all ${verificationCode}\``,
          },
        ],
      });
      return;
    } else if (aliasName === verificationCode) {
      const deleteResults = await dbClient
        .execute('DELETE FROM aliases WHERE guildid = ? AND userid = ?', [
          guildMode ? BigInt(msgOrInt.guildId) : 0n,
          guildMode ? 0n : utils.getAuthorIdFromMessageOrInteraction(msgOrInt),
        ])
        .catch((e) => {
          utils.commonLoggers.dbError('aliasDelete.ts:159', 'delete from aliases', e);
          errorOut = true;
        });
      if (errorOut || !deleteResults) {
        utils.sendOrInteract(
          msgOrInt,
          'aliasDelete.ts:165',
          generateAliasError(
            'Delete failed.',
            `delete-q1-${guildMode ? 't' : 'f'}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
          ),
        );
        return;
      } else if (deleteResults.affectedRows) {
        utils.sendOrInteract(msgOrInt, 'aliasDelete.ts:174', {
          embeds: [
            {
              color: successColor,
              title: 'All Aliases Deleted Successfully',
              description: `All ${guildMode ? 'guild' : 'personal'} aliases for ${guildMode ? 'this guild' : 'your account'} were successfully deleted.`,
            },
          ],
        });
      } else {
        utils.sendOrInteract(msgOrInt, 'aliasDelete.ts:184', {
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
      utils.sendOrInteract(msgOrInt, 'aliasDelete.ts:199', generateAliasError('How are you here?', 'deleteAll-how'));
      return;
    }
  }
};

// Using wrappers to limit "magic" booleans
export const deleteOne = (msgOrInt: DiscordenoMessage | SlashCommandInteractionWithGuildId, guildMode: boolean, argSpaces: string[]) => handleDelete(msgOrInt, guildMode, argSpaces, false);
export const deleteAll = (msgOrInt: DiscordenoMessage | SlashCommandInteractionWithGuildId, guildMode: boolean, argSpaces: string[]) => handleDelete(msgOrInt, guildMode, argSpaces, true);
