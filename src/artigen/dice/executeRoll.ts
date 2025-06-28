import { log, LogTypes as LT } from '@Log4Deno';

import { RollModifiers, RollSet, SumOverride } from 'artigen/dice/dice.d.ts';
import { genFateRoll, genRoll } from 'artigen/dice/randomRoll.ts';
import { getRollConf } from 'artigen/dice/getRollConf.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { compareOrigIdx, compareRolls, compareRollsReverse } from 'artigen/utils/sortFuncs.ts';

import { getLoopCount, loopCountCheck } from 'artigen/managers/loopManager.ts';
import { generateRollVals } from 'artigen/utils/rollValCounter.ts';

// roll(rollStr, modifiers) returns RollSet
// roll parses and executes the rollStr
export const executeRoll = (rollStr: string, modifiers: RollModifiers): [RollSet[], SumOverride] => {
  /* Roll Capabilities
   * Deciphers and rolls a single dice roll set
   *
   * Check the README.md of this project for details on the roll options.  I gave up trying to keep three places updated at once.
   */

  // Make entire roll lowercase for ease of parsing
  rollStr = rollStr.toLowerCase();

  // Turn the rollStr into a machine readable rollConf
  const rollConf = getRollConf(rollStr);

  // Roll the roll
  const rollSet: RollSet[] = [];
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
    type: rollConf.type,
    origIdx: 0,
    roll: 0,
    size: 0,
    dropped: false,
    rerolled: false,
    exploding: false,
    critHit: false,
    critFail: false,
    isComplex: rollConf.drop.on ||
      rollConf.keep.on ||
      rollConf.dropHigh.on ||
      rollConf.keepLow.on ||
      rollConf.critScore.on ||
      rollConf.critFail.on ||
      rollConf.exploding.on,
    matchLabel: '',
  });

  // Initial rolling, not handling reroll or exploding here
  for (let i = 0; i < rollConf.dieCount; i++) {
    loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Initial rolling ${i} of ${JSON.stringify(rollConf)}`);
    // If loopCount gets too high, stop trying to calculate infinity
    loopCountCheck();

    // Copy the template to fill out for this iteration
    const rolling = getTemplateRoll();
    // If maximizeRoll is on, set the roll to the dieSize, else if nominalRoll is on, set the roll to the average roll of dieSize, else generate a new random roll
    rolling.roll = rollConf.type === 'fate' ? genFateRoll(modifiers) : genRoll(rollConf.dieSize, modifiers, rollConf.dPercent);
    rolling.size = rollConf.dieSize;
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
      if (rollConf.type === 'fate') {
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
      loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Handling rerolling and exploding ${JSON.stringify(rollSet[i])}`);
      // If loopCount gets too high, stop trying to calculate infinity
      loopCountCheck();

      // This big boolean statement first checks if reroll is on, if the roll is within the reroll range, and finally if ro is ON, make sure we haven't already rerolled the roll
      if (rollConf.reroll.on && rollConf.reroll.nums.includes(rollSet[i].roll) && (!rollConf.reroll.once || !rollSet[i ? i - 1 : i].rerolled)) {
        // If we need to reroll this roll, flag its been replaced and...
        rollSet[i].rerolled = true;

        // Copy the template to fill out for this iteration
        const newReroll = getTemplateRoll();
        newReroll.size = rollConf.dieSize;
        if (modifiers.maxRoll && !minMaxOverride) {
          // If maximizeRoll is on and we've entered the reroll code, dieSize is not allowed, determine the next best option and always return that
          mmMaxLoop: for (let m = rollConf.dieSize - 1; m > 0; m--) {
            loopCountCheck();

            if (!rollConf.reroll.nums.includes(m)) {
              minMaxOverride = m;
              break mmMaxLoop;
            }
          }
        } else if (modifiers.minRoll && !minMaxOverride) {
          // If minimizeRoll is on and we've entered the reroll code, 1 is not allowed, determine the next best option and always return that
          mmMinLoop: for (let m = rollConf.dPercent.on ? 1 : 2; m <= rollConf.dieSize; m++) {
            loopCountCheck();

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
        newExplodingRoll.size = rollConf.dieSize;
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
      loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Handling penetrating explosions ${JSON.stringify(penRoll)}`);
      // If loopCount gets too high, stop trying to calculate infinity
      loopCountCheck();

      // If the die was from an explosion, decrement it by one
      if (penRoll.exploding) {
        penRoll.roll--;
      }
    }
  }

  // Handle compounding explosions
  if (rollConf.exploding.compounding) {
    for (let i = 0; i < rollSet.length; i++) {
      loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Handling compounding explosions ${JSON.stringify(rollSet[i])}`);
      // If loopCount gets too high, stop trying to calculate infinity
      loopCountCheck();

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
  if (rollConf.drop.on || rollConf.keep.on || rollConf.dropHigh.on || rollConf.keepLow.on) {
    // Count how many rerolled dice there are if the reroll flag was on
    let rerollCount = 0;
    if (rollConf.reroll.on) {
      for (let j = 0; j < rollSet.length; j++) {
        // If loopCount gets too high, stop trying to calculate infinity
        loopCountCheck();

        loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Setting originalIdx on ${JSON.stringify(rollSet[j])}`);
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
      loopCountCheck();

      loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Dropping dice ${dropCount} ${JSON.stringify(rollSet[i])}`);
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
  if (rollConf.type === 'ova') {
    const rollVals: Array<number> = generateRollVals(rollConf, rollSet, rollStr, false);

    // Find max value, using lastIndexOf to use the greatest die size max in case of duplicate maximums
    const maxRoll = rollVals.lastIndexOf(Math.max(...rollVals)) + 1;

    // Drop all dice that are not a part of the max
    for (const ovaRoll of rollSet) {
      loopCountCheck();

      loggingEnabled &&
        log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | checking if this roll should be dropped ${ovaRoll.roll} | to keep: ${maxRoll}`);
      if (ovaRoll.roll !== maxRoll) {
        ovaRoll.dropped = true;
        ovaRoll.critFail = false;
        ovaRoll.critHit = false;
      }
    }
  }

  const sumOverride: SumOverride = {
    on: rollConf.match.returnTotal,
    value: 0,
  };
  if (rollConf.match.on) {
    const rollVals: Array<number> = generateRollVals(rollConf, rollSet, rollStr, true).map((count) => (count >= rollConf.match.minCount ? count : 0));
    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let labelIdx = 0;
    const rollLabels: Array<string> = rollVals.map((count) => {
      loopCountCheck();

      if (labelIdx >= labels.length) {
        throw new Error(`TooManyLabels_${labels.length}`);
      }

      if (count) {
        return labels[labelIdx++];
      }
      return '';
    });

    loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | current match state: ${rollVals} | ${rollLabels}`);

    // Apply labels
    for (const roll of rollSet) {
      loopCountCheck();

      loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | trying to add a label to ${JSON.stringify(roll)}`);
      if (rollLabels[roll.roll - 1]) {
        roll.matchLabel = rollLabels[roll.roll - 1];
      } else if (rollConf.match.returnTotal) {
        roll.dropped = true;
      }
    }

    loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | labels added: ${JSON.stringify(rollSet)}`);

    if (rollConf.match.returnTotal) {
      sumOverride.value = rollVals.filter((count) => count !== 0).length;
    }
  }

  if (rollConf.sort.on) {
    rollSet.sort(rollConf.sort.direction === 'a' ? compareRolls : compareRollsReverse);
  }

  return [rollSet, sumOverride];
};
