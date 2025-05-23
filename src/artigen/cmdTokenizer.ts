import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { ReturnData } from 'artigen/artigen.d.ts';

import { CountDetails, RollModifiers } from 'artigen/dice/dice.d.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

import { tokenizeMath } from 'artigen/math/mathTokenizer.ts';

import { closeInternal, internalWrapRegex, openInternal } from 'artigen/utils/escape.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { getMatchingInternalIdx, getMatchingPostfixIdx } from 'artigen/utils/parenBalance.ts';
import { reduceCountDetails } from 'artigen/utils/counter.ts';

// tokenizeCmd expects a string[] of items that are either config.prefix/config.postfix or some text that contains math and/or dice rolls
export const tokenizeCmd = (cmd: string[], modifiers: RollModifiers, topLevel: boolean, previousResults: number[] = []): [ReturnData[], CountDetails[]] => {
  loggingEnabled && log(LT.LOG, `Tokenizing command ${JSON.stringify(cmd)}`);

  const returnData: ReturnData[] = [];
  const countDetails: CountDetails[] = [];

  // Wrapped commands still exist, unwrap them
  while (cmd.includes(config.prefix)) {
    loopCountCheck();

    const openIdx = cmd.indexOf(config.prefix);
    const closeIdx = getMatchingPostfixIdx(cmd, openIdx);

    const currentCmd = cmd.slice(openIdx + 1, closeIdx);

    loggingEnabled && log(LT.LOG, `Setting previous results: topLevel:${topLevel} ${topLevel ? returnData.map((rd) => rd.rollTotal) : previousResults}`);

    // Handle any nested commands
    const [tempData, tempCounts] = tokenizeCmd(currentCmd, modifiers, false, topLevel ? returnData.map((rd) => rd.rollTotal) : previousResults);
    const data = tempData[0];

    if (topLevel) {
      // Handle saving any formatting between dice
      if (openIdx !== 0) {
        data.rollPreFormat = cmd.slice(0, openIdx).join('');
      }

      // Chop off all formatting between cmds along with the processed cmd
      cmd.splice(0, closeIdx + 1);
    } else {
      // We're handling something nested, replace [[cmd]] with the cmd's result
      cmd.splice(openIdx, closeIdx - openIdx + 1, `${openInternal}${data.rollTotal}${closeInternal}`);
    }

    // Store results
    returnData.push(data);
    countDetails.push(...tempCounts);

    if (topLevel && modifiers.confirmCrit && reduceCountDetails(tempCounts).successful) {
      loggingEnabled && log(LT.LOG, `ConfirmCrit on ${JSON.stringify(currentCmd)}`);
      let done = false;
      while (!done) {
        loopCountCheck();

        const [ccTempData, ccTempCounts] = tokenizeCmd(currentCmd, modifiers, false, topLevel ? returnData.map((rd) => rd.rollTotal) : previousResults);
        const ccData = ccTempData[0];
        ccData.rollPreFormat = '\nAuto-Confirming Crit: ';

        loggingEnabled && log(LT.LOG, `ConfirmCrit on ${JSON.stringify(currentCmd)} | Rolled again ${JSON.stringify(ccData)} ${JSON.stringify(ccTempCounts)}`);

        // Store CC results
        returnData.push(ccData);
        countDetails.push(...ccTempCounts);

        done = reduceCountDetails(ccTempCounts).successful === 0;
      }
    }
  }

  if (topLevel) {
    if (cmd.length) {
      loggingEnabled && log(LT.LOG, `Adding leftover formatting to last returnData ${JSON.stringify(cmd)}`);
      returnData[returnData.length - 1].rollPostFormat = cmd.join('');
    }
    return [returnData, countDetails];
  } else {
    loggingEnabled && log(LT.LOG, `Tokenizing math ${JSON.stringify(cmd)}`);

    // Solve the math and rolls for this cmd
    const [tempData, tempCounts] = tokenizeMath(cmd.join(''), modifiers, previousResults);
    const data = tempData[0];
    loggingEnabled && log(LT.LOG, `Solved math is back ${JSON.stringify(data)} | ${JSON.stringify(returnData)}`);

    // Merge counts
    countDetails.push(...tempCounts);

    // Handle merging returnData into tempData
    const initConf = data.initConfig.split(internalWrapRegex).filter((x) => x);
    loggingEnabled && log(LT.LOG, `Split solved math initConfig ${JSON.stringify(initConf)}`);
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
    return [[data], countDetails];
  }
};
