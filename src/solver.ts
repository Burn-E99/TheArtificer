/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

import { RollSet, SolvedStep, SolvedRoll } from "./solver.d.ts";

// MAXLOOPS determines how long the bot will attempt a roll
// Default is 5000000 (5 million), which results in at most a 10 second delay before the bot calls the roll infinite or too complex
// Increase at your own risk
const MAXLOOPS = 5000000;

// genRoll(size) returns number
// genRoll rolls a die of size size and returns the result
const genRoll = (size: number): number => {
	// Math.random * size will return a decimal number between 0 and size (excluding size), so add 1 and floor the result to not get 0 as a result
	return Math.floor((Math.random() * size) + 1);
};

// compareRolls(a, b) returns -1|0|1
// compareRolls is used to order an array of RollSets by RollSet.roll
const compareRolls = (a: RollSet, b: RollSet): number => {
	if (a.roll < b.roll) {
		return -1;
	}
	if (a.roll > b.roll) {
		return 1;
	}
	return 0;
};

// compareRolls(a, b) returns -1|0|1
// compareRolls is used to order an array of RollSets by RollSet.origidx
const compareOrigidx = (a: RollSet, b: RollSet): number => {
	if (a.origidx < b.origidx) {
		return -1;
	}
	if (a.origidx > b.origidx) {
		return 1;
	}
	return 0;
};

// escapeCharacters(str, esc) returns str
// escapeCharacters escapes all characters listed in esc
const escapeCharacters = (str: string, esc: string): string => {
	// Loop thru each esc char one at a time
	for (let i = 0; i < esc.length; i++) {
		// Create a new regex to look for that char that needs replaced and escape it
		const temprgx = new RegExp(`[${esc[i]}]`, "g");
		str = str.replace(temprgx, ("\\" + esc[i]));
	}
	return str;
};

