import config from '~config';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Math Constants';
const description = `Available math constants.

Documentation from [MDN Web Docs](${config.links.mathDocs}).`;
const dict = new Map<string, HelpContents>([
  [
    'e',
    {
      name: "Euler's number",
      description: `**Usage:** \`e\`

Represents Euler's number, the base of natural logarithms, \`e\`, which is approximately \`2.718\`.`,
      example: ['`[[e]]` => 2.718281828459045', '`[[e*2]]` => 5.43656365691809'],
    },
  ],
  [
    'pi',
    {
      name: 'Pi/𝜋',
      description: `**Usage:** \`pi\` or \`𝜋\`

Represents the ratio of the circumference of a circle to its diameter, approximately \`3.14159\`.`,
      example: ['`[[pi]]` => 3.141592653589793', '`[[𝜋*2]]` => 6.283185307179586'],
    },
  ],
]);

export const LegalMathConstsHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
