import { log, LogTypes as LT } from '@Log4Deno';

import { RollConf } from 'artigen/dice/dice.d.ts';

import { getLoopCount, loopCountCheck } from 'src/artigen/managers/loopManager.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';

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
    rollConf.type = 'cwod';
    manualParse = true;

    // Get CWOD parts, setting count and getting difficulty
    const cwodParts = rollStr.split('cwod');
    rollConf.dieCount = parseInt(cwodParts[0] || '1');
    rollConf.dieSize = 10;

    // Use critScore to set the difficulty
    rollConf.critScore.on = true;
    const difficulty = parseInt(cwodParts[1] || '10');
    for (let i = difficulty; i <= rollConf.dieSize; i++) {
      loopCountCheck();

      loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling cwod ${rollStr} | Parsing difficulty ${i}`);
      rollConf.critScore.range.push(i);
    }
  } else if (rawDC.endsWith('ova')) {
    // OVA dice parsing
    rollConf.type = 'ova';
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

  if (!rollConf.dieCount || !rollConf.dieSize) {
    throw new Error('YouNeedAD');
  }

  loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsed Die Count: ${rollConf.dieCount}`);
  loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsed Die Size: ${rollConf.dieSize}`);

  // Finish parsing the roll
  if (!manualParse && remains.length > 0) {
    // Determine if the first item is a drop, and if it is, add the d back in
    if (remains.search(/\D/) !== 0 || remains.indexOf('l') === 0 || remains.indexOf('h') === 0) {
      remains = `d${remains}`;
    }

    // Loop until all remaining args are parsed
    while (remains.length > 0) {
      loopCountCheck();

      loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsing remains ${remains}`);
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
            loopCountCheck();

            loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsing r> ${i}`);
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
            loopCountCheck();

            loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsing r< ${i}`);
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
            loopCountCheck();

            loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsing cs> ${i}`);
            !rollConf.critScore.range.includes(i) && rollConf.critScore.range.push(i);
          }
          break;
        case 'cs<':
          // Configure CritScore for all numbers less than or equal to tNum (this could happen multiple times, but why)
          rollConf.critScore.on = true;
          for (let i = 0; i <= tNum; i++) {
            loopCountCheck();

            loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsing cs< ${i}`);
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
            loopCountCheck();

            loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsing cf> ${i}`);
            !rollConf.critFail.range.includes(i) && rollConf.critFail.range.push(i);
          }
          break;
        case 'cf<':
          // Configure CritFail for all numbers less than or equal to tNum (this could happen multiple times, but why)
          rollConf.critFail.on = true;
          for (let i = 0; i <= tNum; i++) {
            loopCountCheck();

            loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsing cf< ${i}`);
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
            loopCountCheck();

            loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsing !> ${i}`);
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
            loopCountCheck();

            loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | Parsing !< ${i}`);
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
    loggingEnabled && log(LT.LOG, `Handling ${rollConf.type} ${rollStr} | Checking if drop/keep is on ${e}`);
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

  return rollConf;
};
