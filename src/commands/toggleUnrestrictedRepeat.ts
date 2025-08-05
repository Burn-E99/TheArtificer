import { CreateGlobalApplicationCommand, DiscordApplicationCommandOptionTypes, DiscordenoMessage, hasGuildPermissions, Interaction } from '@discordeno';

import config from '~config';

import { generateHelpMessage } from 'commands/helpLibrary/generateHelpMessage.ts';

import dbClient from 'db/client.ts';
import { queries, repeatList } from 'db/common.ts';

import { failColor, infoColor1, successColor } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const toggleRepeatSC: CreateGlobalApplicationCommand = {
  name: 'toggle-unrestricted-repeat',
  description: 'Enable or disable unrestricted repeat rolling for this guild.',
  options: [
    {
      type: DiscordApplicationCommandOptionTypes.SubCommand,
      name: 'enable',
      description: 'Enables/Allows unrestricted repeat rolling in this guild.',
    },
    {
      type: DiscordApplicationCommandOptionTypes.SubCommand,
      name: 'disable',
      description: 'Disables/Blocks unrestricted repeat rolling in this guild.',
    },
    {
      type: DiscordApplicationCommandOptionTypes.SubCommand,
      name: 'status',
      description: 'Gets the current status of repeat rolling for this guild.',
    },
    {
      type: DiscordApplicationCommandOptionTypes.SubCommand,
      name: 'help',
      description: 'Opens the help library to the Toggle Repeat help page.',
    },
  ],
};

export const toggleRepeat = async (msgOrInt: DiscordenoMessage | Interaction, args: string[]) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('repeat')).catch((e) => utils.commonLoggers.dbError('toggleRepeat.ts:16', 'call sproc INC_CNT on', e));

  // Local repeatArg in lowercase
  const repeatArg = (args[0] || '').toLowerCase();

  const guildId = BigInt(msgOrInt.guildId ?? '0');

  // Alert users who DM the bot that this command is for guilds only
  if (guildId === 0n) {
    utils.sendOrInteract(msgOrInt, 'toggleRepeat.ts:45', {
      embeds: [
        {
          color: failColor,
          title: 'Toggle Repeat commands are only available in guilds.',
        },
      ],
    });
    return;
  }

  let errorOut = false;
  const guildQuery = await dbClient.query(`SELECT guildid FROM allow_unrestricted_repeat WHERE guildid = ?`, [guildId]).catch((e0) => {
    utils.commonLoggers.dbError('toggleRepeat.ts:36', 'query', e0);
    utils.sendOrInteract(msgOrInt, 'toggleRepeat.ts:59', {
      embeds: [
        {
          color: failColor,
          title: 'Failed to check Unrestricted Repeat status for this guild.',
          description: 'If this issue persists, please report this to the developers.',
        },
      ],
    });
    errorOut = true;
  });
  if (errorOut) return;

  if (await hasGuildPermissions(guildId, utils.getAuthorIdFromMessageOrInteraction(msgOrInt), ['ADMINISTRATOR'])) {
    let enable = false;
    switch (repeatArg) {
      case 'allow':
      case 'enable':
        enable = true;
        if (!repeatList.includes(guildId)) {
          await dbClient.execute('INSERT INTO allow_unrestricted_repeat(guildid) values(?)', [guildId]).catch((e) => {
            utils.commonLoggers.dbError('toggleRepeat.ts:58', 'insert into allow_unrestricted_repeat', e);
            errorOut = true;
          });
          if (!errorOut) {
            repeatList.push(guildId);
          }
        }
        break;
      case 'block':
      case 'disable':
      case 'delete':
        await dbClient.execute('DELETE FROM allow_unrestricted_repeat WHERE guildid = ?', [guildId]).catch((e) => {
          utils.commonLoggers.dbError('toggleRepeat.ts:65', 'delete from allow_unrestricted_repeat', e);
          errorOut = true;
        });
        if (!errorOut && repeatList.includes(guildId)) {
          repeatList.splice(repeatList.indexOf(guildId), 1);
        }
        break;
      case 'status':
        utils.sendOrInteract(msgOrInt, 'toggleRepeat.ts:98', {
          embeds: [
            {
              color: infoColor1,
              title: `Unrestricted Repeat is ${guildQuery.length ? 'Enabled' : 'Disabled'} for this guild`,
              description: `This means ${guildQuery.length ? 'anyone' : 'only the original roller'} can use the \`Repeat Roll\` button.
              
To ${guildQuery.length ? 'disable' : 'enable'} it, run the following command:\n\`${config.prefix}repeat ${guildQuery.length ? 'disable' : 'enable'}\``,
            },
          ],
        });
        return;
      case 'h':
      case 'help':
      default:
        utils.sendOrInteract(msgOrInt, 'toggleRepeat.ts:113', generateHelpMessage('repeat'));
        return;
    }
    if (errorOut) {
      utils.sendOrInteract(msgOrInt, 'toggleRepeat.ts:117', {
        embeds: [
          {
            color: failColor,
            title: `Failed to ${enable ? 'Enable' : 'Disable'} Unrestricted Repeat for this guild`,
            description: 'Please try the command again.  If this issue persists, please report this to the developers.',
          },
        ],
      });
      return;
    }
    utils.sendOrInteract(msgOrInt, 'toggleRepeat.ts:128', {
      embeds: [
        {
          color: successColor,
          title: `Successfully ${enable ? 'Enabled' : 'Disabled'} Unrestricted Repeat for this guild`,
          description: `${enable ? 'Anyone' : 'Only the original roller'} may now use the \`Repeat Roll\` button.`,
        },
      ],
    });
  } else {
    utils.sendOrInteract(msgOrInt, 'toggleRepeat.ts:137', {
      embeds: [
        {
          color: failColor,
          title: 'Toggle Unrestricted Repeat commands are powerful and can only be used by guild Owners and Admins.',
        },
      ],
    });
  }
};
