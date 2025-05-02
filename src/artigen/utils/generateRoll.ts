import { RollModifiers } from 'src/mod.d.ts';

import { DPercentConf } from 'artigen/solver.d.ts';

// genRoll(size) returns number
// genRoll rolls a die of size size and returns the result
export const genRoll = (size: number, modifiers: RollModifiers, dPercent: DPercentConf): number => {
  let result;
  if (modifiers.maxRoll) {
    result = size;
  } else if (modifiers.minRoll) {
    result = 1;
  } else {
    // Math.random * size will return a decimal number between 0 and size (excluding size), so add 1 and floor the result to not get 0 as a result
    result = modifiers.nominalRoll ? size / 2 + 0.5 : Math.floor(Math.random() * size + 1);
  }
  return dPercent.on ? (result - 1) * dPercent.sizeAdjustment : result;
};

// genFateRoll returns -1|0|1
// genFateRoll turns a d6 into a fate die, with sides: -1, -1, 0, 0, 1, 1
export const genFateRoll = (modifiers: RollModifiers): number => {
  if (modifiers.nominalRoll) {
    return 0;
  } else {
    const sides = [-1, -1, 0, 0, 1, 1];
    return sides[genRoll(6, modifiers, <DPercentConf> { on: false }) - 1];
  }
};
