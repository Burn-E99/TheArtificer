import { log, LogTypes as LT } from '@Log4Deno';

import { rollCounter } from './utils/counter.ts';
import { RollModifiers } from 'src/mod.d.ts';
import { executeRoll } from 'artigen/executeRoll.ts';
import { RollFormat } from 'artigen/solver.d.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';

// generateSolvedRoll(rollConf, modifiers) returns one SolvedStep
// generateSolvedRoll handles creating and formatting the completed rolls into the SolvedStep format
export const generateSolvedRoll = (rollConf: string, modifiers: RollModifiers): RollFormat => {
  let tempTotal = 0;
  let tempDetails = '[';
  let tempCrit = false;
  let tempFail = false;

  // Generate the roll, passing flags thru
  const tempRollSet = executeRoll(rollConf, modifiers);

  // Loop thru all parts of the roll to document everything that was done to create the total roll
  tempRollSet.forEach((e) => {
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
          tempTotal += e.critHit ? 1 : 0;
          break;
      }
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

    // Finally add this to the roll's details
    tempDetails += `${preFormat}${e.roll}${postFormat} + `;
  });
  // After the looping is done, remove the extra " + " from the details and cap it with the closing ]
  tempDetails = tempDetails.substring(0, tempDetails.length - 3);
  if (tempRollSet[0]?.type === 'cwod') {
    tempDetails += `, ${tempRollSet.filter((e) => e.critHit).length} Successes, ${tempRollSet.filter((e) => e.critFail).length} Fails`;
  }
  tempDetails += ']';

  return {
    solvedStep: {
      total: tempTotal,
      details: tempDetails,
      containsCrit: tempCrit,
      containsFail: tempFail,
    },
    countDetails: rollCounter(tempRollSet),
  };
};
