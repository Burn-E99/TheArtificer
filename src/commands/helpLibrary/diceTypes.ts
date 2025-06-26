import config from '~config';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Custom Dice Shapes';
const description = `${config.name} supports also a couple other types of dice such as Fate or OVA dice.`;
const dict = new Map<string, HelpContents>([
  [
    'd20',
    {
      name: 'Roll20/Normal Dice',
      description: `**Usage:** \`${config.prefix}xdy${config.postfix}\`
\`x\` - Number of dice to roll, defaults to 1
\`y\` - Size of the die, required`,
      example: ['`[[d20]]` => [5] = 5', '`[[6d20]]` => [**20** + 16 + 17 + 19 + 10 + 15] = **97**'],
    },
  ],
  [
    'fate',
    {
      name: 'Fate Dice',
      description: `**Usage:** \`${config.prefix}xdF${config.postfix}\`
\`x\` - Number of Fate dice to roll, defaults to 1

Rolls a Fate die, has 6 sides with values \`[-1, -1, 0, 0, 1, 1]\`.`,
      example: ['`[[dF]]` => [**1**] = **1**', '`[[4dF]]` => [**1** + __-1__ + 0 + 0] = **__0__**'],
    },
  ],
  [
    'cwod',
    {
      name: 'CWOD Dice',
      description: `**Usage:** \`${config.prefix}xcwody${config.postfix}\`
\`x\` - Number of CWOD dice to roll, defaults to 1
\`y\` - Difficulty to roll at, defaults to 10

Rolls a specified number of 10 sided dice and counts successful and failed rolls.`,
      example: [
        '`[[cwod]]` => [3, 0 Successes, 0 Fails] = 0',
        '`[[4cwod]]` => [**10** + __1__ + 9 + __1__, 1 Success, 2 Fails] = **__1__**',
        '`[[5cwod8]]` => [**10** + 2 + 5 + **8** + 4, 2 Successes, 0 Fails] = **2**',
      ],
    },
  ],
  [
    'ova',
    {
      name: 'OVA Dice',
      description: `**Usage:** \`${config.prefix}xovady${config.postfix}\`
\`x\` - Number of OVA dice to roll, defaults to 1
\`y\` - Size of the die to roll, defaults to 6

Rolls a specified number of dice and returns the greatest sum of repeated dice.  The \`[[8ovad]]\` example shows that even though there are two 5's, the sum of those is less than four 3's, and thus the result is the four 3's, summed to 12.`,
      example: [
        '`[[ovad]]` => [4] = 4',
        '`[[4ovad]]` => [~~4~~ + 5 + ~~6~~ + 5] = 10',
        '`[[8ovad]]` => [~~2~~ + 3 + 3 + ~~5~~ + ~~4~~ + 3 + 3 + ~~5~~] = 12',
        '`[[5ovad20]]` => [~~18~~ + ~~17~~ + 19 + 19 + ~~10~~] = 38',
      ],
    },
  ],
]);

export const DiceTypesHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
