import { CreateGlobalApplicationCommand, DiscordApplicationCommandOptionTypes, DiscordenoMessage, hasGuildPermissions, Interaction } from '@discordeno';

import config from '~config';

import { generateHelpMessage } from 'commands/helpLibrary/generateHelpMessage.ts';

import dbClient from 'db/client.ts';
import { inlineList, queries } from 'db/common.ts';

import { failColor, infoColor1, successColor } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const toggleInlineSC: CreateGlobalApplicationCommand = {
  name: 'toggle-inline-rolls',
  description: 'Enable or disable inline rolling for this guild.',
  options: [
    {
      type: DiscordApplicationCommandOptionTypes.SubCommand,
      name: 'enable',
      description: 'Enables/Allows inline rolling in this guild.',
    },
    {
      type: DiscordApplicationCommandOptionTypes.SubCommand,
      name: 'disable',
      description: 'Disables/Blocks inline rolling in this guild.',
    },
    {
      type: DiscordApplicationCommandOptionTypes.SubCommand,
      name: 'status',
      description: 'Gets the current status of inline rolling for this guild.',
    },
    {
      type: DiscordApplicationCommandOptionTypes.SubCommand,
      name: 'help',
      description: 'Opens the help library to the Toggle Inline help page.',
    },
  ],
};

export const toggleInline = async (msgOrInt: DiscordenoMessage | Interaction, args: string[]) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('inline')).catch((e) => utils.commonLoggers.dbError('toggleInline.ts:16', 'call sproc INC_CNT on', e));

  // Local inlineArg in lowercase
  const inlineArg = (args[0] || '').toLowerCase();

  const guildId = BigInt(msgOrInt.guildId ?? '0');

  // Alert users who DM the bot that this command is for guilds only
  if (guildId === 0n) {
    utils.sendOrInteract(msgOrInt, 'toggleInline.ts:45', {
      embeds: [
        {
          color: failColor,
          title: 'Toggle Inline commands are only available in guilds.',
        },
      ],
    });
    return;
  }

  let errorOut = false;
  const guildQuery = await dbClient.query(`SELECT guildid FROM allow_inline WHERE guildid = ?`, [guildId]).catch((e0) => {
    utils.commonLoggers.dbError('toggleInline.ts:36', 'query', e0);
    utils.sendOrInteract(msgOrInt, 'toggleInline.ts:59', {
      embeds: [
        {
          color: failColor,
          title: 'Failed to check Inline roll status for this guild.',
          description: 'If this issue persists, please report this to the developers.',
        },
      ],
    });
    errorOut = true;
  });
  if (errorOut) return;

  if (await hasGuildPermissions(guildId, utils.getAuthorIdFromMessageOrInteraction(msgOrInt), ['ADMINISTRATOR'])) {
    let enable = false;
    switch (inlineArg) {
      case 'allow':
      case 'enable':
        enable = true;
        if (!inlineList.includes(guildId)) {
          await dbClient.execute('INSERT INTO allow_inline(guildid) values(?)', [guildId]).catch((e) => {
            utils.commonLoggers.dbError('toggleInline.ts:58', 'insert into allow_inline', e);
            errorOut = true;
          });
          if (!errorOut) {
            inlineList.push(guildId);
          }
        }
        break;
      case 'block':
      case 'disable':
      case 'delete':
        await dbClient.execute('DELETE FROM allow_inline WHERE guildid = ?', [guildId]).catch((e) => {
          utils.commonLoggers.dbError('toggleInline.ts:65', 'delete from allow_inline', e);
          errorOut = true;
        });
        if (!errorOut && inlineList.includes(guildId)) {
          inlineList.splice(inlineList.indexOf(guildId), 1);
        }
        break;
      case 'status':
        utils.sendOrInteract(msgOrInt, 'toggleInline.ts:98', {
          embeds: [
            {
              color: infoColor1,
              title: `Inline Rolls are ${guildQuery.length ? 'Enabled' : 'Disabled'} for this guild`,
              description: `To ${guildQuery.length ? 'disable' : 'enable'} them, run the following command:\n\`${config.prefix}inline ${guildQuery.length ? 'disable' : 'enable'}\``,
            },
          ],
        });
        return;
      case 'h':
      case 'help':
      default:
        utils.sendOrInteract(msgOrInt, 'toggleInline.ts:113', generateHelpMessage('inline'));
        return;
    }
    if (errorOut) {
      utils.sendOrInteract(msgOrInt, 'toggleInline.ts:117', {
        embeds: [
          {
            color: failColor,
            title: `Failed to ${enable ? 'Enable' : 'Disable'} Inline Rolls for this guild`,
            description: 'Please try the command again.  If this issue persists, please report this to the developers.',
          },
        ],
      });
      return;
    }
    utils.sendOrInteract(msgOrInt, 'toggleInline.ts:128', {
      embeds: [
        {
          color: successColor,
          title: `Successfully ${enable ? 'Enabled' : 'Disabled'} Inline Rolls for this guild`,
        },
      ],
    });
  } else {
    utils.sendOrInteract(msgOrInt, 'toggleInline.ts:137', {
      embeds: [
        {
          color: failColor,
          title: 'Toggle Inline commands are powerful and can only be used by guild Owners and Admins.',
        },
      ],
    });
  }
};
