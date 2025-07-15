import config from '~config';

import { HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

import { DecoratorsHelpPages } from 'commands/helpLibrary/rollHelp/decorators.ts';
import { DiceOptionsHelpPages } from 'commands/helpLibrary/rollHelp/diceOptions.ts';
import { DiceTypesHelpPages } from 'commands/helpLibrary/rollHelp/diceTypes.ts';
import { DifferencesHelpPages } from 'commands/helpLibrary/rollHelp/differences.ts';
import { FormattingHelpPages } from 'commands/helpLibrary/rollHelp/formatting.ts';
import { LegalMathComplexFuncsHelpPages } from 'commands/helpLibrary/rollHelp/legalMathComplexFuncs.ts';
import { LegalMathConstsHelpPages } from 'commands/helpLibrary/rollHelp/legalMathConsts.ts';
import { LegalMathFuncsHelpPages } from 'commands/helpLibrary/rollHelp/legalMathFuncs.ts';
import { LegalMathOperators } from 'commands/helpLibrary/rollHelp/legalMathOperators.ts';
import { LegalMathTrigFuncsHelpPages } from 'commands/helpLibrary/rollHelp/legalMathTrigFuncs.ts';
import { MiscFeaturesHelpPages } from 'commands/helpLibrary/rollHelp/miscFeatures.ts';

const name = 'Dice/Roll/Math Command';
const description = `You can chain as many of these options as you want, as long as the option does not disallow it.  This command also can fully solve math equations with parenthesis.

The help options in this group use the notation \`xdy\` to indicate the basic/required dice notation for die count and size as detailed in the \`Dice Options>Basic Dice Options\` page.

As this supports the [Roll20 formatting](${config.links.roll20Formatting}) syntax fully, more details and examples can be found [here](${config.links.roll20Formatting}).

Please use the dropdown/select menus to search through the provided documentation.`;
const dict = new Map<string, HelpPage>([
  ['differences', DifferencesHelpPages],
  ['dice-types', DiceTypesHelpPages],
  ['dice-options', DiceOptionsHelpPages],
  ['decorators', DecoratorsHelpPages],
  ['formatting', FormattingHelpPages],
  ['misc-features', MiscFeaturesHelpPages],
  ['legal-math-operators', LegalMathOperators],
  ['legal-math-consts', LegalMathConstsHelpPages],
  ['legal-math-funcs', LegalMathFuncsHelpPages],
  ['legal-math-trig-funcs', LegalMathTrigFuncsHelpPages],
  ['legal-math-complex-funcs', LegalMathComplexFuncsHelpPages],
]);

export const RootRollHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
