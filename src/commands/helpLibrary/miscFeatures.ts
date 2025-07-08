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
    'single-mode-group',
    {
      name: 'Single Sub-Roll Group',
      description: `${config.name} supports Roll20's Grouped Roll syntax.  This page details how the single sub-roll mode works, and how the options interact with the dice rolled in it.

When no options are provided, the group is effectively transparent and does not have any affect on the roll.

The following options are supported at a group level: Drop (Lowest), Drop Highest, Keep (Highest), Keep Lowest, Target Number (Successes) and Target Failures
Specifically: \`d\`, \`dl\`, \`dh\`, \`k\`, \`kl\`, \`kh\`, \`<\`, \`>\`, \`=\`, \`f\`, \`f<\`, \`f>\`, and \`f=\`

The group variants of these share the same rules as the normal Dice Options, and more details can be found in the \`Dice Options\` help section.

When in Single Sub-Roll mode, the group options are applied across all sub-rolls.  This means, for example, you can roll a few different sized dice at the same time and only keep the highest rolls from that combination of dice.`,
      example: [
        '`[[{4d6 + 3d8}]]` => {[__1__ + 4 + __1__ + 3]+[5 + 3 + 5]} = __22__',
        '`[[{4d6 + 3d8}d2]]` => {[**6** + **6** + ~~2~~ + 4]+[6 + ~~__1__~~ + 7]} = **29**',
        '`[[{4d6 + 3d8}k4]]` => {[4 + ~~__1__~~ + 5 + ~~2~~]+[**8** + ~~__1__~~ + **8**]} = **25**',
        '`[[{4d6 + 3d8}>5]]` => {[3 + 3 + S:5 + S:5, 2 Successes]+[**S:8** + 3 + __1__, 1 Success]} = **__3__**',
        '`[[{4d6 + 3d8}f<3]]` => {[**6** + 5 + __F:1__ + **6**, 1 Fail]+[5 + F:2 + 4, 1 Fail]} = **__-2__**',
        '`[[{4d6 + 3d8}>5f<3]]` => {[__F:1__ + S:5 + F:3 + 4, 1 Success, 2 Fails]+[__F:1__ + __F:1__ + 4, 0 Successes, 2 Fails]} = __-3__',
        '`[[{4d6 + 3d8}k5>6f<4]]` => {[**S:6** + ~~3~~ + 5 + F:4, 1 Success, 1 Fail]+[F:4 + ~~2~~ + **S:8**, 1 Success, 1 Fail]} = **0**',
      ],
    },
  ],
  [
    'multi-mode-group',
    {
      name: 'Multi Sub-Roll Group',
      description: `${config.name} supports Roll20's Grouped Roll syntax.  This page details how the multi sub-roll mode works, and how the options interact with the dice rolled in it.

When no options are provided, the group is put into sum mode and sums each sub-roll into one total.

The following options are supported at a group level: Drop (Lowest), Drop Highest, Keep (Highest), Keep Lowest, Target Number (Successes) and Target Failures
Specifically: \`d\`, \`dl\`, \`dh\`, \`k\`, \`kl\`, \`kh\`, \`<\`, \`>\`, \`=\`, \`f\`, \`f<\`, \`f>\`, and \`f=\`

The group variants of these share the same rules as the normal Dice Options, and more details can be found in the \`Dice Options\` help section.

When in Multi Sub-Roll mode, the group options are applied to the results of each sub-roll.  This means, for example, you can sum the highest sub-roll results or set a specific threshold for overall successes.`,
      example: [
        '`[[{4d6+2d8, 3d20+3, 5d10+1}]]` => {[2 + 3 + __1__ + 3]+[5 + 5] + [19 + 3 + 8]+3 + [**10** + 6 + 6 + **10** + 2]+1} = **__87__**',
        '`[[{4d6+2d8, 3d20+3, 5d10+1}d1]]` => {[3 + **6** + 3 + __1__]+[3 + 6], ~~[__1__ + 10 + 5]+3~~, [7 + __1__ + 7 + 7 + __1__]+1} = **__46__**',
        '`[[{4d6+2d8, 3d20+3, 5d10+1}k1]]` => {~~[__1__ + **6** + 4 + 3]+[5 + 4]~~, ~~[5 + 2 + 19]+3~~, [2 + 9 + 9 + 5 + 5]+1} = 31',
        '`[[{4d6+2d8, 3d20+3, 5d10+1}>30]]` => {[__1__ + 2 + 2 + 5]+[6 + 2], [15 + 7 + 4]+3, S:[**10** + 9 + 4 + **10** + 6]+1, 1 Success} = **__1__**',
        '`[[{4d6+2d8, 3d20+3, 5d10+1}f<25]]` => {F:[2 + 5 + __1__ + 2]+[__1__ + 4], [17 + 5 + 5]+3, [8 + 9 + 6 + 4 + 7]+1, 1 Fail} = __-1__',
        '`[[{4d6+2d8, 3d20+3, 5d10+1}>30f<25]]` => {F:[5 + 2 + 3 + **6**]+[__1__ + 7], S:[12 + 12 + 10]+3, [6 + 9 + __1__ + 6 + 5]+1, 1 Success, 1 Fail} = **__0__**',
        '`[[{4d6+2d8, 3d20+3, 5d10+1}k2>30f<25]]` => {~~[2 + 4 + 4 + 2]+[__1__ + 2]~~, S:[4 + 8 + **20**]+3, [4 + __1__ + **10** + 3 + 8]+1, 1 Success, 0 Fails} = **__1__**',
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
