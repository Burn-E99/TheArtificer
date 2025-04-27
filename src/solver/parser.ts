import {
  log,
  // Log4Deno deps
  LT,
} from '../../deps.ts';

import config from '../../config.ts';

import { RollModifiers } from '../mod.d.ts';
import { CountDetails, ReturnData, SolvedRoll, SolvedStep } from './solver.d.ts';
import { compareTotalRolls, escapeCharacters, loggingEnabled } from './rollUtils.ts';
import { formatRoll } from './rollFormatter.ts';
import { fullSolver } from './solver.ts';

// parseRoll(fullCmd, modifiers)
// parseRoll handles converting fullCmd into a computer readable format for processing, and finally executes the solving
export const parseRoll = (fullCmd: string, modifiers: RollModifiers): SolvedRoll => {
  const operators = ['^', '*', '/', '%', '+', '-', '(', ')'];
  const returnmsg = <SolvedRoll> {
    error: false,
    errorCode: '',
    errorMsg: '',
    line1: '',
    line2: '',
    line3: '',
    counts: {
      total: 0,
      successful: 0,
      failed: 0,
      rerolled: 0,
      dropped: 0,
      exploded: 0,
    },
  };

  // Whole function lives in a try-catch to allow safe throwing of errors on purpose
  try {
    // Split the fullCmd by the command prefix to allow every roll/math op to be handled individually
    const sepRolls = fullCmd.split(config.prefix);

    const tempReturnData: ReturnData[] = [];
    const tempCountDetails: CountDetails[] = [
      {
        total: 0,
        successful: 0,
        failed: 0,
        rerolled: 0,
        dropped: 0,
        exploded: 0,
      },
    ];

    // Loop thru all roll/math ops
    for (const sepRoll of sepRolls) {
      loggingEnabled && log(LT.LOG, `Parsing roll ${fullCmd} | Working ${sepRoll}`);
      // Split the current iteration on the command postfix to separate the operation to be parsed and the text formatting after the operation
      const [tempConf, tempFormat] = sepRoll.split(config.postfix);

      // Remove all spaces from the operation config and split it by any operator (keeping the operator in mathConf for fullSolver to do math on)
      const mathConf: (string | number | SolvedStep)[] = <(string | number | SolvedStep)[]> tempConf.replace(/ /g, '').split(/([-+()*/%^])/g);

      // Verify there are equal numbers of opening and closing parenthesis by adding 1 for opening parens and subtracting 1 for closing parens
      let parenCnt = 0;
      mathConf.forEach((e) => {
        loggingEnabled && log(LT.LOG, `Parsing roll ${fullCmd} | Checking parenthesis balance ${e}`);
        if (e === '(') {
          parenCnt++;
        } else if (e === ')') {
          parenCnt--;
        }
      });

      // If the parenCnt is not 0, then we do not have balanced parens and need to error out now
      if (parenCnt !== 0) {
        throw new Error('UnbalancedParens');
      }

      // Evaluate all rolls into stepSolve format and all numbers into floats
      for (let i = 0; i < mathConf.length; i++) {
        loggingEnabled && log(LT.LOG, `Parsing roll ${fullCmd} | Evaluating rolls into mathable items ${JSON.stringify(mathConf[i])}`);
        if (mathConf[i].toString().length === 0) {
          // If its an empty string, get it out of here
          mathConf.splice(i, 1);
          i--;
        } else if (mathConf[i] == parseFloat(mathConf[i].toString())) {
          // If its a number, parse the number out
          mathConf[i] = parseFloat(mathConf[i].toString());
        } else if (mathConf[i].toString().toLowerCase() === 'e') {
          // If the operand is the constant e, create a SolvedStep for it
          mathConf[i] = {
            total: Math.E,
            details: '*e*',
            containsCrit: false,
            containsFail: false,
          };
        } else if (mathConf[i].toString().toLowerCase() === 'fart' || mathConf[i].toString().toLowerCase() === '💩') {
          mathConf[i] = {
            total: 7,
            details: '💩',
            containsCrit: false,
            containsFail: false,
          };
        } else if (
          mathConf[i].toString().toLowerCase() === 'inf' ||
          mathConf[i].toString().toLowerCase() === 'infinity' ||
          mathConf[i].toString().toLowerCase() === '∞'
        ) {
          // If the operand is the constant Infinity, create a SolvedStep for it
          mathConf[i] = {
            total: Infinity,
            details: '∞',
            containsCrit: false,
            containsFail: false,
          };
        } else if (mathConf[i].toString().toLowerCase() === 'pi' || mathConf[i].toString().toLowerCase() === '𝜋') {
          // If the operand is the constant pi, create a SolvedStep for it
          mathConf[i] = {
            total: Math.PI,
            details: '𝜋',
            containsCrit: false,
            containsFail: false,
          };
        } else if (mathConf[i].toString().toLowerCase() === 'pie') {
          // If the operand is pie, pi*e, create a SolvedStep for e and pi (and the multiplication symbol between them)
          mathConf[i] = {
            total: Math.PI,
            details: '𝜋',
            containsCrit: false,
            containsFail: false,
          };
          mathConf.splice(
            i + 1,
            0,
            ...[
              '*',
              {
                total: Math.E,
                details: '*e*',
                containsCrit: false,
                containsFail: false,
              },
            ],
          );
        } else if (!operators.includes(mathConf[i].toString())) {
          // If nothing else has handled it by now, try it as a roll
          const formattedRoll = formatRoll(mathConf[i].toString(), modifiers.maxRoll, modifiers.nominalRoll);
          mathConf[i] = formattedRoll.solvedStep;
          tempCountDetails.push(formattedRoll.countDetails);
        }

        if (mathConf[i - 1] === '-' && ((!mathConf[i - 2] && mathConf[i - 2] !== 0) || mathConf[i - 2] === '(')) {
          if (typeof mathConf[i] === 'number') {
            mathConf[i] = <number> mathConf[i] * -1;
          } else {
            (<SolvedStep> mathConf[i]).total = (<SolvedStep> mathConf[i]).total * -1;
            (<SolvedStep> mathConf[i]).details = `-${(<SolvedStep> mathConf[i]).details}`;
          }
          mathConf.splice(i - 1, 1);
          i--;
        }
      }

      // Now that mathConf is parsed, send it into the solver
      const tempSolved = fullSolver(mathConf, false);

      // Push all of this step's solved data into the temp array
      tempReturnData.push({
        rollTotal: tempSolved.total,
        rollPostFormat: tempFormat,
        rollDetails: tempSolved.details,
        containsCrit: tempSolved.containsCrit,
        containsFail: tempSolved.containsFail,
        initConfig: tempConf,
      });
    }

    // Parsing/Solving done, time to format the output for Discord

    // Remove any floating spaces from fullCmd
    if (fullCmd[fullCmd.length - 1] === ' ') {
      fullCmd = fullCmd.substring(0, fullCmd.length - 1);
    }

    // Escape any | and ` chars in fullCmd to prevent spoilers and code blocks from acting up
    fullCmd = escapeCharacters(fullCmd, '|');
    fullCmd = fullCmd.replace(/`/g, '');

    let line1 = '';
    let line2 = '';
    let line3 = '';

    // If maximiseRoll or nominalRoll are on, mark the output as such, else use default formatting
    if (modifiers.maxRoll) {
      line1 = ` requested the theoretical maximum of:\n\`${config.prefix}${fullCmd}\``;
      line2 = 'Theoretical Maximum Results: ';
    } else if (modifiers.nominalRoll) {
      line1 = ` requested the theoretical nominal of:\n\`${config.prefix}${fullCmd}\``;
      line2 = 'Theoretical Nominal Results: ';
    } else if (modifiers.order === 'a') {
      line1 = ` requested the following rolls to be ordered from least to greatest:\n\`${config.prefix}${fullCmd}\``;
      line2 = 'Results: ';
      tempReturnData.sort(compareTotalRolls);
    } else if (modifiers.order === 'd') {
      line1 = ` requested the following rolls to be ordered from greatest to least:\n\`${config.prefix}${fullCmd}\``;
      line2 = 'Results: ';
      tempReturnData.sort(compareTotalRolls);
      tempReturnData.reverse();
    } else {
      line1 = ` rolled:\n\`${config.prefix}${fullCmd}\``;
      line2 = 'Results: ';
    }

    // Fill out all of the details and results now
    tempReturnData.forEach((e) => {
      loggingEnabled && log(LT.LOG, `Parsing roll ${fullCmd} | Making return text ${JSON.stringify(e)}`);
      let preFormat = '';
      let postFormat = '';

      // If the roll containted a crit success or fail, set the formatting around it
      if (e.containsCrit) {
        preFormat = `**${preFormat}`;
        postFormat = `${postFormat}**`;
      }
      if (e.containsFail) {
        preFormat = `__${preFormat}`;
        postFormat = `${postFormat}__`;
      }

      // Populate line2 (the results) and line3 (the details) with their data
      if (modifiers.order === '') {
        line2 += `${preFormat}${e.rollTotal}${postFormat}${escapeCharacters(e.rollPostFormat, '|*_~`')}`;
      } else {
        // If order is on, turn rolls into csv without formatting
        line2 += `${preFormat}${e.rollTotal}${postFormat}, `;
      }

      line2 = line2
        .replace(/\*\*\*\*/g, '** **')
        .replace(/____/g, '__ __')
        .replace(/~~~~/g, '~~ ~~');

      line3 += `\`${e.initConfig}\` = ${e.rollDetails} = ${preFormat}${e.rollTotal}${postFormat}\n`;
    });

    // If order is on, remove trailing ", "
    if (modifiers.order !== '') {
      line2 = line2.substring(0, line2.length - 2);
    }

    // Fill in the return block
    returnmsg.line1 = line1;
    returnmsg.line2 = line2;
    returnmsg.line3 = line3;

    // Reduce counts to a single object
    returnmsg.counts = tempCountDetails.reduce((acc, cnt) => ({
      total: acc.total + cnt.total,
      successful: acc.successful + cnt.successful,
      failed: acc.failed + cnt.failed,
      rerolled: acc.rerolled + cnt.rerolled,
      dropped: acc.dropped + cnt.dropped,
      exploded: acc.exploded + cnt.exploded,
    }));
  } catch (e) {
    const solverError = e as Error;
    // Welp, the unthinkable happened, we hit an error

    // Split on _ for the error messages that have more info than just their name
    const [errorName, errorDetails] = solverError.message.split('_');

    let errorMsg = '';

    // Translate the errorName to a specific errorMsg
    switch (errorName) {
      case 'YouNeedAD':
        errorMsg = 'Formatting Error: Missing die size and count config';
        break;
      case 'FormattingError':
        errorMsg = 'Formatting Error: Cannot use Keep and Drop at the same time, remove all but one and repeat roll';
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
            errorMsg += 'Drop (d or dl)';
            break;
          case 'keep':
            errorMsg += 'Keep (k or kh)';
            break;
          case 'dropHigh':
            errorMsg += 'Drop Highest (dh)';
            break;
          case 'keepLow':
            errorMsg += 'Keep Lowest (kl)';
            break;
          case 'reroll':
            errorMsg += 'Reroll (r)';
            break;
          case 'critScore':
            errorMsg += 'Crit Score (cs)';
            break;
          default:
            errorMsg += `Unhandled - ${errorDetails}`;
            break;
        }
        errorMsg += ' cannot be zero';
        break;
      case 'CritScoreMinGtrMax':
        errorMsg = 'Formatting Error: CritScore maximum cannot be greater than minimum, check formatting and flip min/max';
        break;
      case 'MaxLoopsExceeded':
        errorMsg = 'Error: Roll is too complex or reaches infinity';
        break;
      case 'UnbalancedParens':
        errorMsg = 'Formatting Error: At least one of the equations contains unbalanced parenthesis';
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
      default:
        log(LT.ERROR, `Undangled Error: ${errorName}, ${errorDetails}`);
        errorMsg = `Unhandled Error: ${solverError.message}\nCheck input and try again, if issue persists, please use \`${config.prefix}report\` to alert the devs of the issue`;
        break;
    }

    // Fill in the return block
    returnmsg.error = true;
    returnmsg.errorCode = solverError.message;
    returnmsg.errorMsg = errorMsg;
  }

  return returnmsg;
};