// roll(rollStr, maximiseRoll, nominalRoll) returns RollSet
// roll parses and executes the rollStr, if needed it will also make the roll the maximum or average
const roll = (rollStr: string, maximiseRoll: boolean, nominalRoll: boolean): RollSet[] => {
	/* Roll Capabilities
	 * Deciphers and rolls a single dice roll set
	 * xdydzracsq!
	 *
	 * x            [OPT] - number of dice to roll, if omitted, 1 is used
	 * dy           [REQ] - size of dice to roll, d20 = 20 sided die
	 * dz || dlz    [OPT] - drops the lowest z dice, cannot be used with kz
	 * kz || khz    [OPT] - keeps the highest z dice, cannot be used with dz
	 * dhz          [OPT] - drops the highest z dice, cannot be used with kz
	 * klz          [OPT] - keeps the lowest z dice, cannot be used with dz
	 * ra           [OPT] - rerolls any rolls that match a, r3 will reroll any dice that land on 3, throwing out old rolls
	 * csq || cs=q  [OPT] - changes crit score to q
	 * cs<q         [OPT] - changes crit score to be less than or equal to q
	 * cs>q         [OPT] - changes crit score to be greater than or equal to q	 
	 * cfq || cs=q  [OPT] - changes crit fail to q
	 * cf<q         [OPT] - changes crit fail to be less than or equal to q
	 * cf>q         [OPT] - changes crit fail to be greater than or equal to q
	 * !            [OPT] - exploding, rolls another dy for every crit roll
	 */

	// Make entire roll lowercase for ease of parsing
	rollStr = rollStr.toLowerCase();

	// Split the roll on the die size (and the drop if its there)
	const dpts = rollStr.split("d");

	// Initialize the configuration to store the parsed data
	const rollConf = {
		dieCount: 0,
		dieSize: 0,
		drop: {
			on: false,
			count: 0
		},
		keep: {
			on: false,
			count: 0
		},
		dropHigh: {
			on: false,
			count: 0
		},
		keepLow: {
			on: false,
			count: 0
		},
		reroll: {
			on: false,
			nums: <number[]>[]
		},
		critScore: {
			on: false,
			range: <number[]>[]
		},
		critFail: {
			on: false,
			range: <number[]>[]
		},
		exploding: false
	};

	// If the dpts is not long enough, throw error
	if (dpts.length < 2) {
		throw new Error("YouNeedAD");
	}

	// Fill out the die count, first item will either be an int or empty string, short circuit execution will take care of replacing the empty string with a 1
	const tempDC = dpts.shift();
	rollConf.dieCount = parseInt(tempDC || "1");

	// Finds the end of the die size/beginnning of the additional options
	let afterDieIdx = dpts[0].search(/\D/);
	if (afterDieIdx === -1) {
		afterDieIdx = dpts[0].length;
	}

	// Rejoin all remaining parts
	let remains = dpts.join("");
	// Get the die size out of the remains and into the rollConf
	rollConf.dieSize = parseInt(remains.slice(0, afterDieIdx));
	remains = remains.slice(afterDieIdx);

	// Finish parsing the roll
	if (remains.length > 0) {
		// Determine if the first item is a drop, and if it is, add the d back in
		if (remains.search(/\D/) !== 0 || remains.indexOf("l") === 0 || remains.indexOf("h") === 0) {
			remains = "d" + remains;
		}

		// Loop until all remaining args are parsed
		while (remains.length > 0) {
			// Find the next number in the remains to be able to cut out the rule name
			let afterSepIdx = remains.search(/\d/);
			if (afterSepIdx < 0) {
				afterSepIdx = remains.length;
			}
			// Save the rule name to tSep and remove it from remains
			const tSep = remains.slice(0, afterSepIdx);
			remains = remains.slice(afterSepIdx);
			// Find the next non-number in the remains to be able to cut out the count/num
			let afterNumIdx = remains.search(/\D/);
			if (afterNumIdx < 0) {
				afterNumIdx = remains.length;
			}
			// Save the count/num to tNum leaving it in remains for the time being
			const tNum = parseInt(remains.slice(0, afterNumIdx));

			// Switch on rule name
			switch (tSep) {
				case "dl":
				case "d":
					// Configure Drop (Lowest)
					rollConf.drop.on = true;
					rollConf.drop.count = tNum;
					break;
				case "kh":
				case "k":
					// Configure Keep (Highest)
					rollConf.keep.on = true;
					rollConf.keep.count = tNum;
					break;
				case "dh":
					// Configure Drop (Highest)
					rollConf.dropHigh.on = true;
					rollConf.dropHigh.count = tNum;
					break;
				case "kl":
					// Configure Keep (Lowest)
					rollConf.keepLow.on = true;
					rollConf.keepLow.count = tNum;
					break;
				case "r":
					// Configure Reroll (this can happen multiple times)
					rollConf.reroll.on = true;
					rollConf.reroll.nums.push(tNum);
					break;
				case "cs":
				case "cs=":
					// Configure CritScore for one number (this can happen multiple times)
					rollConf.critScore.on = true;
					rollConf.critScore.range.push(tNum);
					break;
				case "cs>":
					// Configure CritScore for all numbers greater than or equal to tNum (this could happen multiple times, but why)
					rollConf.critScore.on = true;
					for (let i = tNum; i <= rollConf.dieSize; i++) {
						rollConf.critScore.range.push(i);
					}
					break;
				case "cs<":
					// Configure CritScore for all numbers less than or equal to tNum (this could happen multiple times, but why)
					rollConf.critScore.on = true;
					for (let i = 0; i <= tNum; i++) {
						rollConf.critScore.range.push(i);
					}
					break;
				case "cf":
				case "cf=":
					// Configure CritFail for one number (this can happen multiple times)
					rollConf.critFail.on = true;
					rollConf.critFail.range.push(tNum);
					break;
				case "cf>":
					// Configure CritFail for all numbers greater than or equal to tNum (this could happen multiple times, but why)
					rollConf.critFail.on = true;
					for (let i = tNum; i <= rollConf.dieSize; i++) {
						rollConf.critFail.range.push(i);
					}
					break;
				case "cf<":
					// Configure CritFail for all numbers less than or equal to tNum (this could happen multiple times, but why)
					rollConf.critFail.on = true;
					for (let i = 0; i <= tNum; i++) {
						rollConf.critFail.range.push(i);
					}
					break;
				case "!":
					// Configure Exploding
					rollConf.exploding = true;
					afterNumIdx = 1;
					break;
				default:
					// Throw error immediately if unknown op is encountered
					throw new Error("UnknownOperation_" + tSep);
			}
			// Finally slice off everything else parsed this loop
			remains = remains.slice(afterNumIdx);
		}
	}

	// Verify the parse, throwing errors for every invalid config
	if (rollConf.dieCount < 0) {
		throw new Error("NoZerosAllowed_base");
	}
	if (rollConf.dieCount === 0 || rollConf.dieSize === 0) {
		throw new Error("NoZerosAllowed_base");
	}
	// Since only one drop or keep option can be active, count how many are active to throw the right error
	let dkdkCnt = 0;
	[rollConf.drop.on, rollConf.keep.on, rollConf.dropHigh.on, rollConf.keepLow.on].forEach(e => {
		if (e) {
			dkdkCnt++;
		}
	});
	if (dkdkCnt > 1) {
		throw new Error("FormattingError_dk");
	}
	if (rollConf.drop.on && rollConf.drop.count === 0) {
		throw new Error("NoZerosAllowed_drop");
	}
	if (rollConf.keep.on && rollConf.keep.count === 0) {
		throw new Error("NoZerosAllowed_keep");
	}
	if (rollConf.dropHigh.on && rollConf.dropHigh.count === 0) {
		throw new Error("NoZerosAllowed_dropHigh");
	}
	if (rollConf.keepLow.on && rollConf.keepLow.count === 0) {
		throw new Error("NoZerosAllowed_keepLow");
	}
	if (rollConf.reroll.on && rollConf.reroll.nums.indexOf(0) >= 0) {
		throw new Error("NoZerosAllowed_reroll");
	}

	// Roll the roll
	const rollSet = [];
	/* Roll will contain objects of the following format:
	 * 	{
	 *	 	origidx: 0,
	 *		roll: 0,
	 *		dropped: false,
	 * 		rerolled: false,
	 * 		exploding: false,
	 * 		critHit: false,
	 * 		critFail: false
	 * 	}
	 *
	 * Each of these is defined as following:
	 * 	{
	 * 		origidx: The original index of the roll
	 *		roll: The resulting roll on this die in the set
	 *		dropped: This die is to be dropped as it was one of the dy lowest dice
	 * 		rerolled: This die has been rerolled as it matched rz, it is replaced by the very next die in the set
	 * 		exploding: This die was rolled as the previous die exploded (was a crit hit)
	 * 		critHit: This die matched csq[-u], max die value used if cs not used
	 * 		critFail: This die rolled a nat 1, a critical failure
	 * 	}
	 */

	// Initialize a templet rollSet to copy multiple times
	const templateRoll = {
		origidx: 0,
		roll: 0,
		dropped: false,
		rerolled: false,
		exploding: false,
		critHit: false,
		critFail: false
	};

	// Begin counting the number of loops to prevent from getting into an infinite loop
	let loopCount = 0;

	// Initial rolling, not handling reroll or exploding here
	for (let i = 0; i < rollConf.dieCount; i++) {
		// If loopCount gets too high, stop trying to calculate infinity
		if (loopCount > MAXLOOPS) {
			throw new Error("MaxLoopsExceeded");
		}

		// Copy the template to fill out for this iteration
		const rolling = JSON.parse(JSON.stringify(templateRoll));
		// If maximiseRoll is on, set the roll to the dieSize, else if nominalRoll is on, set the roll to the average roll of dieSize, else generate a new random roll
		rolling.roll = maximiseRoll ? rollConf.dieSize : (nominalRoll ? ((rollConf.dieSize / 2) + 0.5) : genRoll(rollConf.dieSize));

		// If critScore arg is on, check if the roll should be a crit, if its off, check if the roll matches the die size
		if (rollConf.critScore.on && rollConf.critScore.range.indexOf(rolling.roll) >= 0) {
			rolling.critHit = true;
		} else if (!rollConf.critScore.on) {
			rolling.critHit = (rolling.roll === rollConf.dieSize);
		}
		// If critFail arg is on, check if the roll should be a fail, if its off, check if the roll matches 1
		if (rollConf.critFail.on && rollConf.critFail.range.indexOf(rolling.roll) >= 0) {
			rolling.critFail = true;
		} else if (!rollConf.critFail.on) {
			rolling.critFail = (rolling.roll === 1);
		}

		// Push the newly created roll and loop again
		rollSet.push(rolling);
		loopCount++;
	}

	// If needed, handle rerolling and exploding dice now
	if (rollConf.reroll.on || rollConf.exploding) {
		for (let i = 0; i < rollSet.length; i++) {
			// If loopCount gets too high, stop trying to calculate infinity
			if (loopCount > MAXLOOPS) {
				throw new Error("MaxLoopsExceeded");
			}

			// If we need to reroll this roll, flag its been replaced and...
			if (rollConf.reroll.on && rollConf.reroll.nums.indexOf(rollSet[i].roll) >= 0) {
				rollSet[i].rerolled = true;

				// Copy the template to fill out for this iteration
				const newRoll = JSON.parse(JSON.stringify(templateRoll));
				// If maximiseRoll is on, set the roll to the dieSize, else if nominalRoll is on, set the roll to the average roll of dieSize, else generate a new random roll
				newRoll.roll = maximiseRoll ? rollConf.dieSize : (nominalRoll ? ((rollConf.dieSize / 2) + 0.5) : genRoll(rollConf.dieSize));

				// If critScore arg is on, check if the roll should be a crit, if its off, check if the roll matches the die size
				if (rollConf.critScore.on && rollConf.critScore.range.indexOf(newRoll.roll) >= 0) {
					newRoll.critHit = true;
				} else if (!rollConf.critScore.on) {
					newRoll.critHit = (newRoll.roll === rollConf.dieSize);
				}
				// If critFail arg is on, check if the roll should be a fail, if its off, check if the roll matches 1
				if (rollConf.critFail.on && rollConf.critFail.range.indexOf(newRoll.roll) >= 0) {
					newRoll.critFail = true;
				} else if (!rollConf.critFail.on) {
					newRoll.critFail = (newRoll.roll === 1);
				}

				// Slot this new roll in after the current iteration so it can be processed in the next loop
				rollSet.splice(i + 1, 0, newRoll);
			} else if (rollConf.exploding && !rollSet[i].rerolled && rollSet[i].critHit) {
				//If it exploded, we keep both, so no flags need to be set
				
				// Copy the template to fill out for this iteration
				const newRoll = JSON.parse(JSON.stringify(templateRoll));
				// If maximiseRoll is on, set the roll to the dieSize, else if nominalRoll is on, set the roll to the average roll of dieSize, else generate a new random roll
				newRoll.roll = maximiseRoll ? rollConf.dieSize : (nominalRoll ? ((rollConf.dieSize / 2) + 0.5) : genRoll(rollConf.dieSize));
				// Always mark this roll as exploding
				newRoll.exploding = true;

				// If critScore arg is on, check if the roll should be a crit, if its off, check if the roll matches the die size
				if (rollConf.critScore.on && rollConf.critScore.range.indexOf(newRoll.roll) >= 0) {
					newRoll.critHit = true;
				} else if (!rollConf.critScore.on) {
					newRoll.critHit = (newRoll.roll === rollConf.dieSize);
				}
				// If critFail arg is on, check if the roll should be a fail, if its off, check if the roll matches 1
				if (rollConf.critFail.on && rollConf.critFail.range.indexOf(newRoll.roll) >= 0) {
					newRoll.critFail = true;
				} else if (!rollConf.critFail.on) {
					newRoll.critFail = (newRoll.roll === 1);
				}

				// Slot this new roll in after the current iteration so it can be processed in the next loop
				rollSet.splice(i + 1, 0, newRoll);
			}

			loopCount++;
		}
	}

	// If we need to handle the drop/keep flags
	if (dkdkCnt > 0) {
		// Count how many rerolled dice there are if the reroll flag was on
		let rerollCount = 0;
		if (rollConf.reroll.on) {
			for (let i = 0; i < rollSet.length; i++) {
				rollSet[i].origidx = i;

				if (rollSet[i].rerolled) {
					rerollCount++;
				}
			}
		}

		// Order the rolls from least to greatest (by RollSet.roll)
		rollSet.sort(compareRolls);

		// Determine how many valid rolls there are to drop from (may not be equal to dieCount due to exploding)
		const validRolls = rollSet.length - rerollCount;
		let dropCount = 0;

		// For normal drop and keep, simple subtraction is enough to determine how many to drop
		// Protections are in to prevent the dropCount from going below 0 or more than the valid rolls to drop
		if (rollConf.drop.on) {
			dropCount = rollConf.drop.count;
			if (dropCount > validRolls) {
				dropCount = validRolls;
			}
		} else if (rollConf.keep.on) {
			dropCount = validRolls - rollConf.keep.count;
			if (dropCount < 0) {
				dropCount = 0;
			}
		}

		// For inverted drop and keep, order must be flipped to greatest to least before the simple subtraction can determine how many to drop
		// Protections are in to prevent the dropCount from going below 0 or more than the valid rolls to drop
		else if (rollConf.dropHigh.on) {
			rollSet.reverse();
			dropCount = rollConf.dropHigh.count;
			if (dropCount > validRolls) {
				dropCount = validRolls;
			}
		} else if (rollConf.keepLow.on) {
			rollSet.reverse();
			dropCount = validRolls - rollConf.keepLow.count;
			if (dropCount < 0) {
				dropCount = 0;
			}
		}

		// Now its time to drop all dice needed
		let i = 0;
		while (dropCount > 0 && i < rollSet.length) {
			// Skip all rolls that were rerolled
			if (!rollSet[i].rerolled) {
				rollSet[i].dropped = true;
				dropCount--;
			}
			i++;
		}

		// Finally, return the rollSet to its original order
		rollSet.sort(compareOrigidx);
	}

	return rollSet;
};

