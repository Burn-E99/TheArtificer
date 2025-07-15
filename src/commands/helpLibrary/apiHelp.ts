import config from '~config';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'API Rolling';
const description =
  `${config.name} has a built in API that allows user to roll dice into Discord using third party programs.  By default, API rolls are blocked from being sent in your guild.  The API warning is also enabled by default.

These commands may only be used by the Owner or Admins of your guild.  You may enable and disable the API rolls for channels in your guild as needed.

For information on how to use the API, please check the GitHub README for more information [here](${config.links.sourceCode}).`;
const dict = new Map<string, HelpContents>([
  [
    'status',
    {
      name: 'Status',
      description: `**Usage:** \`${config.prefix}api status\`

Shows the current status of the API for the channel this was run in.`,
    },
  ],
  [
    'allow',
    {
      name: 'Allow API Rolls',
      description: `**Usage:** \`${config.prefix}api allow\` or \`${config.prefix}api enable\`

Allows API Rolls to be sent to the channel this command was run in.`,
    },
  ],
  [
    'block',
    {
      name: 'Block API Rolls',
      description: `**Usage:** \`${config.prefix}api block\` or \`${config.prefix}api disable\`

Blocks API Rolls from being sent to the channel this command was run in.`,
    },
  ],
  [
    'hide-warn',
    {
      name: 'Hide API Warning',
      description: `**Usage:** \`${config.prefix}api hide-warn\`

Hides the API warning on all rolls sent to the channel this command was run in.`,
    },
  ],
  [
    'show-warn',
    {
      name: 'Show API Warning',
      description: `**Usage:** \`${config.prefix}api show-warn\`

Shows the API warning on all rolls sent to the channel this command was run in`,
    },
  ],
  [
    'delete',
    {
      name: 'Delete API Settings',
      description: `**Usage:** \`${config.prefix}api delete\`

Deletes this channel's settings from ${config.name}'s database.`,
    },
  ],
  [
    'help',
    {
      name: 'Help',
      description: `**Usage:** \`${config.prefix}api help\` or \`${config.prefix}api h\`

Opens the help library to the Api Help section.`,
    },
  ],
]);

export const ApiHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
