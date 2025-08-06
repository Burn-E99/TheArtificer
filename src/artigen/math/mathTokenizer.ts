import { log, LogTypes as LT } from '@Log4Deno';

import { ReturnData } from 'artigen/artigen.d.ts';

import { MathConf, SolvedStep } from 'artigen/math/math.d.ts';

import { CountDetails, ExecutedRoll, GroupConf, RollDistributionMap, RollModifiers, RollSet } from 'artigen/dice/dice.d.ts';
import { formatRoll } from 'artigen/dice/generateFormattedRoll.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

import { mathSolver } from 'artigen/math/mathSolver.ts';

import { closeInternalGrp, cmdSplitRegex, internalWrapRegex, mathSplitRegex, openInternalGrp } from 'artigen/utils/escape.ts';
import { legalMathOperators } from 'artigen/utils/legalMath.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { assertParenBalance } from 'artigen/utils/parenBalance.ts';
import { executeRoll } from 'artigen/dice/executeRoll.ts';
import { compareOrigIdx, compareRolls } from 'artigen/utils/sortFuncs.ts';

// minusOps are operators that will cause a negative sign to collapse into a number (in cases like + - 1)
const minusOps = ['(', '^', '**', '*', '/', '%', '+', '-'];
const allOps = [...minusOps, ')'];

