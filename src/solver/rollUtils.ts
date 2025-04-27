import {
  log,
  // Log4Deno deps
  LT,
} from '../../deps.ts';
import { RollModifiers } from '../mod.d.ts';

import { ReturnData, RollSet } from './solver.d.ts';

export const loggingEnabled = false;

// genRoll(size) returns number
// genRoll rolls a die of size size and returns the result
export const genRoll = (size: number, modifiers: RollModifiers): number => {
  if (modifiers.maxRoll) {
    return size;
  } else if (modifiers.minRoll) {
    return 1;
  } else {
    // Math.random * size will return a decimal number between 0 and size (excluding size), so add 1 and floor the result to not get 0 as a result
    return modifiers.nominalRoll ? size / 2 + 0.5 : Math.floor(Math.random() * size + 1);
  }
};

// genFateRoll returns -1|0|1
// genFateRoll turns a d6 into a fate die, with sides: -1, -1, 0, 0, 1, 1
export const genFateRoll = (modifiers: RollModifiers): number => {
  if (modifiers.nominalRoll) {
    return 0;
  } else {
    const sides = [-1, -1, 0, 0, 1, 1];
    return sides[genRoll(6, modifiers) - 1];
  }
};

// compareRolls(a, b) returns -1|0|1
// compareRolls is used to order an array of RollSets by RollSet.roll
export const compareRolls = (a: RollSet, b: RollSet): number => {
  if (a.roll < b.roll) {
    return -1;
  }
  if (a.roll > b.roll) {
    return 1;
  }
  return 0;
};

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

// escapeCharacters(str, esc) returns str
// escapeCharacters escapes all characters listed in esc
export const escapeCharacters = (str: string, esc: string): string => {
  // Loop thru each esc char one at a time
  for (const e of esc) {
    loggingEnabled && log(LT.LOG, `Escaping character ${e} | ${str}, ${esc}`);
    // Create a new regex to look for that char that needs replaced and escape it
    const tempRgx = new RegExp(`[${e}]`, 'g');
    str = str.replace(tempRgx, `\\${e}`);
  }
  return str;
};
