import { ApplicationCommandOption, CreateGlobalApplicationCommand, DiscordApplicationCommandOptionTypes, DiscordenoMessage } from '@discordeno';

import aliasCommands from 'commands/aliasCmd/_index.ts';

import { generateHelpMessage } from 'commands/helpLibrary/generateHelpMessage.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { failColor } from 'embeds/colors.ts';

import { SlashCommandInteractionWithGuildId } from 'src/mod.d.ts';

import utils from 'utils/utils.ts';

const aliasNameOption = (action: string, rename = false): ApplicationCommandOption => ({
  type: DiscordApplicationCommandOptionTypes.String,
  name: `alias-name${rename ? '-new' : ''}`,
  description: `The ${rename ? 'new ' : ''}name of the alias${rename ? '' : `you wish to ${action}`}.`,
  required: true,
});

const rollStringOption = (action: string): ApplicationCommandOption => ({
  type: DiscordApplicationCommandOptionTypes.String,
  name: 'roll-string',
  description: `The the full roll string to ${action}.`,
  required: true,
});

const verificationCodeOption: ApplicationCommandOption = {
  type: DiscordApplicationCommandOptionTypes.String,
  name: 'verification-code',
  description: 'The four digit confirmation code for deletion. Can be left blank to generate one.',
  required: false,
};

const aliasOptions = (guildMode: boolean): ApplicationCommandOption[] => [
  {
    type: DiscordApplicationCommandOptionTypes.SubCommand,
    name: 'help',
    description: `Opens the help library to the ${guildMode ? 'Guild' : 'Personal'} Mode Alias System section.`,
  },
  {
    type: DiscordApplicationCommandOptionTypes.SubCommand,
    name: 'list-all',
    description: `List all available aliases ${guildMode ? 'in this Guild' : 'on your account'}.`,
  },
  {
    type: DiscordApplicationCommandOptionTypes.SubCommand,
    name: 'view',
    description: `Preview the roll string behind an alias ${guildMode ? 'in this Guild' : 'on your account'}.`,
    options: [aliasNameOption('view')],
  },
  {
    type: DiscordApplicationCommandOptionTypes.SubCommand,
    name: 'create',
    description: `Create a new alias ${guildMode ? 'in this Guild' : 'on your account'}.`,
    options: [aliasNameOption('create'), rollStringOption('create')],
  },
  {
    type: DiscordApplicationCommandOptionTypes.SubCommand,
    name: 'replace',
    description: `Update an alias ${guildMode ? 'in this Guild' : 'on your account'} with a new roll string.`,
    options: [aliasNameOption('replace'), rollStringOption('replace the old one with')],
  },
  {
    type: DiscordApplicationCommandOptionTypes.SubCommand,
    name: 'rename',
    description: `Rename an alias ${guildMode ? 'in this Guild' : 'on your account'}.`,
    options: [aliasNameOption('rename'), aliasNameOption('rename', true)],
  },
  {
    type: DiscordApplicationCommandOptionTypes.SubCommand,
    name: 'delete-one',
    description: `Delete an alias from ${guildMode ? 'this Guild' : 'your account'}.`,
    options: [aliasNameOption('delete'), verificationCodeOption],
  },
  {
    type: DiscordApplicationCommandOptionTypes.SubCommand,
    name: 'delete-all',
    description: `Delete all aliases from ${guildMode ? 'this Guild' : 'your account'}.`,
    options: [verificationCodeOption],
  },
  {
    type: DiscordApplicationCommandOptionTypes.SubCommand,
    name: 'copy',
    description: `Copy an alias from ${guildMode ? 'this Guild' : 'your account'} to ${guildMode ? 'your account' : 'this Guild'}.`,
    options: [aliasNameOption(`copy to ${guildMode ? 'your personal account' : 'this guild'}`)],
  },
  {
    type: DiscordApplicationCommandOptionTypes.SubCommand,
    name: 'run',
    description: `Runs the specified ${guildMode ? 'Guild' : 'Personal'} alias.`,
    options: [
      aliasNameOption('run'),
      {
        type: DiscordApplicationCommandOptionTypes.String,
        name: 'y-variables',
        description: 'A space separated list of numbers. Can be left blank if an alias does not require any.',
        required: false,
      },
    ],
  },
];

export const aliasSC: CreateGlobalApplicationCommand = {
  name: 'alias',
  description: 'Custom Roll Alias system, create and use Roll Aliases for easily reusing the same rolls.',
  options: [
    {
      type: DiscordApplicationCommandOptionTypes.SubCommandGroup,
      name: 'personal',
      description: 'Manage and run Personal aliases.',
      options: aliasOptions(false),
    },
    {
      type: DiscordApplicationCommandOptionTypes.SubCommandGroup,
      name: 'guild',
      description: 'Manage and run Guild aliases.',
      options: aliasOptions(true),
    },
  ],
};

export const alias = (msgOrInt: DiscordenoMessage | SlashCommandInteractionWithGuildId, argSpaces: string[]) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('alias')).catch((e) => utils.commonLoggers.dbError('aliasCmd.ts:125', 'call sproc INC_CNT on', e));

  // argSpaces will come in with a space or \n before every real arg, so extra shifts exist to remove them
  argSpaces.shift();
  let aliasArg = (argSpaces.shift() || '').toLowerCase().trim();
  argSpaces.shift();

  let guildMode = false;
  if (aliasArg === 'guild') {
    guildMode = true;
    aliasArg = (argSpaces.shift() || '').toLowerCase().trim();
    argSpaces.shift();
  }

  if (guildMode && BigInt(msgOrInt.guildId) === 0n) {
    utils.sendOrInteract(msgOrInt, 'aliasCmd.ts:140', {
      embeds: [
        {
          color: failColor,
          title: 'Guild Aliases can only be modified from within the desired guild.',
        },
      ],
    });
    return;
  }

  switch (aliasArg) {
    case 'help':
    case 'h':
    case '?':
    case '':
      utils.sendOrInteract(msgOrInt, 'aliasCmd.ts:156', generateHelpMessage('alias'));
      break;
    case 'list':
    case 'list-all':
      aliasCommands.list(msgOrInt, guildMode);
      break;
    case 'add':
    case 'create':
    case 'set':
      aliasCommands.add(msgOrInt, guildMode, argSpaces);
      break;
    case 'update':
    case 'replace':
      aliasCommands.update(msgOrInt, guildMode, argSpaces);
      break;
    case 'preview':
    case 'view':
      aliasCommands.view(msgOrInt, guildMode, argSpaces);
      break;
    case 'delete':
    case 'remove':
    case 'delete-one':
      aliasCommands.deleteOne(msgOrInt, guildMode, argSpaces);
      break;
    case 'delete-all':
    case 'remove-all':
      aliasCommands.deleteAll(msgOrInt, guildMode, argSpaces);
      break;
    case 'clone':
    case 'copy':
      aliasCommands.clone(msgOrInt, guildMode, argSpaces);
      break;
    case 'rename':
      aliasCommands.rename(msgOrInt, guildMode, argSpaces);
      break;
    case 'run':
    case 'execute':
    default:
      aliasCommands.run(msgOrInt, guildMode, aliasArg, argSpaces);
      break;
  }
};