// formatRoll(rollConf, maximiseRoll, nominalRoll) returns one SolvedStep
// formatRoll handles creating and formatting the completed rolls into the SolvedStep format
const formatRoll = (rollConf: string, maximiseRoll: boolean, nominalRoll: boolean): SolvedStep => {
	let tempTotal = 0;
	let tempDetails = "[";
	let tempCrit = false;
	let tempFail = false;

	// Generate the roll, passing flags thru
	const tempRollSet = roll(rollConf, maximiseRoll, nominalRoll);
	
	// Loop thru all parts of the roll to document everything that was done to create the total roll
	tempRollSet.forEach(e => {
		let preFormat = "";
		let postFormat = "";

		if (!e.dropped && !e.rerolled) {
			// If the roll was not dropped or rerolled, add it to the stepTotal and flag the critHit/critFail
			tempTotal += e.roll;
			if (e.critHit) {
				tempCrit = true;
			}
			if (e.critFail) {
				tempFail = true;
			}
		}
		// If the roll was a crit hit or fail, or dropped/rerolled, add the formatting needed
		if (e.critHit) {
			// Bold for crit success
			preFormat = "**" + preFormat;
			postFormat = postFormat + "**";
		}
		if (e.critFail) {
			// Underline for crit fail
			preFormat = "__" + preFormat;
			postFormat = postFormat + "__";
		}
		if (e.dropped || e.rerolled) {
			// Strikethrough for dropped/rerolled rolls
			preFormat = "~~" + preFormat;
			postFormat = postFormat + "~~";
		}

		// Finally add this to the roll's details
		tempDetails += preFormat + e.roll + postFormat + " + ";
	});
	// After the looping is done, remove the extra " + " from the details and cap it with the closing ]
	tempDetails = tempDetails.substr(0, (tempDetails.length - 3));
	tempDetails += "]";

	return {
		total: tempTotal,
		details: tempDetails,
		containsCrit: tempCrit,
		containsFail: tempFail
	};
};

