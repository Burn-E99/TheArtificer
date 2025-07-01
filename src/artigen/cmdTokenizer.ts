import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { ReturnData } from 'artigen/artigen.d.ts';

import { CountDetails, RollDistributionMap, RollModifiers } from 'artigen/dice/dice.d.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

import { tokenizeMath } from 'artigen/math/mathTokenizer.ts';

import { reduceCountDetails } from 'artigen/utils/counter.ts';
import { closeInternal, internalWrapRegex, openInternal } from 'artigen/utils/escape.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { getMatchingInternalId, getMatchingPostfixId } from 'artigen/utils/parenBalance.ts';
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
    const closeIdx = getMatchingPostfixId(cmd, openIdx);

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
        rollTotal: simulatedData.map((data) => data.rollTotal).reduce(basicReducer) / simulatedData.length,
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
    loggingEnabled && log(LT.LOG, `Tokenizing math ${JSON.stringify(cmd)}`);

    // Solve the math and rolls for this cmd
    const [tempData, tempCounts, tempDists] = tokenizeMath(cmd.join(''), modifiers, previousResults);
    const data = tempData[0];
    loggingEnabled &&
      log(LT.LOG, `Solved math is back ${JSON.stringify(data)} | ${JSON.stringify(returnData)} ${JSON.stringify(tempCounts)} ${JSON.stringify(tempDists)}`);

    // Merge counts
    countDetails.push(...tempCounts);
    rollDists.push(...tempDists);

    // Handle merging returnData into tempData
    const initConf = data.initConfig.split(internalWrapRegex).filter((x) => x);
    loggingEnabled && log(LT.LOG, `Split solved math initConfig ${JSON.stringify(initConf)}`);
    while (initConf.includes(openInternal)) {
      loopCountCheck();

      const openIdx = initConf.indexOf(openInternal);
      const closeIdx = getMatchingInternalId(initConf, openIdx);

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
