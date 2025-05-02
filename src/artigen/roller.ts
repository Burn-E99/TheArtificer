import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { RollConf, RollSet, RollType } from 'artigen/solver.d.ts';

import { genFateRoll, genRoll } from 'artigen/utils/generateRoll.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { compareOrigIdx, compareRolls } from 'artigen/utils/sortFuncs.ts';

import { RollModifiers } from 'src/mod.d.ts';

// Call with loopCountCheck(++loopCount);
// Will ensure if maxLoops is 10, 10 loops will be allowed, 11 will not.
const loopCountCheck = (loopCount: number): void => {
  if (loopCount > config.limits.maxLoops) {
    throw new Error('MaxLoopsExceeded');
  }
};

const throwDoubleSepError = (sep: string): void => {
  throw new Error(`DoubleSeparator_${sep}`);
};

// roll(rollStr, modifiers) returns RollSet
// roll parses and executes the rollStr
export const roll = (rollStr: string, modifiers: RollModifiers): RollSet[] => {
  /* Roll Capabilities
   * Deciphers and rolls a single dice roll set
   *
   * Check the README.md of this project for details on the roll options.  I gave up trying to keep three places updated at once.
   */

  // Begin counting the number of loops to prevent from getting into an infinite loop
  let loopCount = 0;

  // Make entire roll lowercase for ease of parsing
  rollStr = rollStr.toLowerCase();

  // Split the roll on the die size (and the drop if its there)
  const dPts = rollStr.split('d');

  // Initialize the configuration to store the parsed data
  let rollType: RollType = '';
  const rollConf: RollConf = {
    dieCount: 0,
    dieSize: 0,
    dPercent: {
      on: false,
      sizeAdjustment: 0,
      critVal: 0,
    },
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
      compounding: false,
      penetrating: false,
      nums: <number[]> [],
    },
  };

  // If the dPts is not long enough, throw error
  if (dPts.length < 2) {
    throw new Error('YouNeedAD');
  }

  // Fill out the die count, first item will either be an int or empty string, short circuit execution will take care of replacing the empty string with a 1
  const rawDC = dPts.shift() || '1';
  if (rawDC.includes('.')) {
    throw new Error('WholeDieCountSizeOnly');
  } else if (rawDC.match(/\D/)) {
    throw new Error(`CannotParseDieCount_${rawDC}`);
  }
  const tempDC = rawDC.replace(/\D/g, '');
  // Rejoin all remaining parts
  let remains = dPts.join('d');

  // Manual Parsing for custom roll types
  let manualParse = false;
  if (rawDC.endsWith('cwo')) {
    // CWOD dice parsing
    rollType = 'cwod';
    manualParse = true;

    // Get CWOD parts, setting count and getting difficulty
    const cwodParts = rollStr.split('cwod');
    rollConf.dieCount = parseInt(cwodParts[0] || '1');
    rollConf.dieSize = 10;

    // Use critScore to set the difficulty
    rollConf.critScore.on = true;
    const difficulty = parseInt(cwodParts[1] || '10');
    for (let i = difficulty; i <= rollConf.dieSize; i++) {
      loopCountCheck(++loopCount);

      loggingEnabled && log(LT.LOG, `${loopCount} Handling cwod ${rollStr} | Parsing difficulty ${i}`);
      rollConf.critScore.range.push(i);
    }
  } else if (rawDC.endsWith('ova')) {
    // OVA dice parsing
    rollType = 'ova';
    manualParse = true;

    // Get OVA parts, setting count and getting difficulty
    const ovaParts = rollStr.split('ovad');
    const ovaPart1 = ovaParts[1] || '6';
    if (ovaPart1.search(/\d+\.\d/) === 0) {
      throw new Error('WholeDieCountSizeOnly');
    }
    rollConf.dieCount = parseInt(ovaParts[0] || '1');
    rollConf.dieSize = parseInt(ovaPart1);
  } else if (remains.startsWith('f')) {
    // fate dice setup
    rollType = 'fate';
    rollConf.dieCount = parseInt(tempDC);
    // dieSize set to 1 as 1 is max face value, a six sided die is used internally
    rollConf.dieSize = 1;

    // remove F from the remains
    remains = remains.slice(1);
  } else {
    // roll20 dice setup
    rollType = 'roll20';
    rollConf.dieCount = parseInt(tempDC);

    // Finds the end of the die size/beginning of the additional options
    let afterDieIdx = dPts[0].search(/[^%\d]/);
    if (afterDieIdx === -1) {
      afterDieIdx = dPts[0].length;
    }

    // Get the die size out of the remains and into the rollConf
    const rawDS = remains.slice(0, afterDieIdx);
    remains = remains.slice(afterDieIdx);

    if (rawDS.startsWith('%')) {
      rollConf.dieSize = 10;
      rollConf.dPercent.on = true;
      const percentCount = rawDS.match(/%/g)?.length ?? 1;
      rollConf.dPercent.sizeAdjustment = Math.pow(10, percentCount - 1);
      rollConf.dPercent.critVal = Math.pow(10, percentCount) - rollConf.dPercent.sizeAdjustment;
    } else {
      rollConf.dieSize = parseInt(rawDS);
    }

    if (remains.search(/\.\d/) === 0) {
      throw new Error('WholeDieCountSizeOnly');
    }
  }

  if (!rollConf.dieCount || !rollConf.dieSize) {
    throw new Error('YouNeedAD');
  }

  loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Parsed Die Count: ${rollConf.dieCount}`);
  loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Parsed Die Size: ${rollConf.dieSize}`);

  // Finish parsing the roll
  if (!manualParse && remains.length > 0) {
    // Determine if the first item is a drop, and if it is, add the d back in
    if (remains.search(/\D/) !== 0 || remains.indexOf('l') === 0 || remains.indexOf('h') === 0) {
      remains = `d${remains}`;
    }

    // Loop until all remaining args are parsed
    while (remains.length > 0) {
      loopCountCheck(++loopCount);

      loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Parsing remains ${remains}`);
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
          if (rollConf.drop.on) {
            // Ensure we do not override existing settings
            throwDoubleSepError(tSep);
          }
          // Configure Drop (Lowest)
          rollConf.drop.on = true;
          rollConf.drop.count = tNum;
          break;
        case 'kh':
        case 'k':
          if (rollConf.keep.on) {
            // Ensure we do not override existing settings
            throwDoubleSepError(tSep);
          }
          // Configure Keep (Highest)
          rollConf.keep.on = true;
          rollConf.keep.count = tNum;
          break;
        case 'dh':
          if (rollConf.dropHigh.on) {
            // Ensure we do not override existing settings
            throwDoubleSepError(tSep);
          }
          // Configure Drop (Highest)
          rollConf.dropHigh.on = true;
          rollConf.dropHigh.count = tNum;
          break;
        case 'kl':
          if (rollConf.keepLow.on) {
            // Ensure we do not override existing settings
            throwDoubleSepError(tSep);
          }
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
          !rollConf.reroll.nums.includes(tNum) && rollConf.reroll.nums.push(tNum);
          break;
        case 'ro>':
          rollConf.reroll.once = true;
        // falls through as ro> functions the same as r> in this context
        case 'r>':
          // Configure reroll for all numbers greater than or equal to tNum (this could happen multiple times, but why)
          rollConf.reroll.on = true;
          for (let i = tNum; i <= rollConf.dieSize; i++) {
            loopCountCheck(++loopCount);

            loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Parsing r> ${i}`);
            !rollConf.reroll.nums.includes(i) && rollConf.reroll.nums.push(i);
          }
          break;
        case 'ro<':
          rollConf.reroll.once = true;
        // falls through as ro< functions the same as r< in this context
        case 'r<':
          // Configure reroll for all numbers less than or equal to tNum (this could happen multiple times, but why)
          rollConf.reroll.on = true;
          for (let i = 1; i <= tNum; i++) {
            loopCountCheck(++loopCount);

            loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Parsing r< ${i}`);
            !rollConf.reroll.nums.includes(i) && rollConf.reroll.nums.push(i);
          }
          break;
        case 'cs':
        case 'cs=':
          // Configure CritScore for one number (this can happen multiple times)
          rollConf.critScore.on = true;
          !rollConf.critScore.range.includes(tNum) && rollConf.critScore.range.push(tNum);
          break;
        case 'cs>':
          // Configure CritScore for all numbers greater than or equal to tNum (this could happen multiple times, but why)
          rollConf.critScore.on = true;
          for (let i = tNum; i <= rollConf.dieSize; i++) {
            loopCountCheck(++loopCount);

            loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Parsing cs> ${i}`);
            !rollConf.critScore.range.includes(i) && rollConf.critScore.range.push(i);
          }
          break;
        case 'cs<':
          // Configure CritScore for all numbers less than or equal to tNum (this could happen multiple times, but why)
          rollConf.critScore.on = true;
          for (let i = 0; i <= tNum; i++) {
            loopCountCheck(++loopCount);

            loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Parsing cs< ${i}`);
            !rollConf.critScore.range.includes(i) && rollConf.critScore.range.push(i);
          }
          break;
        case 'cf':
        case 'cf=':
          // Configure CritFail for one number (this can happen multiple times)
          rollConf.critFail.on = true;
          !rollConf.critFail.range.includes(tNum) && rollConf.critFail.range.push(tNum);
          break;
        case 'cf>':
          // Configure CritFail for all numbers greater than or equal to tNum (this could happen multiple times, but why)
          rollConf.critFail.on = true;
          for (let i = tNum; i <= rollConf.dieSize; i++) {
            loopCountCheck(++loopCount);

            loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Parsing cf> ${i}`);
            !rollConf.critFail.range.includes(i) && rollConf.critFail.range.push(i);
          }
          break;
        case 'cf<':
          // Configure CritFail for all numbers less than or equal to tNum (this could happen multiple times, but why)
          rollConf.critFail.on = true;
          for (let i = 0; i <= tNum; i++) {
            loopCountCheck(++loopCount);

            loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Parsing cf< ${i}`);
            !rollConf.critFail.range.includes(i) && rollConf.critFail.range.push(i);
          }
          break;
        case '!':
        case '!o':
        case '!p':
        case '!!':
          // Configure Exploding
          rollConf.exploding.on = true;
          if (afterNumIdx > 0) {
            // User gave a number to explode on, save it
            !rollConf.exploding.nums.includes(tNum) && rollConf.exploding.nums.push(tNum);
          } else {
            // User did not give number, use cs
            afterNumIdx = 1;
          }
          break;
        case '!=':
        case '!o=':
        case '!p=':
        case '!!=':
          // Configure Exploding (this can happen multiple times)
          rollConf.exploding.on = true;
          !rollConf.exploding.nums.includes(tNum) && rollConf.exploding.nums.push(tNum);
          break;
        case '!>':
        case '!o>':
        case '!p>':
        case '!!>':
          // Configure Exploding for all numbers greater than or equal to tNum (this could happen multiple times, but why)
          rollConf.exploding.on = true;
          for (let i = tNum; i <= rollConf.dieSize; i++) {
            loopCountCheck(++loopCount);

            loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Parsing !> ${i}`);
            !rollConf.exploding.nums.includes(i) && rollConf.exploding.nums.push(i);
          }
          break;
        case '!<':
        case '!o<':
        case '!p<':
        case '!!<':
          // Configure Exploding for all numbers less than or equal to tNum (this could happen multiple times, but why)
          rollConf.exploding.on = true;
          for (let i = 1; i <= tNum; i++) {
            loopCountCheck(++loopCount);

            loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Parsing !< ${i}`);
            !rollConf.exploding.nums.includes(i) && rollConf.exploding.nums.push(i);
          }
          break;
        default:
          // Throw error immediately if unknown op is encountered
          throw new Error(`UnknownOperation_${tSep}`);
      }

      // Exploding flags get set in their own switch statement to avoid weird duplicated code
      switch (tSep) {
        case '!o':
        case '!o=':
        case '!o>':
        case '!o<':
          rollConf.exploding.once = true;
          break;
        case '!p':
        case '!p=':
        case '!p>':
        case '!p<':
          rollConf.exploding.penetrating = true;
          break;
        case '!!':
        case '!!=':
        case '!!>':
        case '!!<':
          rollConf.exploding.compounding = true;
          break;
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
    loggingEnabled && log(LT.LOG, `Handling ${rollType} ${rollStr} | Checking if drop/keep is on ${e}`);
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
  if (rollConf.reroll.on && !rollConf.dPercent.on && rollConf.reroll.nums.includes(0)) {
    throw new Error('NoZerosAllowed_reroll');
  }

  // Filter rollConf num lists to only include valid numbers
  const validNumFilter = (curNum: number) => curNum <= rollConf.dieSize && curNum > (rollConf.dPercent.on ? -1 : 0);
  rollConf.reroll.nums = rollConf.reroll.nums.filter(validNumFilter);
  rollConf.critScore.range = rollConf.critScore.range.filter(validNumFilter);
  rollConf.critFail.range = rollConf.critFail.range.filter(validNumFilter);
  rollConf.exploding.nums = rollConf.exploding.nums.filter(validNumFilter);

  if (rollConf.reroll.on && rollConf.reroll.nums.length === rollConf.dieSize) {
    throw new Error('NoRerollOnAllSides');
  }

  // Roll the roll
  const rollSet = [];
  /* Roll will contain objects of the following format:
   * 	{
   *	 	origIdx: 0,
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
   * 		origIdx: The original index of the roll
   *		roll: The resulting roll on this die in the set
   *		dropped: This die is to be dropped as it was one of the dy lowest dice
   * 		rerolled: This die has been rerolled as it matched rz, it is replaced by the very next die in the set
   * 		exploding: This die was rolled as the previous die exploded (was a crit hit)
   * 		critHit: This die matched csq[-u], max die value used if cs not used
   * 		critFail: This die rolled a nat 1, a critical failure
   * 	}
   */

  // Initialize a template rollSet to copy multiple times
  const getTemplateRoll = (): RollSet => ({
    type: rollType,
    origIdx: 0,
    roll: 0,
    dropped: false,
    rerolled: false,
    exploding: false,
    critHit: false,
    critFail: false,
  });

  // Initial rolling, not handling reroll or exploding here
  for (let i = 0; i < rollConf.dieCount; i++) {
    loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Initial rolling ${i} of ${JSON.stringify(rollConf)}`);
    // If loopCount gets too high, stop trying to calculate infinity
    loopCountCheck(++loopCount);

    // Copy the template to fill out for this iteration
    const rolling = getTemplateRoll();
    // If maximizeRoll is on, set the roll to the dieSize, else if nominalRoll is on, set the roll to the average roll of dieSize, else generate a new random roll
    rolling.roll = rollType === 'fate' ? genFateRoll(modifiers) : genRoll(rollConf.dieSize, modifiers, rollConf.dPercent);
    // Set origIdx of roll
    rolling.origIdx = i;

    // If critScore arg is on, check if the roll should be a crit, if its off, check if the roll matches the die size
    if (rollConf.critScore.on && rollConf.critScore.range.includes(rolling.roll)) {
      rolling.critHit = true;
    } else if (!rollConf.critScore.on) {
      rolling.critHit = rolling.roll === (rollConf.dPercent.on ? rollConf.dPercent.critVal : rollConf.dieSize);
    }
    // If critFail arg is on, check if the roll should be a fail, if its off, check if the roll matches 1
    if (rollConf.critFail.on && rollConf.critFail.range.includes(rolling.roll)) {
      rolling.critFail = true;
    } else if (!rollConf.critFail.on) {
      if (rollType === 'fate') {
        rolling.critFail = rolling.roll === -1;
      } else {
        rolling.critFail = rolling.roll === (rollConf.dPercent.on ? 0 : 1);
      }
    }

    // Push the newly created roll and loop again
    rollSet.push(rolling);
  }

  // If needed, handle rerolling and exploding dice now
  if (rollConf.reroll.on || rollConf.exploding.on) {
    let minMaxOverride = 0;
    for (let i = 0; i < rollSet.length; i++) {
      loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Handling rerolling and exploding ${JSON.stringify(rollSet[i])}`);
      // If loopCount gets too high, stop trying to calculate infinity
      loopCountCheck(++loopCount);

      // This big boolean statement first checks if reroll is on, if the roll is within the reroll range, and finally if ro is ON, make sure we haven't already rerolled the roll
      if (rollConf.reroll.on && rollConf.reroll.nums.includes(rollSet[i].roll) && (!rollConf.reroll.once || !rollSet[i ? i - 1 : i].rerolled)) {
        // If we need to reroll this roll, flag its been replaced and...
        rollSet[i].rerolled = true;

        // Copy the template to fill out for this iteration
        const newReroll = getTemplateRoll();
        if (modifiers.maxRoll && !minMaxOverride) {
          // If maximizeRoll is on and we've entered the reroll code, dieSize is not allowed, determine the next best option and always return that
          mmMaxLoop: for (let m = rollConf.dieSize - 1; m > 0; m--) {
            loopCountCheck(++loopCount);

            if (!rollConf.reroll.nums.includes(m)) {
              minMaxOverride = m;
              break mmMaxLoop;
            }
          }
        } else if (modifiers.minRoll && !minMaxOverride) {
          // If minimizeRoll is on and we've entered the reroll code, 1 is not allowed, determine the next best option and always return that
          mmMinLoop: for (let m = rollConf.dPercent.on ? 1 : 2; m <= rollConf.dieSize; m++) {
            loopCountCheck(++loopCount);

            if (!rollConf.reroll.nums.includes(m)) {
              minMaxOverride = m;
              break mmMinLoop;
            }
          }
        }

        if (modifiers.maxRoll || modifiers.minRoll) {
          newReroll.roll = minMaxOverride;
        } else {
          // If nominalRoll is on, set the roll to the average roll of dieSize, otherwise generate a new random roll
          newReroll.roll = genRoll(rollConf.dieSize, modifiers, rollConf.dPercent);
        }

        // If critScore arg is on, check if the roll should be a crit, if its off, check if the roll matches the die size
        if (rollConf.critScore.on && rollConf.critScore.range.includes(newReroll.roll)) {
          newReroll.critHit = true;
        } else if (!rollConf.critScore.on) {
          newReroll.critHit = newReroll.roll === (rollConf.dPercent.on ? rollConf.dPercent.critVal : rollConf.dieSize);
        }
        // If critFail arg is on, check if the roll should be a fail, if its off, check if the roll matches 1
        if (rollConf.critFail.on && rollConf.critFail.range.includes(newReroll.roll)) {
          newReroll.critFail = true;
        } else if (!rollConf.critFail.on) {
          newReroll.critFail = newReroll.roll === (rollConf.dPercent.on ? 0 : 1);
        }

        // Slot this new roll in after the current iteration so it can be processed in the next loop
        rollSet.splice(i + 1, 0, newReroll);
      } else if (
        rollConf.exploding.on &&
        !rollSet[i].rerolled &&
        (rollConf.exploding.nums.length ? rollConf.exploding.nums.includes(rollSet[i].roll) : rollSet[i].critHit) &&
        (!rollConf.exploding.once || !rollSet[i].exploding)
      ) {
        // If we have exploding.nums set, use those to determine the exploding range, and make sure if !o is on, make sure we don't repeatedly explode
        // If it exploded, we keep both, so no flags need to be set

        // Copy the template to fill out for this iteration
        const newExplodingRoll = getTemplateRoll();
        // If maximizeRoll is on, set the roll to the dieSize, else if nominalRoll is on, set the roll to the average roll of dieSize, else generate a new random roll
        newExplodingRoll.roll = genRoll(rollConf.dieSize, modifiers, rollConf.dPercent);
        // Always mark this roll as exploding
        newExplodingRoll.exploding = true;

        // If critScore arg is on, check if the roll should be a crit, if its off, check if the roll matches the die size
        if (rollConf.critScore.on && rollConf.critScore.range.includes(newExplodingRoll.roll)) {
          newExplodingRoll.critHit = true;
        } else if (!rollConf.critScore.on) {
          newExplodingRoll.critHit = newExplodingRoll.roll === (rollConf.dPercent.on ? rollConf.dPercent.critVal : rollConf.dieSize);
        }
        // If critFail arg is on, check if the roll should be a fail, if its off, check if the roll matches 1
        if (rollConf.critFail.on && rollConf.critFail.range.includes(newExplodingRoll.roll)) {
          newExplodingRoll.critFail = true;
        } else if (!rollConf.critFail.on) {
          newExplodingRoll.critFail = newExplodingRoll.roll === (rollConf.dPercent.on ? 0 : 1);
        }

        // Slot this new roll in after the current iteration so it can be processed in the next loop
        rollSet.splice(i + 1, 0, newExplodingRoll);
      }
    }
  }

  // If penetrating is on, do the decrements
  if (rollConf.exploding.penetrating) {
    for (const penRoll of rollSet) {
      loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Handling penetrating explosions ${JSON.stringify(penRoll)}`);
      // If loopCount gets too high, stop trying to calculate infinity
      loopCountCheck(++loopCount);

      // If the die was from an explosion, decrement it by one
      if (penRoll.exploding) {
        penRoll.roll--;
      }
    }
  }

  // Handle compounding explosions
  if (rollConf.exploding.compounding) {
    for (let i = 0; i < rollSet.length; i++) {
      loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Handling compounding explosions ${JSON.stringify(rollSet[i])}`);
      // If loopCount gets too high, stop trying to calculate infinity
      loopCountCheck(++loopCount);

      // Compound the exploding rolls, including the exploding flag and
      if (rollSet[i].exploding) {
        rollSet[i - 1].roll = rollSet[i - 1].roll + rollSet[i].roll;
        rollSet[i - 1].exploding = true;
        rollSet[i - 1].critFail = rollSet[i - 1].critFail || rollSet[i].critFail;
        rollSet[i - 1].critHit = rollSet[i - 1].critHit || rollSet[i].critHit;
        rollSet.splice(i, 1);
        i--;
      }
    }
  }

  // If we need to handle the drop/keep flags
  if (dkdkCnt > 0) {
    // Count how many rerolled dice there are if the reroll flag was on
    let rerollCount = 0;
    if (rollConf.reroll.on) {
      for (let j = 0; j < rollSet.length; j++) {
        // If loopCount gets too high, stop trying to calculate infinity
        loopCountCheck(++loopCount);

        loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Setting originalIdx on ${JSON.stringify(rollSet[j])}`);
        rollSet[j].origIdx = j;

        if (rollSet[j].rerolled) {
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
      loopCountCheck(++loopCount);

      loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | Dropping dice ${dropCount} ${JSON.stringify(rollSet[i])}`);
      // Skip all rolls that were rerolled
      if (!rollSet[i].rerolled) {
        rollSet[i].dropped = true;
        dropCount--;
      }
      i++;
    }

    // Finally, return the rollSet to its original order
    rollSet.sort(compareOrigIdx);
  }

  // Handle OVA dropping/keeping
  if (rollType === 'ova') {
    // Make "empty" vals array to easily sum up which die value is the greatest
    const rollVals: Array<number> = new Array(rollConf.dieSize).fill(0);

    // Sum up all rolls
    for (const ovaRoll of rollSet) {
      loopCountCheck(++loopCount);

      loggingEnabled && log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | incrementing rollVals for ${ovaRoll}`);
      rollVals[ovaRoll.roll - 1] += ovaRoll.roll;
    }

    // Find max value, using lastIndexOf to use the greatest die size max in case of duplicate maximums
    const maxRoll = rollVals.lastIndexOf(Math.max(...rollVals)) + 1;

    // Drop all dice that are not a part of the max
    for (const ovaRoll of rollSet) {
      loopCountCheck(++loopCount);

      loggingEnabled &&
        log(LT.LOG, `${loopCount} Handling ${rollType} ${rollStr} | checking if this roll should be dropped ${ovaRoll.roll} | to keep: ${maxRoll}`);
      if (ovaRoll.roll !== maxRoll) {
        ovaRoll.dropped = true;
        ovaRoll.critFail = false;
        ovaRoll.critHit = false;
      }
    }
  }

  return rollSet;
};