export const tokenizeMath = (
  cmd: string,
  modifiers: RollModifiers,
  previousResults: number[],
  groupResults: ReturnData[],
  groupConf: GroupConf | null = null,
): [ReturnData[], CountDetails[], RollDistributionMap[]] => {
  const countDetails: CountDetails[] = [];
  const rollDists: RollDistributionMap[] = [];
  const executedRolls: Map<number, ExecutedRoll> = new Map();

  loggingEnabled && log(LT.LOG, `Parsing roll ${cmd} | ${JSON.stringify(modifiers)} | ${JSON.stringify(previousResults)}`);

  // Remove all spaces from the operation config and split it by any operator (keeping the operator in mathConf for fullSolver to do math on)
  const mathConf: MathConf[] = cmd
    .replace(cmdSplitRegex, '')
    .replace(internalWrapRegex, '')
    .replace(/ /g, '')
    .split(mathSplitRegex)
    .filter((x) => x);
  loggingEnabled && log(LT.LOG, `Split roll into mathConf ${JSON.stringify(mathConf)}`);

  // Verify balanced parens before doing anything
  if (mathConf.includes('(') || mathConf.includes(')')) assertParenBalance(mathConf);

  // Evaluate all rolls into stepSolve format and all numbers into floats
  for (let i = 0; i < mathConf.length; i++) {
    loopCountCheck('mathTokenizer.ts - parsing all tokens into MathConf');

    loggingEnabled && log(LT.LOG, `Parsing roll ${JSON.stringify(cmd)} | Evaluating rolls into math-able items ${JSON.stringify(mathConf[i])}`);

    const curMathConfStr = mathConf[i].toString();

    if (curMathConfStr.length === 0) {
      // If its an empty string, get it out of here
      mathConf.splice(i, 1);
      i--;
    } else if (mathConf[i] == parseFloat(curMathConfStr)) {
      // If its a number, parse the number out
      mathConf[i] = parseFloat(curMathConfStr);
    } else if (curMathConfStr.startsWith(openInternalGrp)) {
      const groupIdx = parseInt(curMathConfStr.substring(1, curMathConfStr.indexOf(closeInternalGrp)));
      if (groupIdx >= groupResults.length) {
        throw new Error('InternalGroupMachineBroke');
      }
      mathConf[i] = {
        total: groupResults[groupIdx].rollTotal,
        details: groupResults[groupIdx].rollDetails,
        containsCrit: groupResults[groupIdx].containsCrit,
        containsFail: groupResults[groupIdx].containsFail,
        isComplex: groupResults[groupIdx].isComplex,
      };
    } else if (curMathConfStr.toLowerCase() === 'e') {
      // If the operand is the constant e, create a SolvedStep for it
      mathConf[i] = {
        total: Math.E,
        details: '*e*',
        containsCrit: false,
        containsFail: false,
        isComplex: false,
      };
    } else if (curMathConfStr.toLowerCase() === 'lemon' || curMathConfStr.toLowerCase() === '🍋') {
      mathConf[i] = {
        total: 5,
        details: '🍋',
        containsCrit: false,
        containsFail: false,
        isComplex: false,
      };
    } else if (curMathConfStr.toLowerCase() === 'horse' || curMathConfStr.toLowerCase() === '🐴') {
      mathConf[i] = {
        total: Math.sqrt(3),
        details: '🐴',
        containsCrit: false,
        containsFail: false,
        isComplex: false,
      };
    } else if (curMathConfStr.toLowerCase() === 'fart' || curMathConfStr.toLowerCase() === '💩') {
      mathConf[i] = {
        total: 7,
        details: '💩',
        containsCrit: false,
        containsFail: false,
        isComplex: false,
      };
    } else if (curMathConfStr.toLowerCase() === 'sex' || curMathConfStr.toLowerCase() === '🍆🍑' || curMathConfStr.toLowerCase() === '🍑🍆') {
      mathConf[i] = {
        total: 69,
        details: '( ͡° ͜ʖ ͡°)',
        containsCrit: false,
        containsFail: false,
        isComplex: false,
      };
    } else if (curMathConfStr.toLowerCase() === 'inf' || curMathConfStr.toLowerCase() === 'infinity' || curMathConfStr.toLowerCase() === '∞') {
      // If the operand is the constant Infinity, create a SolvedStep for it
      mathConf[i] = {
        total: Infinity,
        details: '∞',
        containsCrit: false,
        containsFail: false,
        isComplex: false,
      };
    } else if (curMathConfStr.toLowerCase() === 'pi' || curMathConfStr.toLowerCase() === '𝜋') {
      // If the operand is the constant pi, create a SolvedStep for it
      mathConf[i] = {
        total: Math.PI,
        details: '𝜋',
        containsCrit: false,
        containsFail: false,
        isComplex: false,
      };
    } else if (curMathConfStr.toLowerCase() === 'pie' || curMathConfStr.toLowerCase() === '🥧') {
      // If the operand is pie, pi*e, create a SolvedStep for e and pi (and the multiplication symbol between them)
      mathConf[i] = {
        total: Math.PI,
        details: '𝜋',
        containsCrit: false,
        containsFail: false,
        isComplex: false,
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
            isComplex: false,
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
    } else if (/(y\d+(\.\d*)?)/.test(curMathConfStr)) {
      // Identify when someone is using a variable from alias input
      if (curMathConfStr.includes('.')) {
        // Verify someone did not enter y1.1 as a variable
        throw new Error(`IllegalVariable_${curMathConfStr}`);
      }

      const yValue = modifiers.yVars.get(curMathConfStr);
      if (typeof yValue === 'number') {
        mathConf[i] = yValue;
      } else {
        throw new Error(`VariableMissingValue_${curMathConfStr}`);
      }
    } else if (![...allOps, ...legalMathOperators].includes(curMathConfStr)) {
      // If nothing else has handled it by now, try it as a roll
      const executedRoll = executeRoll(curMathConfStr, modifiers);
      if (groupConf) {
        executedRolls.set(i, executedRoll);
      } else {
        const formattedRoll = formatRoll(executedRoll, modifiers);
        mathConf[i] = formattedRoll.solvedStep;
        countDetails.push(formattedRoll.countDetails);
        if (modifiers.rollDist) rollDists.push(formattedRoll.rollDistributions);
      }
    }

    // Identify if we are in a state where the current number is a negative number
    if (mathConf[i - 1] === '-' && ((!mathConf[i - 2] && mathConf[i - 2] !== 0) || minusOps.includes(<string> mathConf[i - 2]))) {
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

  // Handle applying the group config
  if (groupConf) {
    loggingEnabled && log(LT.LOG, `Applying groupConf to executedRolls | ${JSON.stringify(groupConf)} ${JSON.stringify(executedRolls.entries().toArray())}`);
    // Merge all rollSets into one array, adding the idx into each rollSet to allow separating them back out
    const allRollSets: RollSet[] = [];
    const executedRollArr = executedRolls.entries().toArray();
    executedRollArr.forEach(([rollGroupIdx, executedRoll]) => {
      executedRoll.rollSet.forEach((roll) => (roll.rollGrpIdx = rollGroupIdx));
      allRollSets.push(...executedRoll.rollSet);
    });
    loggingEnabled && log(LT.LOG, `raw rollSets: ${JSON.stringify(allRollSets)}`);

    // Handle drop or keep operations
    if (groupConf.drop.on || groupConf.keep.on || groupConf.dropHigh.on || groupConf.keepLow.on) {
      allRollSets.sort(compareRolls);
      let dropCount = 0;

      // For normal drop and keep, simple subtraction is enough to determine how many to drop
      // Protections are in to prevent the dropCount from going below 0 or more than the valid rolls to drop
      if (groupConf.drop.on) {
        dropCount = groupConf.drop.count;
        if (dropCount > allRollSets.length) {
          dropCount = allRollSets.length;
        }
      } else if (groupConf.keep.on) {
        dropCount = allRollSets.length - groupConf.keep.count;
        if (dropCount < 0) {
          dropCount = 0;
        }
      } // For inverted drop and keep, order must be flipped to greatest to least before the simple subtraction can determine how many to drop
      // Protections are in to prevent the dropCount from going below 0 or more than the valid rolls to drop
      else if (groupConf.dropHigh.on) {
        allRollSets.reverse();
        dropCount = groupConf.dropHigh.count;
        if (dropCount > allRollSets.length) {
          dropCount = allRollSets.length;
        }
      } else if (groupConf.keepLow.on) {
        allRollSets.reverse();
        dropCount = allRollSets.length - groupConf.keepLow.count;
        if (dropCount < 0) {
          dropCount = 0;
        }
      }

      let i = 0;
      while (dropCount > 0 && i < allRollSets.length) {
        loopCountCheck('mathTokenizer.ts - handling group dropping');

        loggingEnabled && log(LT.LOG, `Handling group dropping | Dropping ${dropCount}, looking at ${JSON.stringify(allRollSets[i])}`);

        if (!allRollSets[i].dropped && !allRollSets[i].rerolled) {
          allRollSets[i].dropped = true;
          allRollSets[i].success = false;
          allRollSets[i].fail = false;
          allRollSets[i].matchLabel = '';
          dropCount--;
        }

        i++;
      }

      allRollSets.sort(compareOrigIdx);
    }

    // Handle marking new successes/fails
    if (groupConf.success.on || groupConf.fail.on) {
      allRollSets.forEach((rs) => {
        loopCountCheck('mathTokenizer.ts - handling group success/fails');

        if (!rs.dropped && !rs.rerolled) {
          if (groupConf.success.on && groupConf.success.range.includes(rs.roll)) {
            rs.success = true;
            rs.matchLabel = 'S';
          }
          if (groupConf.fail.on && groupConf.fail.range.includes(rs.roll)) {
            rs.fail = true;
            rs.matchLabel = 'F';
          }
        }
      });
    }

    // Handle separating the rollSets back out, recalculating the success/fail count, assigning them to the correct mathConf slots
    executedRollArr.forEach(([rollGroupIdx, executedRoll]) => {
      // Update flags on executedRoll
      executedRoll.countSuccessOverride = executedRoll.countSuccessOverride || groupConf.success.on;
      executedRoll.countFailOverride = executedRoll.countFailOverride || groupConf.fail.on;
      executedRoll.rollSet = allRollSets.filter((rs) => rs.rollGrpIdx === rollGroupIdx);

      const formattedRoll = formatRoll(executedRoll, modifiers);
      mathConf[rollGroupIdx] = formattedRoll.solvedStep;
      countDetails.push(formattedRoll.countDetails);
      if (modifiers.rollDist) rollDists.push(formattedRoll.rollDistributions);
    });
  }

  // Now that mathConf is parsed, send it into the solver
  loggingEnabled && log(LT.LOG, `Sending mathConf to solver ${JSON.stringify(mathConf)}`);
  const tempSolved = mathSolver(mathConf);
  loggingEnabled && log(LT.LOG, `SolvedStep back from mathSolver ${JSON.stringify(tempSolved)}`);

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
        isComplex: tempSolved.isComplex,
      },
    ],
    countDetails,
    rollDists,
  ];
};
