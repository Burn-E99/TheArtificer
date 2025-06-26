import config from '~config';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Roll Command Decorators';
const description = `This command also has some useful decorators that can used.  These decorators simply need to be placed after all rolls in the message.

**Examples:** \`${config.prefix}d20${config.postfix} -nd\`, \`${config.prefix}d20${config.postfix} -nd -s\`, \`${config.prefix}d20${config.postfix} ${config.prefix}d20${config.postfix} ${config.prefix}d20${config.postfix} -o a\``;
const dict = new Map<string, HelpContents>([
  [
    '-nd',
    {
      name: 'No Details',
      description: `**Usage:** \`-nd\`

Hides some of the details of the requested roll, but will still show the list of roll results along with the formatted results.`,
      example: ['`[[2000d20]] -nd` => Limits the details shown to just be `[[2000d20]]` = **__20935__**'],
    },
  ],
  [
    '-snd',
    {
      name: 'Super No Details',
      description: `**Usage:** \`-snd\`

Suppresses all details of the requested roll.`,
      example: ['`[[2000d20]] -nd` => Removes the details section entirely'],
    },
  ],
  [
    '-s',
    {
      name: 'Spoiler',
      description: `**Usage:** \`-s\`

Spoilers all details of the requested roll`,
      example: ['`[[d20]] -s`'],
    },
  ],
  [
    '-max',
    {
      name: 'Maximize Roll',
      description: `**Usage:** \`-max\` or \`-m\`

Rolls the theoretical maximum roll.

**Notice:** Cannot be used with \`-n\`, \`-min\`, or \`-sn\``,
      example: ['`[[d20]] -max` => **20**'],
    },
  ],
  [
    '-min',
    {
      name: 'Minimize Roll',
      description: `**Usage:** \`-min\`

Rolls the theoretical minimum roll.

**Notice:** Cannot be used with \`-m\`, \`-max\`, \`-n\`, or \`-sn\``,
      example: ['`[[d20]] -min` => __1__'],
    },
  ],
  [
    '-n',
    {
      name: 'Nominal Roll',
      description: `**Usage:** \`-n\`

Rolls the theoretical nominal roll.

**Notice:** Cannot be used with \`-m\`, \`-max\`, \`-min\`, or \`-sn\``,
      example: ['`[[d20]] -n` => 10.5'],
    },
  ],
  [
    '-sn',
    {
      name: 'Simulated Nominal Roll',
      description: `**Usage:** \`-sn\`

Rolls the requests roll many times to approximately simulate the nominal of complex rolls, can specify the amount or accept default amount by not specify the amount.

**Notice:** Cannot be used with \`-m\`, \`-max\`, \`-min\`, \`-n\`, or \`-cc\``,
      example: ['`[[4d6d1]] -sn` => 12.274'],
    },
  ],
  [
    '-o',
    {
      name: 'Order Roll',
      description: `**Usage:** \`-o a\` or \`-o d\`
\`a\` - Ascending (least to greatest)
\`d\` - Descending (greatest to least)

Rolls the requested roll and orders the results in the requested direction.`,
      example: [
        '`[[4d6d1]] [[4d6d1]] [[4d6d1]] [[4d6d1]] -o a` => 9, __9__, 12, **15**',
        '`[[4d6d1]] [[4d6d1]] [[4d6d1]] [[4d6d1]] -o a` => **17**, 14, **13**, 9',
      ],
    },
  ],
  [
    '-c',
    {
      name: 'Count Rolls',
      description: `**Usage:** \`-c\`

Shows the Count Embed, containing the count of successful rolls, failed rolls, rerolls, drops, and explosions.`,
      example: ['`[[40d20]] -c`'],
    },
  ],
  [
    '-cc',
    {
      name: 'Confirm Critical Hits',
      description: `**Usage:** \`-cc\`

Automatically rerolls whenever a crit hits.

**Notice:** Cannot be used with \`-sn\``,
      example: ['`[[d20]] -cc` => **20** Auto-Confirming Crit: **20** Auto-Confirming Crit: 7'],
    },
  ],
  [
    '-ct',
    {
      name: 'Comma Totals',
      description: `**Usage:** \`-ct\`

Adds commas to totals for readability.`,
      example: ['`[[100d20]] -ct` => Shows **__1,110__** instead of **__1110__**'],
    },
  ],
  [
    '-gm',
    {
      name: 'GM Roll',
      description: `**Usage:** \`-gm @user1 @user2 ... @userN\`

Rolls the requested roll in GM mode, suppressing all publicly shown results/details and instead sending the results directly to the specified GMs.`,
      example: ['[[d20]] -gm @$'],
    },
  ],
  [
    '-hr',
    {
      name: 'Hide Raw',
      description: `**Usage:** \`-hr\`

Hide the raw input, showing only the results/details of the roll.`,
      example: ['`[[d20]] -hr`'],
    },
  ],
  [
    '-rd',
    {
      name: 'Roll Distribution',
      description: `**Usage:** \`-rd\`

Shows a raw roll distribution of all dice in roll.`,
      example: ['`[[1000d20]] -rd`'],
    },
  ],
  [
    '-nv',
    {
      name: 'Number Variables',
      description: `**Usage:** \`-nv\` or \`-vn\`

Mainly a debug decorator, useful when creating complex rolls that will be reused.  Will not number the final roll command in the list as it will not be available for use.`,
      example: ['`[[d20]] [[d20]] [[d20]] -vn`'],
    },
  ],
]);

export const DecoratorsHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
