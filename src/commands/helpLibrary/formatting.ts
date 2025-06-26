import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Results Formatting';
const description =
  'The results have some formatting applied on them to provide details on what happened during this roll.  These options can be stacked on each other to show complicated results.';
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
]);

export const FormattingHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
