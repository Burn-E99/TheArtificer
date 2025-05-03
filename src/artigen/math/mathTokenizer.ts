import { log, LogTypes as LT } from '@Log4Deno';

import { ReturnData } from 'artigen/artigen.d.ts';

import { MathConf, SolvedStep } from 'artigen/math/math.d.ts';

import { CountDetails, RollModifiers } from 'artigen/dice/dice.d.ts';
import { generateFormattedRoll } from 'artigen/dice/generateFormattedRoll.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

import { mathSolver } from 'artigen/math/mathSolver.ts';

import { cmdSplitRegex, internalWrapRegex } from 'artigen/utils/escape.ts';
import { legalMathOperators } from 'artigen/utils/legalMath.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { assertParenBalance } from 'artigen/utils/parenBalance.ts';

const operators = ['(', ')', '^', '*', '/', '%', '+', '-'];

export const tokenizeMath = (cmd: string, modifiers: RollModifiers, previousResults: number[]): [ReturnData[], CountDetails[]] => {
  const countDetails: CountDetails[] = [];

  loggingEnabled && log(LT.LOG, `Parsing roll ${cmd} | ${JSON.stringify(modifiers)} | ${JSON.stringify(previousResults)}`);

  // Remove all spaces from the operation config and split it by any operator (keeping the operator in mathConf for fullSolver to do math on)
  const mathConf: MathConf[] = cmd
    .replace(cmdSplitRegex, '')
    .replace(internalWrapRegex, '')
    .replace(/ /g, '')
    .split(/([-+()*/^]|(?<![d%])%)|(x\d+(\.\d*)?)/g)
    .filter((x) => x);
  loggingEnabled && log(LT.LOG, `Split roll into mathConf ${JSON.stringify(mathConf)}`);

  // Verify balanced parens before doing anything
  assertParenBalance(mathConf);

  // Evaluate all rolls into stepSolve format and all numbers into floats
  for (let i = 0; i < mathConf.length; i++) {
    loopCountCheck();

    loggingEnabled && log(LT.LOG, `Parsing roll ${JSON.stringify(cmd)} | Evaluating rolls into math-able items ${JSON.stringify(mathConf[i])}`);

    const curMathConfStr = mathConf[i].toString();

    if (curMathConfStr.length === 0) {
      // If its an empty string, get it out of here
      mathConf.splice(i, 1);
      i--;
    } else if (mathConf[i] == parseFloat(curMathConfStr)) {
      // If its a number, parse the number out
      mathConf[i] = parseFloat(curMathConfStr);
    } else if (curMathConfStr.toLowerCase() === 'e') {
      // If the operand is the constant e, create a SolvedStep for it
      mathConf[i] = {
        total: Math.E,
        details: '*e*',
        containsCrit: false,
        containsFail: false,
      };
    } else if (curMathConfStr.toLowerCase() === 'fart' || curMathConfStr.toLowerCase() === '💩') {
      mathConf[i] = {
        total: 7,
        details: '💩',
        containsCrit: false,
        containsFail: false,
      };
    } else if (curMathConfStr.toLowerCase() === 'sex') {
      mathConf[i] = {
        total: 69,
        details: '( ͡° ͜ʖ ͡°)',
        containsCrit: false,
        containsFail: false,
      };
    } else if (curMathConfStr.toLowerCase() === 'inf' || curMathConfStr.toLowerCase() === 'infinity' || curMathConfStr.toLowerCase() === '∞') {
      // If the operand is the constant Infinity, create a SolvedStep for it
      mathConf[i] = {
        total: Infinity,
        details: '∞',
        containsCrit: false,
        containsFail: false,
      };
    } else if (curMathConfStr.toLowerCase() === 'pi' || curMathConfStr.toLowerCase() === '𝜋') {
      // If the operand is the constant pi, create a SolvedStep for it
      mathConf[i] = {
        total: Math.PI,
        details: '𝜋',
        containsCrit: false,
        containsFail: false,
      };
    } else if (curMathConfStr.toLowerCase() === 'pie') {
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
      i += 2;
    } else if (!legalMathOperators.includes(curMathConfStr) && legalMathOperators.some((mathOp) => curMathConfStr.endsWith(mathOp))) {
      // Identify when someone does something weird like 4floor(2.5) and split 4 and floor
      const matchedMathOp = legalMathOperators.filter((mathOp) => curMathConfStr.endsWith(mathOp))[0];
      mathConf[i] = parseFloat(curMathConfStr.replace(matchedMathOp, ''));

      mathConf.splice(i + 1, 0, ...['*', matchedMathOp]);
      i += 2;
    } else if (/(x\d+(\.\d*)?)/.test(curMathConfStr)) {
      // Identify when someone is using a variable from previous commands
      if (curMathConfStr.includes('.')) {
        // Verify someone did not enter x1.1 as a variable
        throw new Error(`IllegalVariable_${curMathConfStr}`);
      }

      const varIdx = parseInt(curMathConfStr.replaceAll('x', ''));

      // Get the index from the variable and attempt to use it to query the previousResults
      if (previousResults.length > varIdx) {
        mathConf[i] = parseFloat(previousResults[varIdx].toString());
      } else {
        throw new Error(`IllegalVariable_${curMathConfStr}`);
      }
    } else if (![...operators, ...legalMathOperators].includes(curMathConfStr)) {
      // If nothing else has handled it by now, try it as a roll
      const formattedRoll = generateFormattedRoll(curMathConfStr, modifiers);
      mathConf[i] = formattedRoll.solvedStep;
      countDetails.push(formattedRoll.countDetails);
    }

    // Identify if we are in a state where the current number is a negative number
    if (mathConf[i - 1] === '-' && ((!mathConf[i - 2] && mathConf[i - 2] !== 0) || operators.includes(<string> mathConf[i - 2]))) {
      if (typeof mathConf[i] === 'string') {
        // Current item is a mathOp, need to insert a "-1 *" before it
        mathConf.splice(i - 1, 1, ...[parseFloat('-1'), '*']);
        i += 2;
      } else {
        // Handle normally, just set current item to negative
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
  }

  // Now that mathConf is parsed, send it into the solver
  const tempSolved = mathSolver(mathConf);

  // Push all of this step's solved data into the temp array
  return [
    [
      {
        rollTotal: tempSolved.total,
        rollPreFormat: '',
        rollPostFormat: '',
        rollDetails: tempSolved.details,
        containsCrit: tempSolved.containsCrit,
        containsFail: tempSolved.containsFail,
        initConfig: cmd,
      },
    ],
    countDetails,
  ];
};
