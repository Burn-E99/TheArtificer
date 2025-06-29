import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

export const translateError = (solverError: Error): [string, string] => {
  // Welp, the unthinkable happened, we hit an error

  // Split on _ for the error messages that have more info than just their name
  const errorSplits = solverError.message.split('_');
  const errorName = errorSplits.shift();
  const errorDetails = errorSplits.join('_');

  let errorMsg = '';

  // Translate the errorName to a specific errorMsg
  switch (errorName) {
    case 'WholeDieCountSizeOnly':
      errorMsg = 'Error: Die Size and Die Count must be positive whole numbers';
      break;
    case 'YouNeedAD':
      errorMsg = `Error: Attempted to parse \`${errorDetails}\` as a dice configuration, `;
      if (errorDetails.includes('d')) {
        errorMsg += '`d` was found, but the die size and/or count were missing or zero when they should be a positive whole number';
      } else {
        errorMsg += '`d` was not found in the dice config for specifying die size and/or count';
      }
      break;
    case 'CannotParseDieCount':
      errorMsg = `Formatting Error: Cannot parse \`${errorDetails}\` as a number`;
      break;
    case 'DoubleSeparator':
      errorMsg = `Formatting Error: \`${errorDetails}\` should only be specified once per roll, remove all but one and repeat roll`;
      break;
    case 'FormattingError':
      errorMsg = 'Formatting Error: ';
      switch (errorDetails) {
        case 'dk':
          errorMsg += 'Cannot use Keep and Drop at the same time, remove all but one and repeat roll';
          break;
        case 'mtsf':
          errorMsg += 'Cannot use Match with CWOD Dice, or the Success or Fail options, remove all but one and repeat roll';
          break;
        default:
          errorMsg += `Unhandled - ${errorDetails}`;
          break;
      }
      break;
    case 'NoMaxWithDash':
      errorMsg = 'Formatting Error: CritScore range specified without a maximum, remove - or add maximum to correct';
      break;
    case 'UnknownOperation':
      errorMsg = `Error: Unknown Operation ${errorDetails}`;
      if (errorDetails === '-') {
        errorMsg += '\nNote: Negative numbers are not supported';
      } else if (errorDetails === ' ') {
        errorMsg += `\nNote: Every roll must be closed by ${config.postfix}`;
      }
      break;
    case 'NoZerosAllowed':
      errorMsg = 'Formatting Error: ';
      switch (errorDetails) {
        case 'base':
          errorMsg += 'Die Size and Die Count';
          break;
        case 'drop':
          errorMsg += 'Drop (`d` or `dl`)';
          break;
        case 'keep':
          errorMsg += 'Keep (`k` or `kh`)';
          break;
        case 'dropHigh':
          errorMsg += 'Drop Highest (`dh`)';
          break;
        case 'keepLow':
          errorMsg += 'Keep Lowest (`kl`)';
          break;
        case 'reroll':
          errorMsg += 'Reroll (`r`)';
          break;
        case 'critScore':
          errorMsg += 'Crit Score (`cs`)';
          break;
        case 'critFail':
          errorMsg += 'Crit Fail (`cf`)';
          break;
        default:
          errorMsg += `Unhandled - ${errorDetails}`;
          break;
      }
      errorMsg += ' cannot be zero';
      break;
    case 'NoRerollOnAllSides':
      errorMsg = 'Error: Cannot reroll all sides of a die, must have at least one side that does not get rerolled';
      break;
    case 'CritScoreMinGtrMax':
      errorMsg = 'Formatting Error: CritScore maximum cannot be greater than minimum, check formatting and flip min/max';
      break;
    case 'Invalid string length':
    case 'MaxLoopsExceeded':
      errorMsg = 'Error: Roll is too complex or reaches infinity';
      break;
    case 'UnbalancedParen':
      errorMsg = 'Formatting Error: At least one of the equations contains unbalanced `(`/`)`';
      break;
    case 'UnbalancedPrefixPostfix':
      errorMsg = `Formatting Error: At least one of the equations contains unbalanced \`${config.prefix}\`/\`${config.postfix}\``;
      break;
    case 'EMDASNotNumber':
      errorMsg = 'Error: One or more operands is not a number';
      break;
    case 'ConfWhat':
      errorMsg = 'Error: Not all values got processed, please report the command used';
      break;
    case 'OperatorWhat':
      errorMsg = 'Error: Something really broke with the Operator, try again';
      break;
    case 'OperandNaN':
      errorMsg = 'Error: One or more operands reached NaN, check input';
      break;
    case 'UndefinedStep':
      errorMsg = 'Error: Roll became undefined, one or more operands are not a roll or a number, check input';
      break;
    case 'IllegalVariable':
      errorMsg = `Error: \`${errorDetails}\` is not a valid variable`;
      break;
    case 'TooManyLabels':
      errorMsg = `Error: ${config.name} can only support a maximum of \`${errorDetails}\` labels when using the dice matching options (\`m\` or \`mt\`)`;
      break;
    default:
      log(LT.ERROR, `Unhandled Parser Error: ${errorName}, ${errorDetails}`);
      errorMsg = `Unhandled Error: ${solverError.message}\nCheck input and try again, if issue persists, please use \`${config.prefix}report\` to alert the devs of the issue`;
      break;
  }

  return [solverError.message, errorMsg];
};
