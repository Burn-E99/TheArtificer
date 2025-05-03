/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */
import { log, LogTypes as LT } from '@Log4Deno';

import { MathConf, SolvedStep } from 'artigen/math/math.d.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

import { legalMath, legalMathOperators } from 'artigen/utils/legalMath.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { getMatchingParenIdx } from 'artigen/utils/parenBalance.ts';

// mathSolver(conf, wrapDetails) returns one condensed SolvedStep
// mathSolver is a function that recursively solves the full roll and math
export const mathSolver = (conf: MathConf[], wrapDetails = false): SolvedStep => {
  // Initialize PEMDAS
  const signs = ['^', '*', '/', '%', '+', '-'];
  const stepSolve: SolvedStep = {
    total: 0,
    details: '',
    containsCrit: false,
    containsFail: false,
  };

  // If entering with a single number, note it now
  let singleNum = false;
  if (conf.length === 1) {
    singleNum = true;
  }

  // Evaluate all parenthesis
  while (conf.includes('(')) {
    loopCountCheck();

    loggingEnabled && log(LT.LOG, `Evaluating roll ${JSON.stringify(conf)} | Looking for (`);
    // Get first open parenthesis
    let openParenIdx = conf.indexOf('(');
    const closeParenIdx = getMatchingParenIdx(conf, openParenIdx);

    // Call the solver on the items between openParenIdx and closeParenIdx (excluding the parens)
    const parenSolve = mathSolver(conf.slice(openParenIdx + 1, closeParenIdx), true);
    // Replace the items between openParenIdx and closeParenIdx (including the parens) with its solved equivalent
    conf.splice(openParenIdx, closeParenIdx - openParenIdx + 1, parenSolve);

    // Determine if previous idx is a Math operator and execute it
    if (openParenIdx - 1 > -1 && legalMathOperators.includes(conf[openParenIdx - 1].toString())) {
      // Update total and details of parenSolve
      parenSolve.total = legalMath[legalMathOperators.indexOf(conf[openParenIdx - 1].toString())](parenSolve.total);
      parenSolve.details = `${conf[openParenIdx - 1]}${parenSolve.details}`;

      conf.splice(openParenIdx - 1, 2, parenSolve);
      // shift openParenIdx as we have just removed something before it
      openParenIdx--;
    }

    // Determining if we need to add in a multiplication sign to handle implicit multiplication (like "(4)2" = 8)
    // Check if a number was directly before openParenIdx and slip in the "*" if needed
    if (openParenIdx - 1 > -1 && !signs.includes(conf[openParenIdx - 1].toString())) {
      conf.splice(openParenIdx, 0, '*');
      // shift openParenIdx as we have just added something before it
      openParenIdx++;
    }
    // Check if a number is directly after the closing paren and slip in the "*" if needed
    // openParenIdx is used here as the conf array has already been collapsed down
    if (openParenIdx + 1 < conf.length && !signs.includes(conf[openParenIdx + 1].toString())) {
      conf.splice(openParenIdx + 1, 0, '*');
    }
  }

  // Look for any implicit multiplication that may have been missed
  // Start at index 1 as there will never be implicit multiplication before the first element
  for (let i = 1; i < conf.length; i++) {
    loopCountCheck();

    const prevConfAsStr = <string> conf[i - 1];
    const curConfAsStr = <string> conf[i];
    if (!signs.includes(curConfAsStr) && !signs.includes(prevConfAsStr)) {
      // Both previous and current conf are operators, slip in the "*"
      conf.splice(i, 0, '*');
    }
  }

  // At this point, conf should be [num, op, num, op, num, op, num, etc]

  // Evaluate all EMDAS by looping thru each tier of operators (exponential is the highest tier, addition/subtraction the lowest)
  const allCurOps = [['^'], ['*', '/', '%'], ['+', '-']];
  allCurOps.forEach((curOps) => {
    loggingEnabled && log(LT.LOG, `Evaluating roll ${JSON.stringify(conf)} | Evaluating ${JSON.stringify(curOps)}`);
    // Iterate thru all operators/operands in the conf
    for (let i = 0; i < conf.length; i++) {
      loopCountCheck();

      loggingEnabled && log(LT.LOG, `Evaluating roll ${JSON.stringify(conf)} | Evaluating ${JSON.stringify(curOps)} | Checking ${JSON.stringify(conf[i])}`);
      // Check if the current index is in the active tier of operators
      if (curOps.includes(conf[i].toString())) {
        // Grab the operands from before and after the operator
        const operand1 = conf[i - 1];
        const operand2 = conf[i + 1];
        // Init temp math to NaN to catch bad parsing
        let oper1 = NaN;
        let oper2 = NaN;
        const subStepSolve = {
          total: NaN,
          details: '',
          containsCrit: false,
          containsFail: false,
        };

        // If operand1 is a SolvedStep, populate our subStepSolve with its details and crit/fail flags
        if (typeof operand1 === 'object') {
          oper1 = operand1.total;
          subStepSolve.details = `${operand1.details}\\${conf[i]}`;
          subStepSolve.containsCrit = operand1.containsCrit;
          subStepSolve.containsFail = operand1.containsFail;
        } else {
          // else parse it as a number and add it to the subStep details
          if (operand1 || operand1 == 0) {
            oper1 = parseFloat(operand1.toString());
            subStepSolve.details = `${oper1.toString()}\\${conf[i]}`;
          }
        }

        // If operand2 is a SolvedStep, populate our subStepSolve with its details without overriding what operand1 filled in
        if (typeof operand2 === 'object') {
          oper2 = operand2.total;
          subStepSolve.details += operand2.details;
          subStepSolve.containsCrit = subStepSolve.containsCrit || operand2.containsCrit;
          subStepSolve.containsFail = subStepSolve.containsFail || operand2.containsFail;
        } else {
          // else parse it as a number and add it to the subStep details
          oper2 = parseFloat(operand2.toString());
          subStepSolve.details += oper2;
        }

        // Make sure neither operand is NaN before continuing
        if (isNaN(oper1) || isNaN(oper2)) {
          throw new Error('OperandNaN');
        }

        // Verify a second time that both are numbers before doing math, throwing an error if necessary
        if (typeof oper1 === 'number' && typeof oper2 === 'number') {
          // Finally do the operator on the operands, throw an error if the operator is not found
          switch (conf[i]) {
            case '^':
              subStepSolve.total = Math.pow(oper1, oper2);
              break;
            case '*':
              subStepSolve.total = oper1 * oper2;
              break;
            case '/':
              subStepSolve.total = oper1 / oper2;
              break;
            case '%':
              subStepSolve.total = oper1 % oper2;
              break;
            case '+':
              subStepSolve.total = oper1 + oper2;
              break;
            case '-':
              subStepSolve.total = oper1 - oper2;
              break;
            default:
              throw new Error('OperatorWhat');
          }
        } else {
          throw new Error('EMDASNotNumber');
        }

        // Replace the two operands and their operator with our subStepSolve
        conf.splice(i - 1, 3, subStepSolve);
        // Because we are messing around with the array we are iterating thru, we need to back up one idx to make sure every operator gets processed
        i--;
      }
    }
  });

  // If we somehow have more than one item left in conf at this point, something broke, throw an error
  if (conf.length > 1) {
    loggingEnabled && log(LT.LOG, `ConfWHAT? ${JSON.stringify(conf)}`);
    throw new Error('ConfWhat');
  } else if (singleNum && typeof conf[0] === 'number') {
    // If we are only left with a number, populate the stepSolve with it
    stepSolve.total = conf[0];
    stepSolve.details = conf[0].toString();
  } else {
    // Else fully populate the stepSolve with what was computed
    const tempConf = <SolvedStep> conf[0];
    stepSolve.total = tempConf.total;
    stepSolve.details = tempConf.details;
    stepSolve.containsCrit = tempConf.containsCrit;
    stepSolve.containsFail = tempConf.containsFail;
  }

  // If this was a nested call, add on parens around the details to show what math we've done
  if (wrapDetails) {
    stepSolve.details = `(${stepSolve.details})`;
  }

  // If our total has reached undefined for some reason, error out now
  if (stepSolve.total === undefined) {
    throw new Error('UndefinedStep');
  }

  return stepSolve;
};
