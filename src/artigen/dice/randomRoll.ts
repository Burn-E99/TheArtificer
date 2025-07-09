import { DPercentConf, RollConf, RollModifiers } from 'artigen/dice/dice.d.ts';

import { basicReducer } from 'artigen/utils/reducers.ts';

// genBasicRoll(size, modifiers, dPercent) returns number
// genBasicRoll rolls a die of size size and returns the result
const genBasicRoll = (size: number, modifiers: RollModifiers, dPercent: DPercentConf): number => {
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

const getRollFromArray = (sides: number[], modifiers: RollModifiers): number => {
  if (modifiers.nominalRoll) {
    return sides.reduce(basicReducer, 0) / sides.length;
  } else if (modifiers.maxRoll) {
    return Math.max(...sides);
  } else if (modifiers.minRoll) {
    return Math.min(...sides);
  }

  return sides[genBasicRoll(sides.length, modifiers, <DPercentConf>{ on: false }) - 1];
};

export const generateRoll = (rollConf: RollConf, modifiers: RollModifiers): number => {
  switch (rollConf.type) {
    case 'fate':
      return getRollFromArray([-1, -1, 0, 0, 1, 1], modifiers);
    case 'custom':
      return getRollFromArray(modifiers.customDiceShapes.get(rollConf.customType ?? '') ?? [], modifiers);
    default:
      return genBasicRoll(rollConf.dieSize, modifiers, rollConf.dPercent);
  }
};
