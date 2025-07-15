import config from '~config';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Inline Rolling';
const description =
  `${config.name} has an option to allow inline rolls in your guild.  An inline roll is a roll that does not immediately start with \`${config.prefix}\`, such as \`test ${config.prefix}d20${config.postfix}\`.

By default, Inline Rolls are blocked from being sent in your guild.  These commands may only be used by the Owner or Admins of your guild.`;
const dict = new Map<string, HelpContents>([
  [
    'status',
    {
      name: 'Status',
      description: `**Usage:** \`${config.prefix}inline status\`

Shows the current status of Inline Rolls for this guild.`,
    },
  ],
  [
    'enable',
    {
      name: 'Allow Inline Rolls',
      description: `**Usage:** \`${config.prefix}inline allow\` or \`${config.prefix}inline enable\`

Allows Inline Rolls for this guild.`,
    },
  ],
  [
    'disable',
    {
      name: 'Block Inline Rolls',
      description: `**Usage:** \`${config.prefix}inline block\` or \`${config.prefix}inline disable\` or \`${config.prefix}inline delete\`

Blocks inline rolls for this guild.`,
    },
  ],
  [
    'help',
    {
      name: 'Help',
      description: `**Usage:** \`${config.prefix}inline help\` or \`${config.prefix}inline h\`

Opens the help library to the Inline Help section.`,
    },
  ],
]);

export const InlineHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
