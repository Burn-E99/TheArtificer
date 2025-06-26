import config from '~config';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Miscellaneous Features';
const description = `This section includes any other features I can't group elsewhere.`;
const dict = new Map<string, HelpContents>([
  [
    'user-formatting',
    {
      name: 'User Formatting',
      description: `Any formatting/characters outside of roll commands will be preserved in the output.

The first characters in a message must be a valid roll command, you can pad your message with something like \`[[0]]\` as shown in the example.  The example uses the "Super No Details" flag (\`-snd\`) in combination with the "Hide Raw" flag (\`-hr\`) to only show the formatted results.`,
      example: [
        `\`\`\`[[0]] ${config.name} attacks the dragon with their Sword!
To Hit: [[d20 + 4 - 1 + 8]]
Damage: [[d8 + 10]] -snd -hr\`\`\`
**Results:**
0 ${config.name} attacks the dragon with their Sword!
To Hit: 18
Damage: 14`,
      ],
    },
  ],
  [
    'nested',
    {
      name: 'Nested Rolls',
      description: `${config.name} supports nesting dice rolls inside of each other.  This means you can roll a random number of die, dice of random sizes, etc.`,
      example: [
        'Roll a `d10`, then roll that number of `d20`s.\n`[[ [[d10]]d20 ]]` => `[[d10 = 3]]d20` = [2 + 12 + 11] = 25',
        '',
        'Roll a `d4` and add 4 to it, then use that number as the die size.\nResults in rolling `4d5d1` thru `4d8d1`.\n`[[ 4d[[ d4 + 4 ]]d1 ]]` => `4d[[d4+4 = 6]]d1` = [~~__1__~~ + 3 + 3 + 3] = 9',
        '',
        'Roll 5 `d10`s, but reroll a random side of the die determine by a different `d10`.\n`[[5d10r[[d10]] ]]` => `5d10r[[d10 = 10]]` = [3 + 9 + 5 + 5 + ~~**10**~~ + 6] = 28',
      ],
    },
  ],
  [
    'variable',
    {
      name: 'Variables',
      description:
        `${config.name}'s variable system allows reusing results as a value inside one message.  This is useful when you want to use a result as a part of the final message, but also want to use that result in a follow-up roll.

This message must contain multiple roll commands in it (such as \`[[d4]] [[d8]]\`).  Nested dice rolls are not able to be used as a variable, but can use variables inside them.

Variables are numbered from \`x0\` to \`xN\`, where \`N\` equals two less than the total number of roll commands in the message.  You can add the "Number Variables" flag (\`-nv\`) to your command to see what will be assigned to each roll command.

**Notes about this example:**
- The example below starts with \`[[0]]\` so that it is a valid roll command.  See the \`Miscellaneous Features>User Formatting\` help page for more details.
- It is recommended to use the "Super No Details" flag (\`-snd\`) in combination with the "Hide Raw" flag (\`-hr\`) to only show the formatted results.  This example does not use it to show exactly what is happening.
- The example makes use of Nested Roll Commands to use the "To Hit" as the number of dice to roll for the "Explosion".`,
      example: [
        `If you send:
\`\`\`[[0]]<=(this is x0) ${config.name} attacks the dragon with their Magical Sword of Extra Strength and Explosions!
Strength Check: [[d20 + 8 + 2 - 1]]<=(this is x1)
To Hit: [[d20 + 4 - 1 + 8]]<=(this is x2)
Damage: [[(d8 + 10) * x1]]<=(this is x3)
Explosion: [[ [[x2]]d10! * x3 ]]\`\`\`
${config.name} will respond with:

@$ rolled:
\`[[0]] ${config.name} attacks the dragon with their Magical Sword of Extra Strength and Explosions! Strength Check: [[d20 + 8 + 2 - 1]] To Hit: [[d20 + 4 - 1 + 8]] Damage: [[(d8 + 10) * x1]] Explosion: [[ [[x2]]d10! * x3 ]]\`
**Results:**
0 ${config.name} attacks the dragon with their Magical Sword of Extra Strength and Explosions!
Strength Check: 27
To Hit: __12__
Damage: 324
Explosion: __19764__

**Details:**
\`0\` = 0 = 0
\`d20+8+2-1\` = [18]+8+2-1 = 27
\`d20+4-1+8\` = [1]+4-1+8 = 12
\`(d8+10)*x1\` = ([2]+10)\\*27 = 324
\`[[x2=12]]d10!*x3\` = [6 + 5 + 9 + 5 + 4 + __1__ + 3 + **10** + 4! + 6 + 2 + 5 + 6]\\*324 = __21384__`,
      ],
    },
  ],
]);

export const MiscFeaturesHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
