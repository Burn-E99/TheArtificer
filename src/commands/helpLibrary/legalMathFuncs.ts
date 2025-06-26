import config from '~config';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Basic Math Functions';
const description = `Basic math functions akin to what Roll20 provides, such as Round or Ceil.

Documentation from the [MDN Web Docs](${config.links.mathDocs}).`;
const dict = new Map<string, HelpContents>([
  [
    'abs',
    {
      name: 'Absolute Value',
      description: 'Returns the absolute value of a number.',
      example: ['`[[abs(-4)]]` => 4', '`[[abs(-56 * d20)]]` => abs(-56 * [12]) = 672'],
    },
  ],
  [
    'ceil',
    {
      name: 'Ceiling',
      description: 'Always rounds up to nearest whole number.',
      example: ['`[[ceil(4.3)]]` => 5', '`[[ceil(d20 / 3)]]` => ceil([13] / 3) = 5'],
    },
  ],
  [
    'floor',
    {
      name: 'Floor',
      description: 'Always rounds down to the nearest whole number.',
      example: ['`[[floor(4.8)]]` => 4', '`[[floor(d20 / 3)]]` => floor([14] / 3) = 4'],
    },
  ],
  [
    'round',
    {
      name: 'Round',
      description: 'Returns the value of a number rounded to the nearest whole number.',
      example: ['`[[round(4.3)]]` => 4', '`[[round(4.8)]]` => 5', '`[[round(d20 / 3)]]` => round([13] / 3) = 4', '`[[round(d20 / 3)]]` => round([14] / 3) = 5'],
    },
  ],
  [
    'trunc',
    {
      name: 'Truncate',
      description: 'Returns the integer part of a number by removing any fractional digits.',
      example: ['`[[trunc(4.3)]]` => 4', '`[[trunc(4.8)]]` => 4', '`[[trunc(d20 / 3)]]` => trunc([13] / 3) = 4', '`[[trunc(d20 / 3)]]` => trunc([14] / 3) = 5'],
    },
  ],
  [
    'sqrt',
    {
      name: 'Square Root',
      description: 'Returns the square root of a number.',
      example: ['`[[sqrt(4)]]` => 2', '`[[sqrt(d20 + 2)]]` => sqrt([14] + 2) = 4'],
    },
  ],
]);

export const LegalMathFuncsHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
