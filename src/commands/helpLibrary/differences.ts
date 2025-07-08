import config from '~config';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const name = 'Differences from Roll20';
const description = `This section details anything ${config.name} implements differently from Roll20.`;
const dict = new Map<string, HelpContents>([
  [
    'diff',
    {
      name: 'Features Differences',
      description: `The following features are implemented slightly different in ${config.name}:
- **GM Rolls:** Instead of doing \`/gmroll\`, use the regular inline syntax, but tack on \`-gm @user\`.  More details can be found on the \`Roll Command Decorators/GM Roll\` page.
- **Computed Dice Rolls:** As ${config.name} supports implicit multiplication, computed dice rolls use the Nested Rolls syntax.  More details can be found on the \`Miscellaneous Features/Nested Rolls\` page.`,
    },
  ],
  [
    'miss',
    {
      name: 'Features Missing',
      description: `The following features are not implemented in ${config.name}:
- As ${config.name} does not have access to your character sheet or to Roll20, \`&{tracker}\` and \`@{attribute}\` are not supported.
- **Roll queries (**\`?{Prompt Message}\`**):** Not supported to keep interactions with ${config.name} quick and simple.
- **Inline Labels:** As all rolls must be inline dice rolls with ${config.name}, inline labels are not supported.`,
    },
  ],
]);

export const DifferencesHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
