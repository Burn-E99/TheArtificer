import config from '~config';

import { HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';
import { DecoratorsHelpPages } from 'commands/helpLibrary/decorators.ts';
import { DiceOptionsHelpPages } from 'commands/helpLibrary/diceOptions.ts';
import { DiceTypesHelpPages } from 'commands/helpLibrary/diceTypes.ts';
import { DifferencesHelpPages } from 'commands/helpLibrary/differences.ts';
import { FormattingHelpPages } from 'commands/helpLibrary/formatting.ts';
import { LegalMathComplexFuncsHelpPages } from 'commands/helpLibrary/legalMathComplexFuncs.ts';
import { LegalMathConstsHelpPages } from 'commands/helpLibrary/legalMathConsts.ts';
import { LegalMathFuncsHelpPages } from 'commands/helpLibrary/legalMathFuncs.ts';
import { LegalMathOperators } from 'commands/helpLibrary/legalMathOperators.ts';
import { LegalMathTrigFuncsHelpPages } from 'commands/helpLibrary/legalMathTrigFuncs.ts';
import { MiscFeaturesHelpPages } from 'commands/helpLibrary/miscFeatures.ts';

const name = `${config.name}'s Roll Command Details`;
const description = `You can chain as many of these options as you want, as long as the option does not disallow it.  This command also can fully solve math equations with parenthesis.

The help options in this group use the notation \`xdy\` to indicate the basic/required dice notation for die count and size as detailed in the \`Dice Options/Basic Dice Options\` page.

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

export const RootHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
