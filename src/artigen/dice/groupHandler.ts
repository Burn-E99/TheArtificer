import { log, LogTypes as LT } from '@Log4Deno';

import { ReturnData } from 'artigen/artigen.d.ts';

import { CountDetails, GroupConf, GroupResultFlags, RollDistributionMap, RollModifiers } from 'artigen/dice/dice.d.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

import { tokenizeMath } from 'artigen/math/mathTokenizer.ts';

import { closeInternalGrp, internalGrpWrapRegex, mathSplitRegex, openInternalGrp } from 'artigen/utils/escape.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { getMatchingGroupIdx, getMatchingInternalGrpIdx } from 'artigen/utils/parenBalance.ts';
import { getGroupConf } from 'artigen/dice/getGroupConf.ts';
import { compareOrigIdx, compareTotalRolls } from 'artigen/utils/sortFuncs.ts';
import { applyFlags } from '../utils/groupResultFlagger.ts';

export const handleGroup = (
  groupParts: string[],
  groupModifiers: string,
  modifiers: RollModifiers,
  previousResults: number[],
): [ReturnData[], CountDetails[], RollDistributionMap[]] => {
  let retData: ReturnData;
  const returnData: ReturnData[] = [];
  const countDetails: CountDetails[] = [];
  const rollDists: RollDistributionMap[] = [];
  const groupConf: GroupConf = getGroupConf(groupModifiers, groupParts.join(''));
  const prevGrpReturnData: ReturnData[] = [];

  // Nested groups still exist, unwrap them
  while (groupParts.includes('{')) {
    loopCountCheck();

    loggingEnabled && log(LT.LOG, `Handling Nested Groups | Current cmd: ${JSON.stringify(groupParts)}`);

    const openIdx = groupParts.indexOf('{');
    const closeIdx = getMatchingGroupIdx(groupParts, openIdx);

    const currentGrp = groupParts.slice(openIdx + 1, closeIdx);

    // Try to find and "eat" any modifiers from the next groupPart
    let thisGrpMods = '';
    const possibleMods = groupParts[closeIdx + 1]?.trim() ?? '';
    if (possibleMods.match(/^[dk<>=f].*/g)) {
      const items = groupParts[closeIdx + 1].split(mathSplitRegex).filter((x) => x);
      thisGrpMods = items.shift() ?? '';
      groupParts[closeIdx + 1] = items.join('');
    }

    const [tempData, tempCounts, tempDists] = handleGroup(currentGrp, thisGrpMods, modifiers, previousResults);
    const data = tempData[0];
    loggingEnabled && log(LT.LOG, `Solved Nested Group is back ${JSON.stringify(data)} | ${JSON.stringify(tempCounts)} ${JSON.stringify(tempDists)}`);

    countDetails.push(...tempCounts);
    rollDists.push(...tempDists);

    // Merge result back into groupParts
    groupParts.splice(openIdx, closeIdx - openIdx + 1, `${openInternalGrp}${prevGrpReturnData.length}${closeInternalGrp}`);
    prevGrpReturnData.push(data);
  }

  // Handle the items in the groups
  const commaParts = groupParts
    .join('')
    .split(',')
    .filter((x) => x);

  if (commaParts.length > 1) {
    loggingEnabled && log(LT.LOG, `In multi-mode ${JSON.stringify(commaParts)} ${groupModifiers} ${JSON.stringify(groupConf)}`);
    // Handle "normal operation" of group
    const groupResults: ReturnData[] = [];

    for (const part of commaParts) {
      loopCountCheck();

      loggingEnabled && log(LT.LOG, `Solving commaPart: ${part}`);
      const [tempData, tempCounts, tempDists] = tokenizeMath(part, modifiers, previousResults, prevGrpReturnData);
      const data = tempData[0];

      loggingEnabled && log(LT.LOG, `Solved Math for Group is back ${JSON.stringify(data)} | ${JSON.stringify(tempCounts)} ${JSON.stringify(tempDists)}`);

      countDetails.push(...tempCounts);
      rollDists.push(...tempDists);
      groupResults.push(data);
    }

    if (groupModifiers.trim()) {
      // Handle the provided modifiers
      const getTemplateFlags = (): GroupResultFlags => ({ dropped: false, success: false, failed: false });

      // Assign original indexes
      const resultFlags: GroupResultFlags[] = [];
      groupResults.forEach((rd, idx) => {
        rd.origIdx = idx;
        resultFlags.push(getTemplateFlags());
      });

      // Handle drop/keep options
      if (groupConf.drop.on || groupConf.keep.on || groupConf.dropHigh.on || groupConf.keepLow.on) {
        groupResults.sort(compareTotalRolls);
        let dropCount = 0;

        // For normal drop and keep, simple subtraction is enough to determine how many to drop
        // Protections are in to prevent the dropCount from going below 0 or more than the valid rolls to drop
        if (groupConf.drop.on) {
          dropCount = groupConf.drop.count;
          if (dropCount > groupResults.length) {
            dropCount = groupResults.length;
          }
        } else if (groupConf.keep.on) {
          dropCount = groupResults.length - groupConf.keep.count;
          if (dropCount < 0) {
            dropCount = 0;
          }
        } // For inverted drop and keep, order must be flipped to greatest to least before the simple subtraction can determine how many to drop
        // Protections are in to prevent the dropCount from going below 0 or more than the valid rolls to drop
        else if (groupConf.dropHigh.on) {
          groupResults.reverse();
          dropCount = groupConf.dropHigh.count;
          if (dropCount > groupResults.length) {
            dropCount = groupResults.length;
          }
        } else if (groupConf.keepLow.on) {
          groupResults.reverse();
          dropCount = groupResults.length - groupConf.keepLow.count;
          if (dropCount < 0) {
            dropCount = 0;
          }
        }

        let i = 0;
        while (dropCount > 0 && i < groupResults.length) {
          loopCountCheck();

          loggingEnabled && log(LT.LOG, `Handling group dropping | Dropping ${dropCount}`);

          resultFlags[groupResults[i].origIdx ?? -1].dropped = true;

          dropCount--;
          i++;
        }

        groupResults.sort(compareOrigIdx);
      }

      let successCnt = 0;
      let failCnt = 0;
      if (groupConf.success.on || groupConf.fail.on) {
        groupResults.forEach((rd, idx) => {
          loopCountCheck();

          if (!resultFlags[idx].dropped) {
            if (groupConf.success.on && groupConf.success.range.includes(rd.rollTotal)) {
              successCnt++;
              resultFlags[idx].success = true;
            }
            if (groupConf.fail.on && groupConf.fail.range.includes(rd.rollTotal)) {
              failCnt++;
              resultFlags[idx].failed = true;
            }
          }
        });
      }

      loggingEnabled && log(LT.LOG, `Current Group Results: ${JSON.stringify(groupResults)}`);
      loggingEnabled && log(LT.LOG, `Applying group flags: ${JSON.stringify(resultFlags)}`);
      const data = groupResults.reduce(
        (prev, cur, idx) => ({
          rollTotal: resultFlags[idx].dropped ? prev.rollTotal : prev.rollTotal + cur.rollTotal,
          rollPreFormat: '',
          rollPostFormat: '',
          rollDetails: `${prev.rollDetails}, ${applyFlags(cur.rollDetails, resultFlags[idx])}`,
          containsCrit: resultFlags[idx].dropped ? prev.containsCrit : prev.containsCrit || cur.containsCrit,
          containsFail: resultFlags[idx].dropped ? prev.containsFail : prev.containsFail || cur.containsFail,
          initConfig: `${prev.initConfig}, ${cur.initConfig}`,
          isComplex: prev.isComplex || cur.isComplex,
        }),
        {
          rollTotal: 0,
          rollPreFormat: '',
          rollPostFormat: '',
          rollDetails: '',
          containsCrit: false,
          containsFail: false,
          initConfig: '',
          isComplex: false,
        },
      );
      data.initConfig = `{${data.initConfig}}${groupModifiers.replaceAll(' ', '')}`;

      if (groupConf.success.on || groupConf.fail.on) {
        data.rollTotal = 0;
      }
      if (groupConf.success.on) {
        data.rollTotal += successCnt;
        data.rollDetails += `, ${successCnt} Success${successCnt !== 1 ? 'es' : ''}`;
      }
      if (groupConf.fail.on) {
        data.rollTotal -= failCnt;
        data.rollDetails += `, ${failCnt} Fail${failCnt !== 1 ? 's' : ''}`;
      }

      data.rollDetails = `{${data.rollDetails}}`;
      retData = data;
    } else {
      // Sum mode
      const data = groupResults.reduce(
        (prev, cur) => ({
          rollTotal: prev.rollTotal + cur.rollTotal,
          rollPreFormat: '',
          rollPostFormat: '',
          rollDetails: `${prev.rollDetails} + ${cur.rollDetails}`,
          containsCrit: prev.containsCrit || cur.containsCrit,
          containsFail: prev.containsFail || cur.containsFail,
          initConfig: `${prev.initConfig}, ${cur.initConfig}`,
          isComplex: prev.isComplex || cur.isComplex,
        }),
        {
          rollTotal: 0,
          rollPreFormat: '',
          rollPostFormat: '',
          rollDetails: '',
          containsCrit: false,
          containsFail: false,
          initConfig: '',
          isComplex: false,
        },
      );
      data.initConfig = `{${data.initConfig}}`;
      data.rollDetails = `{${data.rollDetails}}`;
      retData = data;
    }
  } else {
    loggingEnabled && log(LT.LOG, `In single-mode ${JSON.stringify(commaParts)} ${groupModifiers} ${JSON.stringify(groupConf)}`);
    const [tempData, tempCounts, tempDists] = tokenizeMath(
      commaParts[0],
      modifiers,
      previousResults,
      prevGrpReturnData,
      groupModifiers.trim() ? groupConf : null,
    );
    const data = tempData[0];

    loggingEnabled && log(LT.LOG, `Solved Math for Group is back ${JSON.stringify(data)} | ${JSON.stringify(tempCounts)} ${JSON.stringify(tempDists)}`);

    countDetails.push(...tempCounts);
    rollDists.push(...tempDists);
    data.initConfig = `{${data.initConfig}}${groupModifiers.trim() ? groupModifiers.replaceAll(' ', '') : ''}`;
    data.rollDetails = `{${data.rollDetails}}`;
    retData = data;
  }

  // Handle merging back any nested groups to prevent an internalGrp marker from sneaking out
  const initConf = retData.initConfig.split(internalGrpWrapRegex).filter((x) => x);
  loggingEnabled && log(LT.LOG, `Split retData into initConf ${JSON.stringify(initConf)}`);
  while (initConf.includes(openInternalGrp)) {
    loopCountCheck();

    const openIdx = initConf.indexOf(openInternalGrp);
    const closeIdx = getMatchingInternalGrpIdx(initConf, openIdx);

    // Take first groupResult out of array
    const dataToMerge = prevGrpReturnData.shift();

    // Replace the found pair with the nested initConfig and result
    initConf.splice(openIdx, closeIdx - openIdx + 1, `${dataToMerge?.initConfig}`);
    loggingEnabled && log(LT.LOG, `Current initConf state ${JSON.stringify(initConf)}`);
  }

  retData.initConfig = initConf.join('');
  returnData.push(retData);
  return [returnData, countDetails, rollDists];
};