// fullSolver(conf, wrapDetails) returns one condensed SolvedStep
// fullSolver is a function that recursively solves the full roll and math
const fullSolver = (conf: (string | number | SolvedStep)[], wrapDetails: boolean): SolvedStep => {
	// Initialize PEMDAS
	const signs = ["^", "*", "/", "%", "+", "-"];
	const stepSolve = {
		total: 0,
		details: "",
		containsCrit: false,
		containsFail: false
	};

	// If entering with a single number, note it now
	let singleNum = false;
	if (conf.length === 1) {
		singleNum = true;
	}

	// Evaluate all parenthesis
	while (conf.indexOf("(") > -1) {
		// Get first open parenthesis
		const openParen = conf.indexOf("(");
		let closeParen = -1;
		let nextParen = 0;

		// Using nextParen to count the opening/closing parens, find the matching paren to openParen above
		for (let i = openParen; i < conf.length; i++) {
			// If we hit an open, add one (this includes the openParen we start with), if we hit a close, subtract one
			if (conf[i] === "(") {
				nextParen++;
			} else if (conf[i] === ")") {
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
			throw new Error("UnbalancedParens");
		}

		// Replace the itemes between openParen and closeParen (including the parens) with its solved equilvalent by calling the solver on the items between openParen and closeParen (excluding the parens)
		conf.splice(openParen, (closeParen + 1), fullSolver(conf.slice((openParen + 1), closeParen), true));

		// Determing if we need to add in a multiplication sign to handle implicit multiplication (like "(4)2" = 8)
		// insertedMult flags if there was a multiplication sign inserted before the parens
		let insertedMult = false;
		// Check if a number was directly before openParen and slip in the "*" if needed
		if (((openParen - 1) > -1) && (signs.indexOf(conf[openParen - 1].toString()) === -1)) {
			insertedMult = true;
			conf.splice(openParen, 0, "*");
		}
		// Check if a number is directly after closeParen and slip in the "*" if needed
		if (!insertedMult && (((openParen + 1) < conf.length) && (signs.indexOf(conf[openParen + 1].toString()) === -1))) {
			conf.splice((openParen + 1), 0, "*");
		} else if (insertedMult && (((openParen + 2) < conf.length) && (signs.indexOf(conf[openParen + 2].toString()) === -1))) {
			// insertedMult is utilized here to let us account for an additional item being inserted into the array (the "*" from before openParn)
			conf.splice((openParen + 2), 0, "*");
		}
	}

	// Evaluate all EMMDAS by looping thru each teir of operators (exponential is the higehest teir, addition/subtraction the lowest)
	const allCurOps = [["^"], ["*", "/", "%"], ["+", "-"]];
	allCurOps.forEach(curOps => {
		// Iterate thru all operators/operands in the conf
		for (let i = 0; i < conf.length; i++) {
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
					details: "",
					containsCrit: false,
					containsFail: false
				};

				// If operand1 is a SolvedStep, populate our subStepSolve with its details and crit/fail flags
				if (typeof operand1 === "object") {
					oper1 = operand1.total;
					subStepSolve.details = operand1.details + "\\" + conf[i];
					subStepSolve.containsCrit = operand1.containsCrit;
					subStepSolve.containsFail = operand1.containsFail;
				} else {
					// else parse it as a number and add it to the subStep details
					oper1 = parseFloat(operand1.toString());
					subStepSolve.details = oper1.toString() + "\\" + conf[i];
				}

				// If operand2 is a SolvedStep, populate our subStepSolve with its details without overriding what operand1 filled in
				if (typeof operand2 === "object") {
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
					throw new Error("OperandNaN");
				}

				// Verify a second time that both are numbers before doing math, throwing an error if necessary
				if ((typeof oper1 === "number") && (typeof oper2 === "number")) {
					// Finally do the operator on the operands, throw an error if the operator is not found
					switch (conf[i]) {
						case "^":
							subStepSolve.total = Math.pow(oper1, oper2);
							break;
						case "*":
							subStepSolve.total = oper1 * oper2;
							break;
						case "/":
							subStepSolve.total = oper1 / oper2;
							break;
						case "%":
							subStepSolve.total = oper1 % oper2;
							break;
						case "+":
							subStepSolve.total = oper1 + oper2;
							break;
						case "-":
							subStepSolve.total = oper1 - oper2;
							break;
						default:
							throw new Error("OperatorWhat");
					}
				} else {
					throw new Error("EMDASNotNumber");
				}

				// Replace the two operands and their operator with our subStepSolve
				conf.splice((i - 1), 3, subStepSolve);
				// Because we are messing around with the array we are iterating thru, we need to back up one idx to make sure every operator gets processed
				i--;
			}
		}
	});

	// If we somehow have more than one item left in conf at this point, something broke, throw an error
	if (conf.length > 1) {
		throw new Error("ConfWhat");
	} else if (singleNum && (typeof (conf[0]) === "number")) {
		// If we are only left with a number, populate the stepSolve with it
		stepSolve.total = conf[0];
		stepSolve.details = conf[0].toString();
	} else {
		// Else fully populate the stepSolve with what was computed
		stepSolve.total = (<SolvedStep>conf[0]).total;
		stepSolve.details = (<SolvedStep>conf[0]).details;
		stepSolve.containsCrit = (<SolvedStep>conf[0]).containsCrit;
		stepSolve.containsFail = (<SolvedStep>conf[0]).containsFail;
	}

	// If this was a nested call, add on parens around the details to show what math we've done
	if (wrapDetails) {
		stepSolve.details = "(" + stepSolve.details + ")";
	}

	// If our total has reached undefined for some reason, error out now
	if (stepSolve.total === undefined) {
		throw new Error("UndefinedStep");
	}

	return stepSolve;
};

