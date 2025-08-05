import config from '~config';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Unrestricted Repeat';
const description = `${config.name} has an option to allow anyone to use the \`Repeat Roll\` button.

By default, Unrestricted Repeat Rolls are disabled in your guild, meaning only the original roller can use the \`Repeat Roll\` button.  These commands may only be used by the Owner or Admins of your guild.`;
const dict = new Map<string, HelpContents>([
  [
    'status',
    {
      name: 'Status',
      description: `**Usage:** \`${config.prefix}repeat status\`

Shows the current status of Repeat Rolling for this guild.`,
    },
  ],
  [
    'enable',
    {
      name: 'Allow Unrestricted Repeat',
      description: `**Usage:** \`${config.prefix}repeat allow\` or \`${config.prefix}repeat enable\`

Allows Unrestricted Repeat Rolls for this guild.  This allows anyone in the guild to use the \`Repeat Roll\` button on any roll from anyone.`,
    },
  ],
  [
    'disable',
    {
      name: 'Block Unrestricted Repeat',
      description: `**Usage:** \`${config.prefix}repeat block\` or \`${config.prefix}repeat disable\` or \`${config.prefix}repeat delete\`

Blocks Unrestricted Repeat rolls for this guild.  This only allows the original roller to use the \`Repeat Roll\` button.`,
    },
  ],
  [
    'help',
    {
      name: 'Help',
      description: `**Usage:** \`${config.prefix}repeat help\` or \`${config.prefix}repeat h\`

Opens the help library to the Unrestricted Repeat Help section.`,
    },
  ],
]);

export const RepeatHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
