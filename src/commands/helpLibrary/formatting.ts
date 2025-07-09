import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Results Formatting';
const description = 'The results have some formatting applied on them to provide details on what happened during this roll.  These options can be stacked on each other to show complicated results.';
const dict = new Map<string, HelpContents>([
  [
    'bold',
    {
      name: 'Bold',
      description: 'Individual critical successes and any results containing a critical success will be **bolded**.',
      example: ['`[[2d6]]` => [2 + **6**] = **8**'],
    },
  ],
  [
    'underline',
    {
      name: 'Underline',
      description: 'Individual critical fails and any results containing a critical fail will be __underlined__.',
      example: ['`[[2d6]]` => [__1__ + 4] = __5__'],
    },
  ],
  [
    'strikethrough',
    {
      name: 'Strikethrough',
      description: 'Rolls that were dropped or rerolled ~~crossed out~~.',
      example: ['`[[4d6d1]]` => [~~__1__~~ + 2 + 4 + **6**] = **12**', '`4d6r2` => [__1__ + ~~2~~ + 3 + 4 + **6**] = **__14__**'],
    },
  ],
  [
    'exclamation-mark',
    {
      name: 'Exclamation mark (`!`)',
      description: 'Rolls that were caused by an explosion have an exclamation mark (`!`) after them.',
      example: ['`[[4d6!]]` => [3 + 4 + **6** + 4! + 5] = **22**'],
    },
  ],
  [
    'labels',
    {
      name: 'Labels',
      description:
        'When rolling in Dice Matching (`Dice Options>Dice Matching`) or Success/Failure mode (`Dice Options>Target Number/Successes`/`Dice Options>Target Failures`), some dies will get labels added to them to indicate what group they are in, or if they were a success or failure.',
      example: [
        'Dice Matching Example:\n`[[10d6m]]` => [**C:6** + B:2 + 4 + __C:1__ + __C:1__ + B:2 + **C:6** + B:2 + **C:6** + **C:6**] = 36',
        '',
        'Success/Failure mode example:\n`[[10d6>5f<2]]` => [__F:1__ + **S:6** + __F:1__ + S:5 + S:5 + S:5 + 4 + **S:6** + 4 + __F:1__, 5 Successes, 3 Fails] = **__2__**',
      ],
    },
  ],
]);

export const FormattingHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
