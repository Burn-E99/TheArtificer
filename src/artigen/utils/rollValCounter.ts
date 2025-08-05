import { log, LogTypes as LT } from '@Log4Deno';

import { RollConf, RollSet } from 'artigen/dice/dice.d.ts';

import { getLoopCount, loopCountCheck } from 'artigen/managers/loopManager.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';

// Can either count or sum each die
export const generateRollVals = (rollConf: RollConf, rollSet: RollSet[], rollStr: string, count: boolean): Array<number> => {
  const rollVals = new Array(rollConf.dieSize).fill(0);

  // Count up all rolls
  for (const ovaRoll of rollSet) {
    loopCountCheck('rollValCounter.ts - counting roll vals');

    loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | incrementing rollVals for ${JSON.stringify(ovaRoll)}`);
    if (!ovaRoll.dropped && !ovaRoll.rerolled) {
      rollVals[ovaRoll.roll - 1] += count ? 1 : ovaRoll.roll;
    }
  }

  loggingEnabled && log(LT.LOG, `${getLoopCount()} Handling ${rollConf.type} ${rollStr} | rollVals ${rollVals}`);
  return rollVals;
};
