import config from '~config';

import { RollAliasHelpPages } from 'commands/helpLibrary/aliasHelp.ts';
import { ApiHelpPages } from 'commands/helpLibrary/apiHelp.ts';
import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';
import { InlineHelpPages } from 'commands/helpLibrary/inlineHelp.ts';

import { RootRollHelpPages } from 'commands/helpLibrary/rollHelp/_rootRollHelp.ts';

const name = `${config.name}'s Help Library`;
const description = 'Please use the dropdown menus below to get help on any commands you need assistance with.';
const dict = new Map<string, HelpPage | HelpContents>([
  ['roll-help', RootRollHelpPages],
  ['alias', RollAliasHelpPages],
  ['inline', InlineHelpPages],
  [
    'opt-out',
    {
      name: 'Opt Out',
      description: `**Usage:** \`${config.prefix}opt-out\` or \`${config.prefix}ignore-me\`

Adds you to an ignore list so the bot will never respond to you.`,
    },
  ],
  [
    'opt-in',
    {
      name: 'Opt In',
      description: `**Usage:** \`${config.prefix}opt-in\`

Removes you from the ignore list.

**Notice:** This command is only available while Direct Messaging @$.`,
    },
  ],
  [
    'info',
    {
      name: 'Info/About',
      description: `**Usage:** \`${config.prefix}info\` or \`${config.prefix}i\`

Displays information about ${config.name} and its developer.`,
    },
  ],
  [
    'report',
    {
      name: 'Report an Issue',
      description: `**Usage:** \`${config.prefix}report [text]\` or \`${config.prefix}re [text]\`

Report an issue or feature request to ${config.name}'s developer.

**Notice:** \`[text]\` will be sent to a private Discord channel that only ${config.name} and its developer can see.`,
    },
  ],
  [
    'stats',
    {
      name: 'Statistics',
      description: `**Usage:** \`${config.prefix}stats\` or \`${config.prefix}s\`

Displays basic statistics on ${config.name}'s usage.`,
    },
  ],
  [
    'heatmap',
    {
      name: 'Roll Heatmap',
      description: `**Usage:** \`${config.prefix}heatmap\` or \`${config.prefix}hm\`

Displays a heatmap showing when rolls are happening across a week.`,
    },
  ],
  ['api', ApiHelpPages],
  [
    'version',
    {
      name: 'Version',
      description: `**Usage:** \`${config.prefix}version\` or \`${config.prefix}v\`

Displays the current version of ${config.name}.`,
    },
  ],
  [
    'privacy',
    {
      name: 'Privacy/Terms of Service',
      description: `**Usage:** \`${config.prefix}privacy\` or \`${config.prefix}tos\`

Displays a summary of the Privacy Policy and Terms of Service, along with links to the full documents.`,
    },
  ],
  [
    'ping',
    {
      name: 'Ping!',
      description: `**Usage:** \`${config.prefix}ping\`

Pings ${config.name} to see if its online and how responsive its connection to Discord's API is.`,
    },
  ],
  [
    'help',
    {
      name: 'Help',
      description: `**Usage:** \`${config.prefix}help\` or \`${config.prefix}h\` or \`${config.prefix}?\`

This command, opens an interactive help library for all commands.`,
    },
  ],
]);

export const RootHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