// parseRoll(fullCmd, localPrefix, localPostfix, maximiseRoll, nominalRoll)
// parseRoll handles converting fullCmd into a computer readable format for processing, and finally executes the solving
const parseRoll = (fullCmd: string, localPrefix: string, localPostfix: string, maximiseRoll: boolean, nominalRoll: boolean): SolvedRoll => {
	const returnmsg = {
		error: false,
		errorMsg: "",
		line1: "",
		line2: "",
		line3: ""
	};

	// Whole function lives in a try-catch to allow safe throwing of errors on purpose
	try {
		// Split the fullCmd by the command prefix to allow every roll/math op to be handled individually
		const sepRolls = fullCmd.split(localPrefix);

		const tempReturnData = [];

		// Loop thru all roll/math ops
		for (let i = 0; i < sepRolls.length; i++) {
			// Split the current iteration on the command postfix to separate the operation to be parsed and the text formatting after the opertaion
			const [tempConf, tempFormat] = sepRolls[i].split(localPostfix);

			// Remove all spaces from the operation config and split it by any operator (keeping the operator in mathConf for fullSolver to do math on)
			const mathConf: (string | number | SolvedStep)[] = <(string | number | SolvedStep)[]>tempConf.replace(/ /g, "").split(/([-+()*/%^])/g);

			// Verify there are equal numbers of opening and closing parenthesis by adding 1 for opening parens and subtracting 1 for closing parens
			let parenCnt = 0;
			mathConf.forEach(e => {
				if (e === "(") {
					parenCnt++;
				} else if (e === ")") {
					parenCnt--;
				}
			});

			// If the parenCnt is not 0, then we do not have balanced parens and need to error out now
			if (parenCnt !== 0) {
				throw new Error("UnbalancedParens");
			}

			// Evaluate all rolls into stepSolve format and all numbers into floats
			for (let i = 0; i < mathConf.length; i++) {
				if (mathConf[i].toString().length === 0) {
					// If its an empty string, get it out of here
					mathConf.splice(i, 1);
					i--;
				} else if (mathConf[i] == parseFloat(mathConf[i].toString())) {
					// If its a number, parse the number out
					mathConf[i] = parseFloat(mathConf[i].toString());
				} else if (/([0123456789])/g.test(mathConf[i].toString())) {
					// If there is a number somewhere in mathconf[i] but there are also other characters preventing it from parsing correctly as a number, it should be a dice roll, parse it as such (if it for some reason is not a dice roll, formatRoll/roll will handle it)
					mathConf[i] = formatRoll(mathConf[i].toString(), maximiseRoll, nominalRoll);
				} else if (mathConf[i].toString().toLowerCase() === "e") {
					// If the operand is the constant e, create a SolvedStep for it
					mathConf[i] = {
						total: Math.E,
						details: "*e*",
						containsCrit: false,
						containsFail: false
					};
				} else if (mathConf[i].toString().toLowerCase() === "pi") {
					// If the operand is the constant pi, create a SolvedStep for it
					mathConf[i] = {
						total: Math.PI,
						details: "𝜋",
						containsCrit: false,
						containsFail: false
					};
				} else if (mathConf[i].toString().toLowerCase() === "pie") {
					// If the operand is pie, pi*e, create a SolvedStep for e and pi (and the multiplication symbol between them)
					mathConf[i] = {
						total: Math.PI,
						details: "𝜋",
						containsCrit: false,
						containsFail: false
					};
					mathConf.splice((i + 1), 0, ...["*", {
						total: Math.E,
						details: "*e*",
						containsCrit: false,
						containsFail: false
					}]);
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
				initConfig: tempConf
			});
		}

		// Parsing/Solving done, time to format the output for Discord

		// Remove any floating spaces from fullCmd
		if (fullCmd[fullCmd.length - 1] === " ") {
			fullCmd = fullCmd.substr(0, (fullCmd.length - 1));
		}

		// Escape any | chars in fullCmd to prevent spoilers from acting up
		fullCmd = escapeCharacters(fullCmd, "|");

		let line1 = "";
		let line2 = "";
		let line3 = "";

		// If maximiseRoll or nominalRoll are on, mark the output as such, else use default formatting
		if (maximiseRoll) {
			line1 = " requested the theoretical maximum of: `[[" + fullCmd + "`";
			line2 = "Theoretical Maximum Results: ";
		} else if (nominalRoll) {
			line1 = " requested the theoretical nominal of: `[[" + fullCmd + "`";
			line2 = "Theoretical Nominal Results: ";
		} else {
			line1 = " rolled: `[[" + fullCmd + "`";
			line2 = "Results: ";
		}

		// Fill out all of the details and results now
		tempReturnData.forEach(e => {
			let preFormat = "";
			let postFormat = "";

			// If the roll containted a crit success or fail, set the formatting around it
			if (e.containsCrit) {
				preFormat = "**" + preFormat;
				postFormat = postFormat + "**";
			}
			if (e.containsFail) {
				preFormat = "__" + preFormat;
				postFormat = postFormat + "__";
			}

			// Populate line2 (the results) and line3 (the details) with their data
			line2 += preFormat + e.rollTotal + postFormat + escapeCharacters(e.rollPostFormat, "|*_~`");

			line3 += "`" + e.initConfig + "` = " + e.rollDetails + " = " + preFormat + e.rollTotal + postFormat + "\n";
		});

		// Fill in the return block
		returnmsg.line1 = line1;
		returnmsg.line2 = line2;
		returnmsg.line3 = line3;

	} catch (solverError) {
		// Welp, the unthinkable happened, we hit an error

		// Split on _ for the error messages that have more info than just their name
		const [errorName, errorDetails] = solverError.message.split("_");

		let errorMsg = "";

		// Translate the errorName to a specific errorMsg
		switch (errorName) {
			case "YouNeedAD":
				errorMsg = "Formatting Error: Missing die size and count config";
				break;
			case "FormattingError":
				errorMsg = "Formatting Error: Cannot use Keep and Drop at the same time, remove all but one and repeat roll";
				break;
			case "NoMaxWithDash":
				errorMsg = "Formatting Error: CritScore range specified without a maximum, remove - or add maximum to correct";
				break;
			case "UnknownOperation":
				errorMsg = "Error: Unknown Operation " + errorDetails;
				if (errorDetails === "-") {
					errorMsg += "\nNote: Negative numbers are not supported";
				} else if (errorDetails === " ") {
					errorMsg += "\nNote: Every roll must be closed by " + localPostfix;
				}
				break;
			case "NoZerosAllowed":
				errorMsg = "Formatting Error: ";
				switch (errorDetails) {
					case "base":
						errorMsg += "Die Size and Die Count";
						break;
					case "drop":
						errorMsg += "Drop (d or dl)";
						break;
					case "keep":
						errorMsg += "Keep (k or kh)";
						break;
					case "dropHigh":
						errorMsg += "Drop Highest (dh)";
						break;
					case "keepLow":
						errorMsg += "Keep Lowest (kl)";
						break;
					case "reroll":
						errorMsg += "Reroll (r)";
						break;
					case "critScore":
						errorMsg += "Crit Score (cs)";
						break;
					default:
						errorMsg += "Unhandled - " + errorDetails;
						break;
				}
				errorMsg += " cannot be zero";
				break;
			case "CritScoreMinGtrMax":
				errorMsg = "Formatting Error: CritScore maximum cannot be greater than minimum, check formatting and flip min/max";
				break;
			case "MaxLoopsExceeded":
				errorMsg = "Error: Roll is too complex or reaches infinity";
				break;
			case "UnbalancedParens":
				errorMsg = "Formatting Error: At least one of the equations contains unbalanced parenthesis";
				break;
			case "EMDASNotNumber":
				errorMsg = "Error: One or more operands is not a number";
				break;
			case "ConfWhat":
				errorMsg = "Error: Not all values got processed, please report the command used";
				break;
			case "OperatorWhat":
				errorMsg = "Error: Something really broke with the Operator, try again";
				break;
			case "OperandNaN":
				errorMsg = "Error: One or more operands reached NaN, check input";
				break;
			case "UndefinedStep":
				errorMsg = "Error: Roll became undefined, one ore more operands are not a roll or a number, check input";
				break;
			default:
				console.error(errorName, errorDetails);
				errorMsg = "Unhandled Error: " + solverError.message + "\nCheck input and try again, if issue persists, please use `[[report` to alert the devs of the issue";
				break;
		}

		// Fill in the return block
		returnmsg.error = true;
		returnmsg.errorMsg = errorMsg;
	}

	return returnmsg;
};

export default { parseRoll };