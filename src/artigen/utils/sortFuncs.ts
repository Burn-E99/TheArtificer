import { ReturnData } from 'artigen/artigen.d.ts';

import { RollSet } from 'artigen/dice/dice.d.ts';

const internalCompareRolls = (a: RollSet, b: RollSet, dir: 1 | -1): number => {
  if (a.roll < b.roll) {
    return -1 * dir;
  }
  if (a.roll > b.roll) {
    return 1 * dir;
  }
  return 0;
};

// compareRolls(a, b) returns -1|0|1
// compareRolls is used to order an array of RollSets by RollSet.roll
export const compareRolls = (a: RollSet, b: RollSet): number => internalCompareRolls(a, b, 1);

// compareRolls(a, b) returns -1|0|1
// compareRolls is used to order an array of RollSets by RollSet.roll reversed
export const compareRollsReverse = (a: RollSet, b: RollSet): number => internalCompareRolls(a, b, -1);

const internalCompareTotalRolls = (a: ReturnData, b: ReturnData, dir: 1 | -1): number => {
  if (a.rollTotal < b.rollTotal) {
    return -1 * dir;
  }
  if (a.rollTotal > b.rollTotal) {
    return 1 * dir;
  }
  return 0;
};

// compareTotalRolls(a, b) returns -1|0|1
// compareTotalRolls is used to order an array of RollSets by RollSet.roll
export const compareTotalRolls = (a: ReturnData, b: ReturnData): number => internalCompareTotalRolls(a, b, 1);

// compareTotalRollsReverse(a, b) returns 1|0|-1
// compareTotalRollsReverse is used to order an array of RollSets by RollSet.roll reversed
export const compareTotalRollsReverse = (a: ReturnData, b: ReturnData): number => internalCompareTotalRolls(a, b, -1);

// compareRolls(a, b) returns -1|0|1
// compareRolls is used to order an array of RollSets by RollSet.origIdx
export const compareOrigIdx = (a: RollSet, b: RollSet): number => {
  if (a.origIdx < b.origIdx) {
    return -1;
  }
  if (a.origIdx > b.origIdx) {
    return 1;
  }
  return 0;
};
