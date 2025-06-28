import config from '~config';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Roll20 Dice Options';
const description =
  `\`${config.prefix}xdydzracsq!${config.postfix}\` Rolls all configs requested, you may repeat the command multiple times in the same message (just ensure you close each roll with \`${config.postfix}\`).`;
const dict = new Map<string, HelpContents>([
  [
    'dice',
    {
      name: 'Basic Dice Options',
      description: `**Usage:** \`xdy\`
\`x\` - Number of dice to roll, if omitted, 1 is used
\`y\` - Size of dice to roll, can be replaced with \`F\` to roll Fate dice`,
      example: ['`[[4d6]]` => Rolls four 6-sided dice', '`[[5dF]]` => Rolls five Fate dice'],
    },
  ],
  [
    'drop-lowest',
    {
      name: 'Drop (Lowest)',
      description: `**Usage:** \`xdydz\` or \`xdydlz\`
\`z\` - Number of dice to drop

**Notice:** Cannot be combined with other drop or keep options`,
      example: ['`[[6d8d2]]` => Rolls six 8-sided dice, dropping the two lowest rolled dice'],
    },
  ],
  [
    'drop-highest',
    {
      name: 'Drop Highest',
      description: `**Usage:** \`xdydhz\`
\`z\` - Number of dice to drop

**Notice:** Cannot be combined with other drop or keep options`,
      example: ['`[[6d8dh2]]` => Rolls six 8-sided dice, dropping the two highest rolled dice'],
    },
  ],
  [
    'keep-highest',
    {
      name: 'Keep (Highest)',
      description: `**Usage:** \`xdykz\` or \`xdykhz\`
\`z\` - Number of dice to keep

**Notice:** Cannot be combined with other drop or keep options`,
      example: ['`[[6d8k2]]` => Rolls six 8-sided dice, keeping the two highest rolled dice'],
    },
  ],
  [
    'keep-lowest',
    {
      name: 'Keep Lowest',
      description: `**Usage:** \`xdyklz\`
\`z\` - Number of dice to keep

**Notice:** Cannot be combined with other drop or keep options`,
      example: ['`[[6d8dh2]]` => Rolls six 8-sided dice, keeping the two lowest rolled dice'],
    },
  ],
  [
    'reroll',
    {
      name: '(Normal) Reroll',
      description: `**Usage:** \`xdyrz\`, \`xdyr=z\`, \`xdyr<z\`, or \`xdyr>z\`
\`z\` - Number to compare to for rerolls, see examples for how each setup above works

The (Normal) Reroll option will reroll any dice that matches the specified pattern. Old rolls will be discarded. 

**Notice:** Cannot be combined with the Reroll Once option`,
      example: [
        '`[[6d8r2]]` => Rolls six 8-sided dice, rerolling any dice that land on 2',
        '`[[6d8r2r4]]` => Rolls six 8-sided dice, rerolling any dice that land on 2 or 4',
        '`[[6d8r=2]]` => Rolls six 8-sided dice, rerolling any dice that land on 2',
        '`[[6d8r<2]]` => Rolls six 8-sided dice, rerolling any dice that land on 2 or 1',
        '`[[6d8r>2]]` => Rolls six 8-sided dice, rerolling any dice that land on 2 thru 8 inclusive',
      ],
    },
  ],
  [
    'reroll-once',
    {
      name: 'Reroll Once',
      description: `**Usage:** \`xdyroz\`, \`xdyro=z\`, \`xdyro<z\`, or \`xdyro>z\`
\`z\` - Number to compare to for rerolls, see examples for how each setup above works

The Reroll Once option will reroll any dice that matches the specified pattern for the first time. If a die that has already been rerolled lands on a side matching the pattern, it will not be rerolled again. Old rolls will be discarded.

For example, if \`4d8ro2\` is rolled with initial results of \`[1, 2, 6, 7]\`, the \`[1, 6, 7]\` will be kept and the \`2\` will be rerolled. If this die lands on a \`2\` again, it will not be rerolled and will be kept.

**Notice:** Cannot be combined with the (Normal) Reroll options`,
      example: [
        '`[[6d8ro2]]` => Rolls six 8-sided dice, rerolling any dice that land on 2 for the first time',
        '`[[6d8ro2ro4]]` => Rolls six 8-sided dice, rerolling any dice that land on 2 or 4 for the first time',
        '`[[6d8ro=2]]` => Rolls six 8-sided dice, rerolling any dice that land on 2 for the first time',
        '`[[6d8ro<2]]` => Rolls six 8-sided dice, rerolling any dice that land on 2 or 1 for the first time',
        '`[[6d8ro>2]]` => Rolls six 8-sided dice, rerolling any dice that land on 2 thru 8 inclusive for the first time',
      ],
    },
  ],
  [
    'crit-score',
    {
      name: 'Critical (Success) Score',
      description: `**Usage:** \`xdycsz\`, \`xdycs=z\`, \`xdycs<z\`, or \`xdycs>z\`
\`z\` - Number to compare to for changing the critical success score, see examples for how each setup above works

The Critical (Success) Score option will not change what is marked as a critical success, if combined with an Exploding option, it will also explode on the newly set critical success score specified.

**Notice:** This overrides the implicit critical success settings, meaning unless specified, a 8 on a \`d8\` will not be marked as a crit`,
      example: [
        '`[[6d8cs2]]` => Rolls six 8-sided dice, marking any die that lands on a 2 as a critical success',
        '`[[6d8cs2cs4]]` => Rolls six 8-sided dice, marking any die that lands on a 2 or 4 as a critical success',
        '`[[6d8cs=2]]` => Rolls six 8-sided dice, marking any die that lands on a 2 as a critical success',
        '`[[6d8cs<2]]` => Rolls six 8-sided dice, marking any die that lands on a 2 or 1 as a critical success',
        '`[[6d8cs>2]]` => Rolls six 8-sided dice, marking any die that lands on a 2 thru 8 inclusive as a critical success',
      ],
    },
  ],
  [
    'crit-fail',
    {
      name: 'Critical Fail Score',
      description: `**Usage:** \`xdycfz\`, \`xdycf=z\`, \`xdycf<z\`, or \`xdycf>z\`
\`z\` - Number to compare to for changing the critical fail score, see examples for how each setup above works

**Notice:** This overrides the implicit critical fail settings, meaning unless specified, a 1 on a \`d8\` will not be marked as a fail`,
      example: [
        '`[[6d8cf2]]` => Rolls six 8-sided dice, marking any die that lands on a 2 as a critical fail',
        '`[[6d8cf2cf4]]` => Rolls six 8-sided dice, marking any die that lands on a 2 or 4 as a critical fail',
        '`[[6d8cf=2]]` => Rolls six 8-sided dice, marking any die that lands on a 2 as a critical fail',
        '`[[6d8cf<2]]` => Rolls six 8-sided dice, marking any die that lands on a 2 or 1 as a critical fail',
        '`[[6d8cf>2]]` => Rolls six 8-sided dice, marking any die that lands on a 2 thru 8 inclusive as a critical fail',
      ],
    },
  ],
  [
    'exploding',
    {
      name: '(Standard) Exploding',
      description: `**Usage:** \`xdy!\`, \`xdy!z\`, \`xdy!=z\`, \`xdy!<z\`, or \`xdy!>z\`
\`z\` - Number to compare to for changing the score to explode on, if omitted, will explode on critical successes, see examples for how each setup above works

(Standard) Exploding is when you roll another die when one lands on a certain number, and keep both results. This theoretically could happen infinitely since if the new die also lands on a number set to explode it will also explode.

**Notice:** Cannot be combined with other types of explosion/exploding options`,
      example: [
        '`[[6d8!]]` => Rolls six 8-sided dice, exploding any die that lands on a 8 (the max size of the die)',
        '`[[6d10!]]` => Rolls six 10-sided dice, exploding any die that lands on a 10 (the max size of the die)',
        '`[[6d8cs4!]]` => Rolls six 8-sided dice, exploding any die that lands on a 4 (the critical success score specified by `cs4`)',
        '`[[6d8cs>4!]]` => Rolls six 8-sided dice, exploding any die that lands on a 4 thru 8 inclusive (the critical success score specified by `cs>4`)',
        '`[[6d8!2]]` => Rolls six 8-sided dice, exploding any die that lands on a 2',
        '`[[6d8!2!4]]` => Rolls six 8-sided dice, exploding any die that lands on a 2 or 4',
        '`[[6d8!=2]]` => Rolls six 8-sided dice, exploding any die that lands on a 2',
        '`[[6d8!<2]]` => Rolls six 8-sided dice, exploding any die that lands on a 2 or 1',
        '`[[6d8!>2]]` => Rolls six 8-sided dice, exploding any die that lands on a 2 thru 8 inclusive',
      ],
    },
  ],
  [
    'explode-once',
    {
      name: 'Explode Once',
      description: `**Usage:** \`xdy!o\`, \`xdy!oz\`, \`xdy!o=z\`, \`xdy!o<z\`, or \`xdy!o>z\`
\`z\` - Number to compare to for changing the score to explode on, if omitted, will explode on critical successes, see examples for how each setup above works

The Explode Once option is when you roll another die when one lands on a certain number, and keep both results. This will not cascade to infinity though, as once a die has exploded, it cannot explode again.

**Notice:** Cannot be combined with other types of explosion/exploding options`,
      example: [
        '`[[6d8!o]]` => Rolls six 8-sided dice, exploding any die that lands on a 8 (the max size of the die) for the first time',
        '`[[6d10!o]]` => Rolls six 10-sided dice, exploding any die that lands on a 10 (the max size of the die) for the first time',
        '`[[6d8cs4!o]]` => Rolls six 8-sided dice, exploding any die that lands on a 4 (the critical success score specified by `cs4`) for the first time',
        '`[[6d8cs>4!o]]` => Rolls six 8-sided dice, exploding any die that lands on a 4 thru 8 inclusive (the critical success score specified by `cs>4`) for the first time',
        '`[[6d8!o2]]` => Rolls six 8-sided dice, exploding any die that lands on a 2 for the first time',
        '`[[6d8!o2!o4]]` => Rolls six 8-sided dice, exploding any die that lands on a 2 or 4 for the first time',
        '`[[6d8!o=2]]` => Rolls six 8-sided dice, exploding any die that lands on a 2 for the first time',
        '`[[6d8!o<2]]` => Rolls six 8-sided dice, exploding any die that lands on a 2 or 1 for the first time',
        '`[[6d8!o>2]]` => Rolls six 8-sided dice, exploding any die that lands on a 2 thru 8 inclusive for the first time',
      ],
    },
  ],
  [
    'explode-penetrating',
    {
      name: 'Penetrating Explosion',
      description: `**Usage:** \`xdy!p\`, \`xdy!pz\`, \`xdy!p=z\`, \`xdy!p<z\`, or \`xdy!p>z\`
\`z\` - Number to compare to for changing the score to explode on, if omitted, will explode on critical successes, see examples for how each setup above works

The Penetrating Explosion option is when you roll another die when one lands on a certain number, but you subtract 1 from the new die, and keep both results. This may cascade to infinity if the exploding range is very large.

**Notice:** Cannot be combined with other types of explosion/exploding options`,
      example: [
        '`[[6d8!p]]` => Rolls six 8-sided dice, exploding+penetrating any die that lands on a 8 (the max size of the die)',
        '`[[6d10!p]]` => Rolls six 10-sided dice, exploding+penetrating any die that lands on a 10 (the max size of the die)',
        '`[[6d8cs4!p]]` => Rolls six 8-sided dice, exploding+penetrating any die that lands on a 4 (the critical success score specified by `cs4`)',
        '`[[6d8cs>4!p]]` => Rolls six 8-sided dice, exploding+penetrating any die that lands on a 4 thru 8 inclusive (the critical success score specified by `cs>4`)',
        '`[[6d8!p2]]` => Rolls six 8-sided dice, exploding+penetrating any die that lands on a 2',
        '`[[6d8!p2!p4]]` => Rolls six 8-sided dice, exploding+penetrating any die that lands on a 2 or 4',
        '`[[6d8!p=2]]` => Rolls six 8-sided dice, exploding+penetrating any die that lands on a 2',
        '`[[6d8!p<2]]` => Rolls six 8-sided dice, exploding+penetrating any die that lands on a 2 or 1',
        '`[[6d8!p>2]]` => Rolls six 8-sided dice, exploding+penetrating any die that lands on a 2 thru 8 inclusive',
      ],
    },
  ],
  [
    'explode-compounding',
    {
      name: 'Compounding Explosion',
      description: `**Usage:** \`xdy!!\`, \`xdy!!z\`, \`xdy!!=z\`, \`xdy!!<z\`, or \`xdy!!>z\`
\`z\` - Number to compare to for changing the score to explode on, if omitted, will explode on critical successes, see examples for how each setup above works

The Compounding Explosion option is when you roll another die when one lands on a certain number, and add the new result to the initial die. This theoretically could happen infinitely since if the new die also lands on a number set to explode it will also explode.

Any time a Compounding Explosion happens, the formatting on the die will still show if the underlying dice were a critical success or critical failure.

**Notice:** Cannot be combined with other types of explosion/exploding options`,
      example: [
        '`[[6d8!!]]` => Rolls six 8-sided dice, exploding+compounding any die that lands on a 8 (the max size of the die)',
        '`[[6d10!!]]` => Rolls six 10-sided dice, exploding+compounding any die that lands on a 10 (the max size of the die)',
        '`[[6d8cs4!!]]` => Rolls six 8-sided dice, exploding+compounding any die that lands on a 4 (the critical success score specified by `cs4`)',
        '`[[6d8cs>4!!]]` => Rolls six 8-sided dice, exploding+compounding any die that lands on a 4 thru 8 inclusive (the critical success score specified by `cs>4`)',
        '`[[6d8!!2]]` => Rolls six 8-sided dice, exploding+compounding any die that lands on a 2',
        '`[[6d8!!2!!4]]` => Rolls six 8-sided dice, exploding+compounding any die that lands on a 2 or 4',
        '`[[6d8!!=2]]` => Rolls six 8-sided dice, exploding+compounding any die that lands on a 2',
        '`[[6d8!!<2]]` => Rolls six 8-sided dice, exploding+compounding any die that lands on a 2 or 1',
        '`[[6d8!!>2]]` => Rolls six 8-sided dice, exploding+compounding any die that lands on a 2 thru 8 inclusive',
      ],
    },
  ],
  [
    'dice-matching',
    {
      name: 'Dice Matching',
      description: `**Usage:** \`xdym\`, \`xdymz\`, \`xdymt\`, or \`xdymtz\`
\`z\` - Minimum count of matches for a label to be added

The basic \`m\` option will only add labels without modifying the results, whereas the \`mt\` options will add labels and will change the result of the roll to be equal to the number of labels that have been added.`,
      example: [
        '`[[10d6m]]` => [**C:6** + B:2 + 4 + __C:1__ + __C:1__ + B:2 + **C:6** + B:2 + **C:6** + **C:6**] = 36',
        '`[[10d6m4]]` => [**A:6** + 2 + 4 + __1__ + __1__ + 2 + **A:6** + 2 + **A:6** + **A:6**] = 36',
        '`[[10d6mt]]` => [**C:6** + B:2 + ~~4~~ + __C:1__ + __C:1__ + B:2 + **C:6** + B:2 + **C:6** + **C:6**] = 3',
        '`[[10d6mt4]]` => [**A:6** + ~~2~~ + ~~4~~ + ~~__1__~~ + ~~__1__~~ + ~~2~~ + **A:6** + ~~2~~ + **A:6** + **A:6**] = 1',
      ],
    },
  ],
]);

export const DiceOptionsHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
