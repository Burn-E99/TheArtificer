/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

import {
	log,
	// Log4Deno deps
	LT,
} from '../../deps.ts';

import { SolvedStep, RollType } from './solver.d.ts';
import { loggingEnabled } from './rollUtils.ts';

// fullSolver(conf, wrapDetails) returns one condensed SolvedStep
// fullSolver is a function that recursively solves the full roll and math
export const fullSolver = (conf: (string | number | SolvedStep)[], wrapDetails: boolean): SolvedStep => {
	// Initialize PEMDAS
	const signs = ['^', '*', '/', '%', '+', '-'];
	const stepSolve = {
		rollType: <RollType> '',
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
	while (conf.indexOf('(') > -1) {
		loggingEnabled && log(LT.LOG, `Evaluating roll ${JSON.stringify(conf)} | Looking for (`);
		// Get first open parenthesis
		const openParen = conf.indexOf('(');
		let closeParen = -1;
		let nextParen = 0;

		// Using nextParen to count the opening/closing parens, find the matching paren to openParen above
		for (let i = openParen; i < conf.length; i++) {
			loggingEnabled && log(LT.LOG, `Evaluating roll ${JSON.stringify(conf)} | Looking for matching ) openIdx: ${openParen} checking: ${i}`);
			// If we hit an open, add one (this includes the openParen we start with), if we hit a close, subtract one
			if (conf[i] === '(') {
				nextParen++;
			} else if (conf[i] === ')') {
				nextParen--;
			}

			// When nextParen reaches 0 again, we will have found the matching closing parenthesis and can safely exit the for loop
			if (nextParen === 0) {
				closeParen = i;
				break;
			}
		}

		// Make sure we did find the correct closing paren, if not, error out now
		if (closeParen === -1 || closeParen < openParen) {
			throw new Error('UnbalancedParens');
		}

		// Replace the itemes between openParen and closeParen (including the parens) with its solved equilvalent by calling the solver on the items between openParen and closeParen (excluding the parens)
		conf.splice(openParen, closeParen + 1, fullSolver(conf.slice(openParen + 1, closeParen), true));

		// Determing if we need to add in a multiplication sign to handle implicit multiplication (like "(4)2" = 8)
		// insertedMult flags if there was a multiplication sign inserted before the parens
		let insertedMult = false;
		// Check if a number was directly before openParen and slip in the "*" if needed
		if (((openParen - 1) > -1) && (signs.indexOf(conf[openParen - 1].toString()) === -1)) {
			insertedMult = true;
			conf.splice(openParen, 0, '*');
		}
		// Check if a number is directly after closeParen and slip in the "*" if needed
		if (!insertedMult && (((openParen + 1) < conf.length) && (signs.indexOf(conf[openParen + 1].toString()) === -1))) {
			conf.splice(openParen + 1, 0, '*');
		} else if (insertedMult && (((openParen + 2) < conf.length) && (signs.indexOf(conf[openParen + 2].toString()) === -1))) {
			// insertedMult is utilized here to let us account for an additional item being inserted into the array (the "*" from before openParn)
			conf.splice(openParen + 2, 0, '*');
		}
	}

	// Evaluate all EMMDAS by looping thru each teir of operators (exponential is the higehest teir, addition/subtraction the lowest)
	const allCurOps = [['^'], ['*', '/', '%'], ['+', '-']];
	allCurOps.forEach((curOps) => {
		loggingEnabled && log(LT.LOG, `Evaluating roll ${JSON.stringify(conf)} | Evaluating ${JSON.stringify(curOps)}`);
		// Iterate thru all operators/operands in the conf
		for (let i = 0; i < conf.length; i++) {
			loggingEnabled && log(LT.LOG, `Evaluating roll ${JSON.stringify(conf)} | Evaluating ${JSON.stringify(curOps)} | Checking ${JSON.stringify(conf[i])}`);
			// Check if the current index is in the active teir of operators
			if (curOps.indexOf(conf[i].toString()) > -1) {
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
					if (operand1) {
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
				if ((typeof oper1 === 'number') && (typeof oper2 === 'number')) {
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
	} else if (singleNum && (typeof (conf[0]) === 'number')) {
		// If we are only left with a number, populate the stepSolve with it
		stepSolve.total = conf[0];
		stepSolve.details = conf[0].toString();
	} else {
		// Else fully populate the stepSolve with what was computed
		stepSolve.total = (<SolvedStep> conf[0]).total;
		stepSolve.details = (<SolvedStep> conf[0]).details;
		stepSolve.containsCrit = (<SolvedStep> conf[0]).containsCrit;
		stepSolve.containsFail = (<SolvedStep> conf[0]).containsFail;
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
