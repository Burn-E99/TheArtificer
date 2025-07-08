import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { ReturnData } from 'artigen/artigen.d.ts';

import { CountDetails, RollDistributionMap, RollModifiers } from 'artigen/dice/dice.d.ts';
import { handleGroup } from 'artigen/dice/groupHandler.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

import { tokenizeMath } from 'artigen/math/mathTokenizer.ts';

import { reduceCountDetails } from 'artigen/utils/counter.ts';
import { closeInternal, closeInternalGrp, internalGrpWrapRegex, internalWrapRegex, mathSplitRegex, openInternal, openInternalGrp } from 'artigen/utils/escape.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { assertGroupBalance, getMatchingGroupIdx, getMatchingInternalGrpIdx, getMatchingInternalIdx, getMatchingPostfixIdx } from 'artigen/utils/parenBalance.ts';
import { basicReducer } from 'artigen/utils/reducers.ts';

// tokenizeCmd expects a string[] of items that are either config.prefix/config.postfix or some text that contains math and/or dice rolls
export const tokenizeCmd = (
  cmd: string[],
  modifiers: RollModifiers,
  topLevel: boolean,
  previousResults: number[] = [],
): [ReturnData[], CountDetails[], RollDistributionMap[]] => {
  loggingEnabled && log(LT.LOG, `Tokenizing command ${JSON.stringify(cmd)}`);

  const returnData: ReturnData[] = [];
  const countDetails: CountDetails[] = [];
  const rollDists: RollDistributionMap[] = [];

  // Wrapped commands still exist, unwrap them
  while (cmd.includes(config.prefix)) {
    loopCountCheck();

    const openIdx = cmd.indexOf(config.prefix);
    const closeIdx = getMatchingPostfixIdx(cmd, openIdx);

    const currentCmd = cmd.slice(openIdx + 1, closeIdx);

    const simulatedLoopCount = modifiers.simulatedNominal || 1;

    loggingEnabled &&
      log(
        LT.LOG,
        `Setting previous results: topLevel:${topLevel} ${topLevel ? returnData.map((rd) => rd.rollTotal) : previousResults} simulatedLoopCount:${simulatedLoopCount}`,
      );

    const simulatedData: ReturnData[] = [];
    for (let i = 0; i < simulatedLoopCount; i++) {
      loopCountCheck();

      loggingEnabled && log(LT.LOG, `In simLoop:${i} "${currentCmd}" of ${JSON.stringify(cmd)}`);

      // Handle any nested commands
      const [tempData, tempCounts, tempDists] = tokenizeCmd(currentCmd, modifiers, false, topLevel ? returnData.map((rd) => rd.rollTotal) : previousResults);
      const data = tempData[0];
      loggingEnabled && log(LT.LOG, `Data back from tokenizeCmd, "${currentCmd}" of "${JSON.stringify(cmd)}" ${JSON.stringify(data)}`);

      // Only run this on first loop
      if (topLevel && i === 0) {
        // Handle saving any formatting between dice
        if (openIdx !== 0) {
          data.rollPreFormat = cmd.slice(0, openIdx).join('');
        }

        // Chop off all formatting between cmds along with the processed cmd
        cmd.splice(0, closeIdx + 1);
      }
      // Store results
      modifiers.simulatedNominal ? simulatedData.push(data) : returnData.push(data);
      countDetails.push(...tempCounts);
      rollDists.push(...tempDists);

      // Handle ConfirmCrit if its on
      if (topLevel && modifiers.confirmCrit && reduceCountDetails(tempCounts).successful) {
        loggingEnabled && log(LT.LOG, `ConfirmCrit on ${JSON.stringify(currentCmd)}`);
        let done = false;
        while (!done) {
          loopCountCheck();

          // Keep running the same roll again until its not successful
          const [ccTempData, ccTempCounts, ccTempDists] = tokenizeCmd(
            currentCmd,
            modifiers,
            false,
            topLevel ? returnData.map((rd) => rd.rollTotal) : previousResults,
          );
          const ccData = ccTempData[0];
          ccData.rollPreFormat = '\nAuto-Confirming Crit: ';

          loggingEnabled &&
            log(LT.LOG, `ConfirmCrit on ${JSON.stringify(currentCmd)} | Rolled again ${JSON.stringify(ccData)} ${JSON.stringify(ccTempCounts)}`);

          // Store CC results
          returnData.push(ccData);
          countDetails.push(...ccTempCounts);
          rollDists.push(...ccTempDists);

          done = reduceCountDetails(ccTempCounts).successful === 0;
        }
      }
    }

    // Turn the simulated return data into a single usable payload
    if (modifiers.simulatedNominal) {
      loggingEnabled && log(LT.LOG, `SN on, condensing array into single item ${JSON.stringify(simulatedData)}`);
      returnData.push({
        rollTotal: simulatedData.map((data) => data.rollTotal).reduce(basicReducer, 0) / simulatedData.length,
        rollPreFormat: simulatedData[0].rollPreFormat,
        rollPostFormat: simulatedData[0].rollPostFormat,
        rollDetails: simulatedData[0].rollDetails,
        containsCrit: simulatedData.some((data) => data.containsCrit),
        containsFail: simulatedData.some((data) => data.containsFail),
        initConfig: simulatedData[0].initConfig,
        isComplex: simulatedData[0].isComplex,
      });
      loggingEnabled && log(LT.LOG, `SN on, returnData updated ${JSON.stringify(returnData)}`);
    }

    // Finally, if we are handling a nested [[cmd]], fill in the rollTotal correctly
    if (!topLevel) {
      cmd.splice(openIdx, closeIdx - openIdx + 1, `${openInternal}${Math.round(returnData[returnData.length - 1].rollTotal)}${closeInternal}`);
    }
  }

  if (topLevel) {
    if (cmd.length) {
      loggingEnabled && log(LT.LOG, `Adding leftover formatting to last returnData ${JSON.stringify(cmd)}`);
      returnData[returnData.length - 1].rollPostFormat = cmd.join('');
    }
    return [returnData, countDetails, rollDists];
  } else {
    // Check for any groups and handle them
    const groupParts = cmd
      .join('')
      .split(/([{}])/g)
      .filter((x) => x);
    const groupResults: ReturnData[] = [];
    if (groupParts.includes('{')) {
      assertGroupBalance(groupParts);
    }
    while (groupParts.includes('{')) {
      loggingEnabled && log(LT.LOG, `Handling Groups | Current cmd: ${JSON.stringify(groupParts)}`);

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
      log(LT.LOG, `Solved Group is back ${JSON.stringify(data)} | ${JSON.stringify(returnData)} ${JSON.stringify(tempCounts)} ${JSON.stringify(tempDists)}`);

      countDetails.push(...tempCounts);
      rollDists.push(...tempDists);

      // Merge result back into groupParts
      groupParts.splice(openIdx, closeIdx - openIdx + 1, `${openInternalGrp}${groupResults.length}${closeInternalGrp}`);
      groupResults.push(data);
    }

    const cmdForMath = groupParts.join('');
    loggingEnabled && log(LT.LOG, `Tokenizing math ${cmdForMath}`);

    // Solve the math and rolls for this cmd
    const [tempData, tempCounts, tempDists] = tokenizeMath(cmdForMath, modifiers, previousResults, groupResults);
    const data = tempData[0];
    loggingEnabled &&
      log(
        LT.LOG,
        `Solved math is back ${JSON.stringify(data)} | ${JSON.stringify(returnData)} ${JSON.stringify(groupResults)} ${
          JSON.stringify(
            tempCounts,
          )
        } ${JSON.stringify(tempDists)}`,
      );

    // Merge counts
    countDetails.push(...tempCounts);
    rollDists.push(...tempDists);

    // Handle merging group data into initConfig first since a group could "smuggle" a returnData in it
    const tempInitConf = data.initConfig.split(internalGrpWrapRegex).filter((x) => x);
    loggingEnabled && log(LT.LOG, `Split solved math into tempInitConf ${JSON.stringify(tempInitConf)}`);
    while (tempInitConf.includes(openInternalGrp)) {
      loopCountCheck();

      const openIdx = tempInitConf.indexOf(openInternalGrp);
      const closeIdx = getMatchingInternalGrpIdx(tempInitConf, openIdx);

      // Take first groupResult out of array
      const dataToMerge = groupResults.shift();

      // Replace the found pair with the nested tempInitConfig and result
      tempInitConf.splice(openIdx, closeIdx - openIdx + 1, `${dataToMerge?.initConfig}`);
      loggingEnabled && log(LT.LOG, `Current tempInitConf state ${JSON.stringify(tempInitConf)}`);
    }

    // Handle merging returnData into tempData
    const initConf = tempInitConf
      .join('')
      .split(internalWrapRegex)
      .filter((x) => x);
    loggingEnabled && log(LT.LOG, `Split tempInitConfig into initConf ${JSON.stringify(initConf)}`);
    while (initConf.includes(openInternal)) {
      loopCountCheck();

      const openIdx = initConf.indexOf(openInternal);
      const closeIdx = getMatchingInternalIdx(initConf, openIdx);

      // Take first returnData out of array
      const dataToMerge = returnData.shift();

      // Replace the found pair with the nested initConfig and result
      initConf.splice(openIdx, closeIdx - openIdx + 1, `${config.prefix}${dataToMerge?.initConfig}=${dataToMerge?.rollTotal}${config.postfix}`);
      loggingEnabled && log(LT.LOG, `Current initConf state ${JSON.stringify(initConf)}`);
    }

    // Join all parts/remainders
    data.initConfig = initConf.join('');
    loggingEnabled && log(LT.LOG, `ReturnData merged into solved math ${JSON.stringify(data)} | ${JSON.stringify(countDetails)}`);
    return [[data], countDetails, rollDists];
  }
};
