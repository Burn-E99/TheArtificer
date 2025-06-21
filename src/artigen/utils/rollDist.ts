import { RollDistributionMap, RollSet, RollType } from 'artigen/dice/dice.d.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

// Used to generate consistent keys for rollDistributions
export const rollDistKey = (type: RollType, size: number) => `${type}-${size}`;

// Converts a RollSet into a RollDistMap
export const createRollDistMap = (rollSet: RollSet[]): RollDistributionMap => {
  const rollDistMap = new Map<string, number[]>();

  rollSet.forEach((roll) => {
    loopCountCheck();
    const tempArr: number[] = rollDistMap.get(rollDistKey(roll.type, roll.size)) ?? new Array<number>(roll.type === 'fate' ? roll.size + 2 : roll.size).fill(0);
    tempArr[roll.type === 'fate' ? roll.roll + 1 : roll.roll - 1]++;
    rollDistMap.set(rollDistKey(roll.type, roll.size), tempArr);
  });

  return rollDistMap;
};

// Collapses an array of RollDistMaps into a single RollDistMap
export const reduceRollDistMaps = (rollDistArr: RollDistributionMap[]): RollDistributionMap =>
  rollDistArr.reduce((acc, cur) => {
    loopCountCheck();

    cur
      .entries()
      .toArray()
      .forEach(([key, value]) => {
        loopCountCheck();

        const tempArr = acc.get(key) ?? new Array<number>(value.length).fill(0);
        for (let i = 0; i < tempArr.length; i++) {
          loopCountCheck();
          tempArr[i] += value[i];
        }

        acc.set(key, tempArr);
      });
    return acc;
  }, new Map<string, number[]>());
