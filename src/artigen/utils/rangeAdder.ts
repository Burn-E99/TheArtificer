import { log, LogTypes as LT } from '@Log4Deno';

import { RollType } from 'artigen/dice/dice.d.ts';

import { getLoopCount, loopCountCheck } from 'artigen/managers/loopManager.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';

// Add tNum to range
export const addToRange = (tSep: string, range: Array<number>, tNum: number) => {
  loggingEnabled && log(LT.LOG, `${getLoopCount()} addToRange on ${tSep} attempting to add: ${tNum}`);
  !range.includes(tNum) && range.push(tNum);
};

const internalAddMultipleToRange = (tSep: string, range: Array<number>, start: number, end: number) => {
  for (let i = start; i <= end; i++) {
    loopCountCheck();
    addToRange(tSep, range, i);
  }
};

// Add numbers less than or equal to tNum to range
export const ltAddToRange = (tSep: string, range: Array<number>, tNum: number, rollType: RollType) => internalAddMultipleToRange(tSep, range, rollType === 'fate' ? -1 : 0, tNum);

// Add numbers greater than or equal to tNum to range
export const gtrAddToRange = (tSep: string, range: Array<number>, tNum: number, dieSize: number) => internalAddMultipleToRange(tSep, range, tNum, dieSize);
