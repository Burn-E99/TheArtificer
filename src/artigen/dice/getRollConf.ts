import { log, LogTypes as LT } from '@Log4Deno';

import { RollConf } from 'artigen/dice/dice.d.ts';

import { DiceOptions, NumberlessDiceOptions } from 'artigen/dice/rollOptions.ts';

import { getLoopCount, loopCountCheck } from 'artigen/managers/loopManager.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { addToRange, gtrAddToRange, ltAddToRange } from 'artigen/utils/rangeAdder.ts';

const throwDoubleSepError = (sep: string): void => {
  throw new Error(`DoubleSeparator_${sep}`);
};

// Converts a rollStr into a machine readable rollConf
export const getRollConf = (rollStr: string): RollConf => {
  // Split the roll on the die size (and the drop if its there)
  const dPts = rollStr.split('d');

  // Initialize the configuration to store the parsed data
  const rollConf: RollConf = {
    type: '',
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
      nums: [],
    },
    critScore: {
      on: false,
      range: [],
    },
    critFail: {
      on: false,
      range: [],
    },
    exploding: {
      on: false,
      once: false,
      compounding: false,
      penetrating: false,
      nums: [],
    },
    match: {
      on: false,
      minCount: 2,
      returnTotal: false,
    },
    sort: {
      on: false,
      direction: '',
    },
    success: {
      on: false,
      range: [],
    },
    fail: {
      on: false,
      range: [],
    },
  };

  // If the dPts is not long enough, throw error
  if (dPts.length < 2) {
    throw new Error(`YouNeedAD_${rollStr}`);
  }

  // Fill out the die count, first item will either be an int or empty string, short circuit execution will take care of replacing the empty string with a 1
  const rawDC = dPts.shift() || '1';
  if (rawDC.includes('.')) {
    throw new Error('WholeDieCountSizeOnly');
  } else if (!rawDC.endsWith('cwo') && !rawDC.endsWith('ova') && rawDC.match(/\D/)) {
    throw new Error(`CannotParseDieCount_${rawDC}`);
  }
  const tempDC = rawDC.replace(/\D/g, '');
  // Rejoin all remaining parts
  let remains = dPts.join('d');

  loggingEnabled && log(LT.LOG, `Initial breaking of rollStr ${rawDC} ${tempDC} ${dPts} ${remains}`);

  // Manual Parsing for custom roll types
  if (rawDC.endsWith('cwo')) {
    // CWOD dice parsing
    rollConf.type = 'cwod';

    // Get CWOD parts, setting count and getting difficulty
    const cwodParts = rollStr.split('cwod');
    rollConf.dieCount = parseInt(cwodParts[0] || '1');
    rollConf.dieSize = 10;

    // Use success to set the difficulty
    rollConf.success.on = true;
    rollConf.fail.on = true;
    addToRange('cwod', rollConf.fail.range, 1);
    const tempDifficulty = (cwodParts[1] ?? '').search(/\d/) === 0 ? cwodParts[1] : '';
    let afterDifficultyIdx = tempDifficulty.search(/[^\d]/);
    if (afterDifficultyIdx === -1) {
      afterDifficultyIdx = tempDifficulty.length;
    }
    const difficulty = parseInt(tempDifficulty.slice(0, afterDifficultyIdx) || '10');

    for (let i = difficulty; i <= rollConf.dieSize; i++) {
      loopCountCheck();

      loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling cwod ${rollStr} | Parsing difficulty ${i}`);
      rollConf.success.range.push(i);
    }

    // Remove any garbage from the remains
    remains = remains.slice(afterDifficultyIdx);
  } else if (rawDC.endsWith('ova')) {
    // OVA dice parsing
    rollConf.type = 'ova';

    // Get OVA parts, setting count and getting difficulty
    const ovaParts = rollStr.split('ovad');
    const tempOvaPart1 = (ovaParts[1] ?? '').search(/\d/) === 0 ? ovaParts[1] : '';
    if (tempOvaPart1.search(/\d+\.\d/) === 0) {
      throw new Error('WholeDieCountSizeOnly');
    }
    rollConf.dieCount = parseInt(ovaParts[0] || '1');

    let afterOvaSizeIdx = tempOvaPart1.search(/[^\d]/);
    if (afterOvaSizeIdx === -1) {
      afterOvaSizeIdx = tempOvaPart1.length;
    }
    rollConf.dieSize = parseInt(tempOvaPart1.slice(0, afterOvaSizeIdx) || '6');

    // Remove any garbage from the remains
    remains = remains.slice(afterOvaSizeIdx);
  } else if (remains.startsWith('f')) {
    // fate dice setup
    rollConf.type = 'fate';
    rollConf.dieCount = parseInt(tempDC);
    // dieSize set to 1 as 1 is max face value, a six sided die is used internally
    rollConf.dieSize = 1;

    // remove F from the remains
    remains = remains.slice(1);
  } else {
    // roll20 dice setup
    rollConf.type = 'roll20';
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

  loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsed Die Count: ${rollConf.dieCount}`);
  loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsed Die Size: ${rollConf.dieSize}`);
  loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | remains: ${remains}`);

  if (!rollConf.dieCount || !rollConf.dieSize) {
    throw new Error(`YouNeedAD_${rollStr}`);
  }

  // Finish parsing the roll
  if (remains.length > 0) {
    // Determine if the first item is a drop, and if it is, add the d back in
    if (remains.search(/\D/) > 0 || remains.indexOf('l') === 0 || remains.indexOf('h') === 0) {
      remains = `d${remains}`;
    }

    // Loop until all remaining args are parsed
    while (remains.length > 0) {
      loopCountCheck();

      loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsing remains ${remains}`);
      // Find the next number in the remains to be able to cut out the rule name
      let afterSepIdx = remains.search(/[-\d]/);
      if (afterSepIdx < 0) {
        afterSepIdx = remains.length;
      }

      // Determine if afterSepIdx needs to be moved up (cases like mt! or !mt)
      const tempSep = remains.slice(0, afterSepIdx);
      let noNumberAfter = false;
      NumberlessDiceOptions.some((opt) => {
        loopCountCheck();
        if (tempSep.startsWith(opt) && tempSep !== opt) {
          afterSepIdx = opt.length;
          noNumberAfter = true;
          return true;
        }
        return tempSep === opt;
      });

      // Save the rule name to tSep and remove it from remains
      const tSep = remains.slice(0, afterSepIdx);
      remains = remains.slice(afterSepIdx);
      // Find the next non-number in the remains to be able to cut out the count/num
      let afterNumIdx = noNumberAfter ? 0 : remains.search(/(?![-\d])/);
      if (afterNumIdx < 0) {
        afterNumIdx = remains.length;
      }
      // Save the count/num to tNum leaving it in remains for the time being
      const tNum = parseInt(remains.slice(0, afterNumIdx));

      loggingEnabled && log(LT.LOG, `${getLoopCount()} tSep: ${tSep} ${afterSepIdx}, tNum: ${tNum} ${afterNumIdx}`);

      // Switch on rule name
      switch (tSep) {
        case DiceOptions.Drop:
        case DiceOptions.DropLow:
          if (rollConf.drop.on) {
            // Ensure we do not override existing settings
            throwDoubleSepError(tSep);
          }
          // Configure Drop (Lowest)
          rollConf.drop.on = true;
          rollConf.drop.count = tNum;
          break;
        case DiceOptions.Keep:
        case DiceOptions.KeepHigh:
          if (rollConf.keep.on) {
            // Ensure we do not override existing settings
            throwDoubleSepError(tSep);
          }
          // Configure Keep (Highest)
          rollConf.keep.on = true;
          rollConf.keep.count = tNum;
          break;
        case DiceOptions.DropHigh:
          if (rollConf.dropHigh.on) {
            // Ensure we do not override existing settings
            throwDoubleSepError(tSep);
          }
          // Configure Drop (Highest)
          rollConf.dropHigh.on = true;
          rollConf.dropHigh.count = tNum;
          break;
        case DiceOptions.KeepLow:
          if (rollConf.keepLow.on) {
            // Ensure we do not override existing settings
            throwDoubleSepError(tSep);
          }
          // Configure Keep (Lowest)
          rollConf.keepLow.on = true;
          rollConf.keepLow.count = tNum;
          break;
        case DiceOptions.RerollOnce:
        case DiceOptions.RerollOnceEqu:
          rollConf.reroll.once = true;
        // falls through as ro/ro= functions the same as r/r= in this context
        case DiceOptions.Reroll:
        case DiceOptions.RerollEqu:
          // Configure Reroll (this can happen multiple times)
          rollConf.reroll.on = true;
          addToRange(tSep, rollConf.reroll.nums, tNum);
          break;
        case DiceOptions.RerollOnceGtr:
          rollConf.reroll.once = true;
        // falls through as ro> functions the same as r> in this context
        case DiceOptions.RerollGtr:
          // Configure reroll for all numbers greater than or equal to tNum (this could happen multiple times, but why)
          rollConf.reroll.on = true;
          gtrAddToRange(tSep, rollConf.reroll.nums, tNum, rollConf.dieSize);
          break;
        case DiceOptions.RerollOnceLt:
          rollConf.reroll.once = true;
        // falls through as ro< functions the same as r< in this context
        case DiceOptions.RerollLt:
          // Configure reroll for all numbers less than or equal to tNum (this could happen multiple times, but why)
          rollConf.reroll.on = true;
          ltAddToRange(tSep, rollConf.reroll.nums, tNum, rollConf.type);
          break;
        case DiceOptions.CritSuccess:
        case DiceOptions.CritSuccessEqu:
          // Configure CritScore for one number (this can happen multiple times)
          rollConf.critScore.on = true;
          addToRange(tSep, rollConf.critScore.range, tNum);
          break;
        case DiceOptions.CritSuccessGtr:
          // Configure CritScore for all numbers greater than or equal to tNum (this could happen multiple times, but why)
          rollConf.critScore.on = true;
          gtrAddToRange(tSep, rollConf.critScore.range, tNum, rollConf.dieSize);
          break;
        case DiceOptions.CritSuccessLt:
          // Configure CritScore for all numbers less than or equal to tNum (this could happen multiple times, but why)
          rollConf.critScore.on = true;
          ltAddToRange(tSep, rollConf.critScore.range, tNum, rollConf.type);
          break;
        case DiceOptions.CritFail:
        case DiceOptions.CritFailEqu:
          // Configure CritFail for one number (this can happen multiple times)
          rollConf.critFail.on = true;
          addToRange(tSep, rollConf.critFail.range, tNum);
          break;
        case DiceOptions.CritFailGtr:
          // Configure CritFail for all numbers greater than or equal to tNum (this could happen multiple times, but why)
          rollConf.critFail.on = true;
          gtrAddToRange(tSep, rollConf.critFail.range, tNum, rollConf.dieSize);
          break;
        case DiceOptions.CritFailLt:
          // Configure CritFail for all numbers less than or equal to tNum (this could happen multiple times, but why)
          rollConf.critFail.on = true;
          ltAddToRange(tSep, rollConf.critFail.range, tNum, rollConf.type);
          break;
        case DiceOptions.Exploding:
        case DiceOptions.ExplodeOnce:
        case DiceOptions.PenetratingExplosion:
        case DiceOptions.CompoundingExplosion:
          // Configure Exploding
          rollConf.exploding.on = true;
          if (afterNumIdx > 0) {
            // User gave a number to explode on, save it
            addToRange(tSep, rollConf.exploding.nums, tNum);
          }
          break;
        case DiceOptions.ExplodingEqu:
        case DiceOptions.ExplodeOnceEqu:
        case DiceOptions.PenetratingExplosionEqu:
        case DiceOptions.CompoundingExplosionEqu:
          // Configure Exploding (this can happen multiple times)
          rollConf.exploding.on = true;
          addToRange(tSep, rollConf.exploding.nums, tNum);
          break;
        case DiceOptions.ExplodingGtr:
        case DiceOptions.ExplodeOnceGtr:
        case DiceOptions.PenetratingExplosionGtr:
        case DiceOptions.CompoundingExplosionGtr:
          // Configure Exploding for all numbers greater than or equal to tNum (this could happen multiple times, but why)
          rollConf.exploding.on = true;
          gtrAddToRange(tSep, rollConf.exploding.nums, tNum, rollConf.dieSize);
          break;
        case DiceOptions.ExplodingLt:
        case DiceOptions.ExplodeOnceLt:
        case DiceOptions.PenetratingExplosionLt:
        case DiceOptions.CompoundingExplosionLt:
          // Configure Exploding for all numbers less than or equal to tNum (this could happen multiple times, but why)
          rollConf.exploding.on = true;
          ltAddToRange(tSep, rollConf.exploding.nums, tNum, rollConf.type);
          break;
        case DiceOptions.MatchingTotal:
          rollConf.match.returnTotal = true;
        // falls through as mt functions the same as m in this context
        case DiceOptions.Matching:
          if (rollConf.match.on) {
            // Ensure we do not override existing settings
            throwDoubleSepError(tSep);
          }
          rollConf.match.on = true;
          if (afterNumIdx > 0) {
            // User gave a number to work with, save it
            rollConf.match.minCount = tNum;
          }
          break;
        case DiceOptions.Sort:
        case DiceOptions.SortAsc:
          if (rollConf.sort.on) {
            // Ensure we do not override existing settings
            throwDoubleSepError(tSep);
          }
          rollConf.sort.on = true;
          rollConf.sort.direction = 'a';
          break;
        case DiceOptions.SortDesc:
          if (rollConf.sort.on) {
            // Ensure we do not override existing settings
            throwDoubleSepError(tSep);
          }
          rollConf.sort.on = true;
          rollConf.sort.direction = 'd';
          break;
        case DiceOptions.SuccessEqu:
          // Configure success (this can happen multiple times)
          rollConf.success.on = true;
          addToRange(tSep, rollConf.success.range, tNum);
          break;
        case DiceOptions.SuccessGtr:
          // Configure success for all numbers greater than or equal to tNum (this could happen multiple times, but why)
          rollConf.success.on = true;
          gtrAddToRange(tSep, rollConf.success.range, tNum, rollConf.dieSize);
          break;
        case DiceOptions.SuccessLt:
          // Configure success for all numbers less than or equal to tNum (this could happen multiple times, but why)
          rollConf.success.on = true;
          ltAddToRange(tSep, rollConf.success.range, tNum, rollConf.type);
          break;
        case DiceOptions.Fail:
        case DiceOptions.FailEqu:
          // Configure fail (this can happen multiple times)
          rollConf.fail.on = true;
          addToRange(tSep, rollConf.fail.range, tNum);
          break;
        case DiceOptions.FailGtr:
          // Configure fail for all numbers greater than or equal to tNum (this could happen multiple times, but why)
          rollConf.fail.on = true;
          gtrAddToRange(tSep, rollConf.fail.range, tNum, rollConf.dieSize);
          break;
        case DiceOptions.FailLt:
          // Configure fail for all numbers less than or equal to tNum (this could happen multiple times, but why)
          rollConf.fail.on = true;
          ltAddToRange(tSep, rollConf.fail.range, tNum, rollConf.type);
          break;
        default:
          // Throw error immediately if unknown op is encountered
          throw new Error(`UnknownOperation_${tSep}`);
      }

      // Followup switch to avoid weird duplicated code
      switch (tSep) {
        case DiceOptions.ExplodeOnce:
        case DiceOptions.ExplodeOnceLt:
        case DiceOptions.ExplodeOnceGtr:
        case DiceOptions.ExplodeOnceEqu:
          rollConf.exploding.once = true;
          break;
        case DiceOptions.PenetratingExplosion:
        case DiceOptions.PenetratingExplosionLt:
        case DiceOptions.PenetratingExplosionGtr:
        case DiceOptions.PenetratingExplosionEqu:
          rollConf.exploding.penetrating = true;
          break;
        case DiceOptions.CompoundingExplosion:
        case DiceOptions.CompoundingExplosionLt:
        case DiceOptions.CompoundingExplosionGtr:
        case DiceOptions.CompoundingExplosionEqu:
          rollConf.exploding.compounding = true;
          break;
      }

      // Finally slice off everything else parsed this loop
      remains = remains.slice(afterNumIdx);
    }
  }

  loggingEnabled && log(LT.LOG, `RollConf before cleanup: ${JSON.stringify(rollConf)}`);

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
    loggingEnabled && log(LT.LOG, `Handling ${rollConf.type} ${rollStr} | Checking if drop/keep is on ${e}`);
    if (e) {
      dkdkCnt++;
    }
  });
  if (dkdkCnt > 1) {
    throw new Error('FormattingError_dk');
  }

  if (rollConf.match.on && (rollConf.success.on || rollConf.fail.on)) {
    throw new Error('FormattingError_mtsf');
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

  // Filter rollConf num lists to only include valid numbers
  const validNumFilter = (curNum: number) => {
    if (rollConf.type === 'fate') {
      return [-1, 0, 1].includes(curNum);
    }
    return curNum <= rollConf.dieSize && curNum > (rollConf.dPercent.on ? -1 : 0);
  };
  rollConf.reroll.nums = rollConf.reroll.nums.filter(validNumFilter);
  rollConf.critScore.range = rollConf.critScore.range.filter(validNumFilter);
  rollConf.critFail.range = rollConf.critFail.range.filter(validNumFilter);
  rollConf.exploding.nums = rollConf.exploding.nums.filter(validNumFilter);
  rollConf.success.range = rollConf.success.range.filter(validNumFilter);
  rollConf.fail.range = rollConf.fail.range.filter(validNumFilter);

  if (rollConf.reroll.on && rollConf.reroll.nums.length === (rollConf.type === 'fate' ? 3 : rollConf.dieSize)) {
    throw new Error('NoRerollOnAllSides');
  }

  loggingEnabled && log(LT.LOG, `RollConf after cleanup: ${JSON.stringify(rollConf)}`);

  return rollConf;
};
