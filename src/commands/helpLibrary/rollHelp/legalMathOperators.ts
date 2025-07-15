import config from '~config';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Math Operators';
const description = `Basic math operators.  In the following examples, spaces are included for readability and are not required as they are stripped from the command when ${config.name} parses it.

When multiple are included in one command, they are executed in PEMDAS (Parenthesis, Exponentials, Multiplication, Division, Addition, Subtraction) order.`;
const dict = new Map<string, HelpContents>([
  [
    'parenthesis',
    {
      name: 'Parenthesis',
      description: 'Used to group parts of an equation, can be nested as much as needed.  Supports implicit multiplication.',
      example: [
        '`[[4(12 + 3)]]` => 60',
        '`[[(12 + 3)4]]` => 60',
        '`[[d20(4 + d4)]]` => [14] * (4 + 3) = 98',
        '`[[d20(4 + (d4 * (4 + d20) ^ 3))]]` => [19] * (4 + ([__1__] * (4 + 8) ^ 3)) = __32908__',
      ],
    },
  ],
  [
    'exponentials',
    {
      name: 'Exponentials',
      description: 'A base number multiplied by itself a specified number of times.',
      example: ['`[[10 ^ 2]]` => 100', '`[[d20 ^ 2]]` => [13] ^ 2 = 169'],
    },
  ],
  [
    'multiplication',
    {
      name: 'Multiplication',
      description: 'Also known as repeated addition.',
      example: ['`[[4 * 5]]` => 20', '`[[d20 * 6]]` => [11] * 6 = 66'],
    },
  ],
  [
    'division',
    {
      name: 'Division',
      description: 'The inverse of multiplication',
      example: ['`[[20 / 4]]` => 5', '`[[d20 / 4]]` => [12] / 4 = 3'],
    },
  ],
  [
    'addition',
    {
      name: 'Addition',
      description: 'The process of adding things together.',
      example: ['`[[3 + 4]]` => 7', '`[[d20 + 4]]` => [13] + 4 = 17'],
    },
  ],
  [
    'subtraction',
    {
      name: 'Subtraction',
      description: 'Gives the difference between two numbers.',
      example: ['`[[5 - 2]]` => 3', '`[[d20 - 3]]` => [17] - 3 = 14'],
    },
  ],
]);

export const LegalMathOperators: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
