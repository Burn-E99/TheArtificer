import config from '../../config.ts';
import {
	log,
	// Log4Deno deps
	LT,
} from '../../deps.ts';

import { RollSet } from './solver.d.ts';
import { compareOrigidx, compareRolls, genRoll, loggingEnabled } from './rollUtils.ts';

// roll(rollStr, maximiseRoll, nominalRoll) returns RollSet
// roll parses and executes the rollStr, if needed it will also make the roll the maximum or average
export const roll = (rollStr: string, maximiseRoll: boolean, nominalRoll: boolean): RollSet[] => {
	/* Roll Capabilities
	 * Deciphers and rolls a single dice roll set
	 *
	 * Check the README.md of this project for details on the roll options.  I gave up trying to keep three places updated at once.
	 */

	// Make entire roll lowercase for ease of parsing
	rollStr = rollStr.toLowerCase();

	// Split the roll on the die size (and the drop if its there)
	const dpts = rollStr.split('d');

	// Initialize the configuration to store the parsed data
	const rollConf = {
		dieCount: 0,
		dieSize: 0,
		drop: {
			on: false,
			count: 0,
		},
		keep: {
			on: false,
			count: 0,
		},
		dropHigh: {
			on: false,
			count: 0,
		},
		keepLow: {
			on: false,
			count: 0,
		},
		reroll: {
			on: false,
			once: false,
			nums: <number[]> [],
		},
		critScore: {
			on: false,
			range: <number[]> [],
		},
		critFail: {
			on: false,
			range: <number[]> [],
		},
		exploding: {
			on: false,
			once: false,
			nums: <number[]> [],
		},
	};

	// If the dpts is not long enough, throw error
	if (dpts.length < 2) {
		throw new Error('YouNeedAD');
	}

	// Fill out the die count, first item will either be an int or empty string, short circuit execution will take care of replacing the empty string with a 1
	const tempDC = (dpts.shift() || '1').replace(/\D/g, '');
	rollConf.dieCount = parseInt(tempDC);

	// Finds the end of the die size/beginnning of the additional options
	let afterDieIdx = dpts[0].search(/\D/);
	if (afterDieIdx === -1) {
		afterDieIdx = dpts[0].length;
	}

	// Rejoin all remaining parts
	let remains = dpts.join('d');
	// Get the die size out of the remains and into the rollConf
	rollConf.dieSize = parseInt(remains.slice(0, afterDieIdx));
	remains = remains.slice(afterDieIdx);

	if (!rollConf.dieCount || !rollConf.dieSize) {
		throw new Error('YouNeedAD');
	}

	loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Parsed Die Count: ${rollConf.dieCount}`);
	loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Parsed Die Size: ${rollConf.dieSize}`);

	// Finish parsing the roll
	if (remains.length > 0) {
		// Determine if the first item is a drop, and if it is, add the d back in
		if (remains.search(/\D/) !== 0 || remains.indexOf('l') === 0 || remains.indexOf('h') === 0) {
			remains = `d${remains}`;
		}

		// Loop until all remaining args are parsed
		while (remains.length > 0) {
			loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Parsing remains ${remains}`);
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
				case 'dl':
				case 'd':
					// Configure Drop (Lowest)
					rollConf.drop.on = true;
					rollConf.drop.count = tNum;
					break;
				case 'kh':
				case 'k':
					// Configure Keep (Highest)
					rollConf.keep.on = true;
					rollConf.keep.count = tNum;
					break;
				case 'dh':
					// Configure Drop (Highest)
					rollConf.dropHigh.on = true;
					rollConf.dropHigh.count = tNum;
					break;
				case 'kl':
					// Configure Keep (Lowest)
					rollConf.keepLow.on = true;
					rollConf.keepLow.count = tNum;
					break;
				case 'ro':
				case 'ro=':
					rollConf.reroll.once = true;
					// falls through as ro/ro= functions the same as r/r= in this context
				case 'r':
				case 'r=':
					// Configure Reroll (this can happen multiple times)
					rollConf.reroll.on = true;
					rollConf.reroll.nums.push(tNum);
					break;
				case 'ro>':
					rollConf.reroll.once = true;
					// falls through as ro> functions the same as r> in this context
				case 'r>':
					// Configure reroll for all numbers greater than or equal to tNum (this could happen multiple times, but why)
					rollConf.reroll.on = true;
					for (let i = tNum; i <= rollConf.dieSize; i++) {
						loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Parsing r> ${i}`);
						rollConf.reroll.nums.push(i);
					}
					break;
				case 'ro<':
					rollConf.reroll.once = true;
					// falls through as ro< functions the same as r< in this context
				case 'r<':
					// Configure reroll for all numbers less than or equal to tNum (this could happen multiple times, but why)
					rollConf.reroll.on = true;
					for (let i = 1; i <= tNum; i++) {
						loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Parsing r< ${i}`);
						rollConf.reroll.nums.push(i);
					}
					break;
				case 'cs':
				case 'cs=':
					// Configure CritScore for one number (this can happen multiple times)
					rollConf.critScore.on = true;
					rollConf.critScore.range.push(tNum);
					break;
				case 'cs>':
					// Configure CritScore for all numbers greater than or equal to tNum (this could happen multiple times, but why)
					rollConf.critScore.on = true;
					for (let i = tNum; i <= rollConf.dieSize; i++) {
						loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Parsing cs> ${i}`);
						rollConf.critScore.range.push(i);
					}
					break;
				case 'cs<':
					// Configure CritScore for all numbers less than or equal to tNum (this could happen multiple times, but why)
					rollConf.critScore.on = true;
					for (let i = 0; i <= tNum; i++) {
						loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Parsing cs< ${i}`);
						rollConf.critScore.range.push(i);
					}
					break;
				case 'cf':
				case 'cf=':
					// Configure CritFail for one number (this can happen multiple times)
					rollConf.critFail.on = true;
					rollConf.critFail.range.push(tNum);
					break;
				case 'cf>':
					// Configure CritFail for all numbers greater than or equal to tNum (this could happen multiple times, but why)
					rollConf.critFail.on = true;
					for (let i = tNum; i <= rollConf.dieSize; i++) {
						loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Parsing cf> ${i}`);
						rollConf.critFail.range.push(i);
					}
					break;
				case 'cf<':
					// Configure CritFail for all numbers less than or equal to tNum (this could happen multiple times, but why)
					rollConf.critFail.on = true;
					for (let i = 0; i <= tNum; i++) {
						loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Parsing cf< ${i}`);
						rollConf.critFail.range.push(i);
					}
					break;
				case '!o':
					rollConf.exploding.once = true;
					// falls through as !o functions the same as ! in this context
				case '!':
					// Configure Exploding
					rollConf.exploding.on = true;
					if (afterNumIdx > 0) {
						// User gave a number to explode on, save it
						rollConf.exploding.nums.push(tNum);
					} else {
						// User did not give number, use cs
						afterNumIdx = 1;
					}
					break;
				case '!o=':
					rollConf.exploding.once = true;
					// falls through as !o= functions the same as != in this context
				case '!=':
					// Configure Exploding (this can happen multiple times)
					rollConf.exploding.on = true;
					rollConf.exploding.nums.push(tNum);
					break;
				case '!o>':
					rollConf.exploding.once = true;
					// falls through as !o> functions the same as !> in this context
				case '!>':
					// Configure Exploding for all numbers greater than or equal to tNum (this could happen multiple times, but why)
					rollConf.exploding.on = true;
					for (let i = tNum; i <= rollConf.dieSize; i++) {
						loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Parsing !> ${i}`);
						rollConf.exploding.nums.push(i);
					}
					break;
				case '!o<':
					rollConf.exploding.once = true;
					// falls through as !o< functions the same as !< in this context
				case '!<':
					// Configure Exploding for all numbers less than or equal to tNum (this could happen multiple times, but why)
					rollConf.exploding.on = true;
					for (let i = 1; i <= tNum; i++) {
						loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Parsing !< ${i}`);
						rollConf.exploding.nums.push(i);
					}
					break;
				default:
					// Throw error immediately if unknown op is encountered
					throw new Error(`UnknownOperation_${tSep}`);
			}
			// Finally slice off everything else parsed this loop
			remains = remains.slice(afterNumIdx);
		}
	}

	// Verify the parse, throwing errors for every invalid config
	if (rollConf.dieCount < 0) {
		throw new Error('NoZerosAllowed_base');
	}
	if (rollConf.dieCount === 0 || rollConf.dieSize === 0) {
		throw new Error('NoZerosAllowed_base');
	}
	// Since only one drop or keep option can be active, count how many are active to throw the right error
	let dkdkCnt = 0;
	[rollConf.drop.on, rollConf.keep.on, rollConf.dropHigh.on, rollConf.keepLow.on].forEach((e) => {
		loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Checking if drop/keep is on ${e}`);
		if (e) {
			dkdkCnt++;
		}
	});
	if (dkdkCnt > 1) {
		throw new Error('FormattingError_dk');
	}
	if (rollConf.drop.on && rollConf.drop.count === 0) {
		throw new Error('NoZerosAllowed_drop');
	}
	if (rollConf.keep.on && rollConf.keep.count === 0) {
		throw new Error('NoZerosAllowed_keep');
	}
	if (rollConf.dropHigh.on && rollConf.dropHigh.count === 0) {
		throw new Error('NoZerosAllowed_dropHigh');
	}
	if (rollConf.keepLow.on && rollConf.keepLow.count === 0) {
		throw new Error('NoZerosAllowed_keepLow');
	}
	if (rollConf.reroll.on && rollConf.reroll.nums.indexOf(0) >= 0) {
		throw new Error('NoZerosAllowed_reroll');
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
		critFail: false,
	};

	// Begin counting the number of loops to prevent from getting into an infinite loop
	let loopCount = 0;

	// Initial rolling, not handling reroll or exploding here
	for (let i = 0; i < rollConf.dieCount; i++) {
		loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Initial rolling ${i} of ${JSON.stringify(rollConf)}`);
		// If loopCount gets too high, stop trying to calculate infinity
		if (loopCount > config.limits.maxLoops) {
			throw new Error('MaxLoopsExceeded');
		}

		// Copy the template to fill out for this iteration
		const rolling = JSON.parse(JSON.stringify(templateRoll));
		// If maximiseRoll is on, set the roll to the dieSize, else if nominalRoll is on, set the roll to the average roll of dieSize, else generate a new random roll
		rolling.roll = genRoll(rollConf.dieSize, maximiseRoll, nominalRoll);
		// Set origidx of roll
		rolling.origidx = i;

		// If critScore arg is on, check if the roll should be a crit, if its off, check if the roll matches the die size
		if (rollConf.critScore.on && rollConf.critScore.range.indexOf(rolling.roll) >= 0) {
			rolling.critHit = true;
		} else if (!rollConf.critScore.on) {
			rolling.critHit = rolling.roll === rollConf.dieSize;
		}
		// If critFail arg is on, check if the roll should be a fail, if its off, check if the roll matches 1
		if (rollConf.critFail.on && rollConf.critFail.range.indexOf(rolling.roll) >= 0) {
			rolling.critFail = true;
		} else if (!rollConf.critFail.on) {
			rolling.critFail = rolling.roll === 1;
		}

		// Push the newly created roll and loop again
		rollSet.push(rolling);
		loopCount++;
	}

	// If needed, handle rerolling and exploding dice now
	if (rollConf.reroll.on || rollConf.exploding.on) {
		for (let i = 0; i < rollSet.length; i++) {
			loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Handling rerolling and exploding ${JSON.stringify(rollSet[i])}`);
			// If loopCount gets too high, stop trying to calculate infinity
			if (loopCount > config.limits.maxLoops) {
				throw new Error('MaxLoopsExceeded');
			}

			// If we need to reroll this roll, flag its been replaced and...
			// This big boolean statement first checks if reroll is on, if the roll is within the reroll range, and finally if ro is ON, make sure we haven't already rerolled the roll
			if (rollConf.reroll.on && rollConf.reroll.nums.indexOf(rollSet[i].roll) >= 0 && (!rollConf.reroll.once || !rollSet[i ? (i - 1) : i].rerolled)) {
				rollSet[i].rerolled = true;

				// Copy the template to fill out for this iteration
				const newReroll = JSON.parse(JSON.stringify(templateRoll));
				// If maximiseRoll is on, set the roll to the dieSize, else if nominalRoll is on, set the roll to the average roll of dieSize, else generate a new random roll
				newReroll.roll = genRoll(rollConf.dieSize, maximiseRoll, nominalRoll);

				// If critScore arg is on, check if the roll should be a crit, if its off, check if the roll matches the die size
				if (rollConf.critScore.on && rollConf.critScore.range.indexOf(newReroll.roll) >= 0) {
					newReroll.critHit = true;
				} else if (!rollConf.critScore.on) {
					newReroll.critHit = newReroll.roll === rollConf.dieSize;
				}
				// If critFail arg is on, check if the roll should be a fail, if its off, check if the roll matches 1
				if (rollConf.critFail.on && rollConf.critFail.range.indexOf(newReroll.roll) >= 0) {
					newReroll.critFail = true;
				} else if (!rollConf.critFail.on) {
					newReroll.critFail = newReroll.roll === 1;
				}

				// Slot this new roll in after the current iteration so it can be processed in the next loop
				rollSet.splice(i + 1, 0, newReroll);
			} else if (
				rollConf.exploding.on && !rollSet[i].rerolled && (rollConf.exploding.nums.length ? rollConf.exploding.nums.indexOf(rollSet[i].roll) >= 0 : rollSet[i].critHit) &&
				(!rollConf.exploding.once || !rollSet[i].exploding)
			) {
				// If we have exploding.nums set, use those to determine the exploding range, and make sure if !o is on, make sure we don't repeatedly explode
				// If it exploded, we keep both, so no flags need to be set

				// Copy the template to fill out for this iteration
				const newExplodingRoll = JSON.parse(JSON.stringify(templateRoll));
				// If maximiseRoll is on, set the roll to the dieSize, else if nominalRoll is on, set the roll to the average roll of dieSize, else generate a new random roll
				newExplodingRoll.roll = genRoll(rollConf.dieSize, maximiseRoll, nominalRoll);
				// Always mark this roll as exploding
				newExplodingRoll.exploding = true;

				// If critScore arg is on, check if the roll should be a crit, if its off, check if the roll matches the die size
				if (rollConf.critScore.on && rollConf.critScore.range.indexOf(newExplodingRoll.roll) >= 0) {
					newExplodingRoll.critHit = true;
				} else if (!rollConf.critScore.on) {
					newExplodingRoll.critHit = newExplodingRoll.roll === rollConf.dieSize;
				}
				// If critFail arg is on, check if the roll should be a fail, if its off, check if the roll matches 1
				if (rollConf.critFail.on && rollConf.critFail.range.indexOf(newExplodingRoll.roll) >= 0) {
					newExplodingRoll.critFail = true;
				} else if (!rollConf.critFail.on) {
					newExplodingRoll.critFail = newExplodingRoll.roll === 1;
				}

				// Slot this new roll in after the current iteration so it can be processed in the next loop
				rollSet.splice(i + 1, 0, newExplodingRoll);
			}

			loopCount++;
		}
	}

	// If we need to handle the drop/keep flags
	if (dkdkCnt > 0) {
		// Count how many rerolled dice there are if the reroll flag was on
		let rerollCount = 0;
		if (rollConf.reroll.on) {
			for (let j = 0; j < rollSet.length; j++) {
				// If loopCount gets too high, stop trying to calculate infinity
				if (loopCount > config.limits.maxLoops) {
					throw new Error('MaxLoopsExceeded');
				}

				loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Setting originalIdx on ${JSON.stringify(rollSet[j])}`);
				rollSet[j].origidx = j;

				if (rollSet[j].rerolled) {
					rerollCount++;
				}

				loopCount++;
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
		} // For inverted drop and keep, order must be flipped to greatest to least before the simple subtraction can determine how many to drop
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
			// If loopCount gets too high, stop trying to calculate infinity
			if (loopCount > config.limits.maxLoops) {
				throw new Error('MaxLoopsExceeded');
			}

			loggingEnabled && log(LT.LOG, `Handling roll ${rollStr} | Dropping dice ${dropCount} ${JSON.stringify(rollSet[i])}`);
			// Skip all rolls that were rerolled
			if (!rollSet[i].rerolled) {
				rollSet[i].dropped = true;
				dropCount--;
			}
			i++;
			loopCount++;
		}

		// Finally, return the rollSet to its original order
		rollSet.sort(compareOrigidx);
	}

	return rollSet;
};
