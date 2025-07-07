import { log, LogTypes as LT } from '@Log4Deno';

import { ReturnData } from 'artigen/artigen.d.ts';

import { CountDetails, RollDistributionMap, RollModifiers } from 'artigen/dice/dice.d.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

import { tokenizeMath } from 'artigen/math/mathTokenizer.ts';

import { closeInternalGrp, openInternalGrp } from 'artigen/utils/escape.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { getMatchingGroupIdx } from 'artigen/utils/parenBalance.ts';

export const handleGroup = (
  groupParts: string[],
  groupModifiers: string,
  modifiers: RollModifiers,
  previousResults: number[],
): [ReturnData[], CountDetails[], RollDistributionMap[]] => {
  const returnData: ReturnData[] = [];
  const countDetails: CountDetails[] = [];
  const rollDists: RollDistributionMap[] = [];

  // Nested groups still exist, unwrap them
  while (groupParts.includes('{')) {
    loopCountCheck();

    loggingEnabled && log(LT.LOG, `Handling Nested Groups | Current cmd: ${JSON.stringify(groupParts)}`);

    const openIdx = groupParts.indexOf('}');
    const closeIdx = getMatchingGroupIdx(groupParts, openIdx);

    const currentGrp = groupParts.slice(openIdx + 1, closeIdx);

    const [tempData, tempCounts, tempDists] = handleGroup(currentGrp, '', modifiers, previousResults);
    const data = tempData[0];
    loggingEnabled && log(LT.LOG, `Solved Nested Group is back ${JSON.stringify(data)} | ${JSON.stringify(tempCounts)} ${JSON.stringify(tempDists)}`);

    countDetails.push(...tempCounts);
    rollDists.push(...tempDists);

    // Merge result back into groupParts
    groupParts.splice(openIdx, closeIdx - openIdx + 1, `${openInternalGrp}${data.rollTotal}${closeInternalGrp}`);
  }

  // Handle the items in the groups
  const commaParts = groupParts
    .join('')
    .split(',')
    .filter((x) => x);

  if (commaParts.length > 1) {
    loggingEnabled && log(LT.LOG, `In multi-mode ${JSON.stringify(commaParts)} ${groupModifiers}`);
    // Handle "normal operation" of group
    const groupResults: ReturnData[] = [];

    for (const part of commaParts) {
      loopCountCheck();

      loggingEnabled && log(LT.LOG, `Solving commaPart: ${part}`);
      const [tempData, tempCounts, tempDists] = tokenizeMath(part, modifiers, previousResults, []);
      const data = tempData[0];

      loggingEnabled && log(LT.LOG, `Solved Math for Group is back ${JSON.stringify(data)} | ${JSON.stringify(tempCounts)} ${JSON.stringify(tempDists)}`);

      countDetails.push(...tempCounts);
      rollDists.push(...tempDists);
      groupResults.push(data);
    }

    if (groupModifiers) {
      // Handle the provided modifiers
    } else {
      // Sum mode
      const data = groupResults.reduce((prev, cur) => ({
        rollTotal: prev.rollTotal + cur.rollTotal,
        rollPreFormat: '',
        rollPostFormat: '',
        rollDetails: prev.rollDetails + ' + ' + cur.rollDetails,
        containsCrit: prev.containsCrit || cur.containsCrit,
        containsFail: prev.containsFail || cur.containsFail,
        initConfig: prev.initConfig + ', ' + cur.initConfig,
        isComplex: prev.isComplex || cur.isComplex,
      }));
      data.initConfig = `{${data.initConfig}}`;
      data.rollDetails = `{${data.rollDetails}}`;
      returnData.push(data);
    }
  } else {
    loggingEnabled && log(LT.LOG, `In single-mode ${JSON.stringify(commaParts)} ${groupModifiers}`);
    if (groupModifiers) {
      // Handle special case where the group modifiers are applied across the dice rolled
      // ex from roll20 docs: {4d6+3d8}k4 - Roll 4 d6's and 3 d8's, out of those 7 dice the highest 4 are kept and summed up.
    } else {
      // why did you put this in a group, that was entirely pointless
      loggingEnabled && log(LT.LOG, `Solving commaPart: ${commaParts[0]}`);
      const [tempData, tempCounts, tempDists] = tokenizeMath(commaParts[0], modifiers, previousResults, []);
      const data = tempData[0];

      loggingEnabled && log(LT.LOG, `Solved Math for Group is back ${JSON.stringify(data)} | ${JSON.stringify(tempCounts)} ${JSON.stringify(tempDists)}`);

      countDetails.push(...tempCounts);
      rollDists.push(...tempDists);
      data.initConfig = `{${data.initConfig}}`;
      data.rollDetails = `{${data.rollDetails}}`;
      returnData.push(data);
    }
  }

  return [returnData, countDetails, rollDists];
};
