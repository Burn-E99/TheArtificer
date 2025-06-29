import { log, LogTypes as LT } from '@Log4Deno';

import { FormattedRoll, RollModifiers } from 'artigen/dice/dice.d.ts';
import { executeRoll } from 'artigen/dice/executeRoll.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

import { rollCounter } from 'artigen/utils/counter.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { createRollDistMap } from 'artigen/utils/rollDist.ts';

// generateFormattedRoll(rollConf, modifiers) returns one SolvedStep
// generateFormattedRoll handles creating and formatting the completed rolls into the SolvedStep format
export const generateFormattedRoll = (rollConf: string, modifiers: RollModifiers): FormattedRoll => {
  let tempTotal = 0;
  let tempDetails = '[';
  let tempCrit = false;
  let tempFail = false;
  let tempComplex = false;

  // Generate the roll, passing flags thru
  const executedRoll = executeRoll(rollConf, modifiers);

  // Loop thru all parts of the roll to document everything that was done to create the total roll
  executedRoll.rollSet.forEach((e) => {
    loopCountCheck();

    loggingEnabled && log(LT.LOG, `Formatting roll ${rollConf} | ${JSON.stringify(e)}`);
    let preFormat = '';
    let postFormat = '';

    if (!e.dropped && !e.rerolled) {
      // If the roll was not dropped or rerolled, add it to the stepTotal and flag the critHit/critFail
      switch (e.type) {
        case 'ova':
        case 'roll20':
        case 'fate':
          tempTotal += e.roll;
          break;
        case 'cwod':
          tempTotal += e.success ? 1 : 0;
          break;
      }
      if (e.critHit) {
        tempCrit = true;
      }
      if (e.critFail) {
        tempFail = true;
      }
      if (e.isComplex) {
        tempComplex = true;
      }
    }
    // If the roll was a crit hit or fail, or dropped/rerolled, add the formatting needed
    if (e.critHit) {
      // Bold for crit success
      preFormat = `**${preFormat}`;
      postFormat = `${postFormat}**`;
    }
    if (e.critFail) {
      // Underline for crit fail
      preFormat = `__${preFormat}`;
      postFormat = `${postFormat}__`;
    }
    if (e.dropped || e.rerolled) {
      // Strikethrough for dropped/rerolled rolls
      preFormat = `~~${preFormat}`;
      postFormat = `${postFormat}~~`;
    }
    if (e.exploding) {
      // Add ! to indicate the roll came from an explosion
      postFormat = `!${postFormat}`;
    }

    let rollLabel = '';
    if (e.matchLabel) {
      rollLabel = `${e.matchLabel}:`;
    }

    // Finally add this to the roll's details
    tempDetails += `${preFormat}${rollLabel}${e.roll}${postFormat} + `;
  });
  // After the looping is done, remove the extra " + " from the details and cap it with the closing ]
  tempDetails = tempDetails.substring(0, tempDetails.length - 3);
  if (executedRoll.countSuccessOverride) {
    const successCnt = executedRoll.rollSet.filter((e) => !e.dropped && !e.rerolled && e.success).length;
    tempDetails += `, ${successCnt} Success${successCnt !== 1 ? 'es' : ''}`;

    executedRoll.sumOverride.on = true;
    executedRoll.sumOverride.value += successCnt;
  }
  if (executedRoll.countFailOverride) {
    const failCnt = executedRoll.rollSet.filter((e) => !e.dropped && !e.rerolled && e.fail).length;
    tempDetails += `, ${failCnt} Fail${failCnt !== 1 ? 's' : ''}`;

    executedRoll.sumOverride.on = true;
    if (executedRoll.rollSet[0]?.type !== 'cwod') {
      executedRoll.sumOverride.value -= failCnt;
    }
  }
  tempDetails += ']';

  return {
    solvedStep: {
      total: executedRoll.sumOverride.on ? executedRoll.sumOverride.value : tempTotal,
      details: tempDetails,
      containsCrit: tempCrit,
      containsFail: tempFail,
      isComplex: tempComplex,
    },
    countDetails: modifiers.count || modifiers.confirmCrit ? rollCounter(executedRoll.rollSet) : rollCounter([]),
    rollDistributions: modifiers.rollDist ? createRollDistMap(executedRoll.rollSet) : new Map<string, number[]>(),
  };
};
