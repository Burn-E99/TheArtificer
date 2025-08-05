import { log, LogTypes as LT } from '@Log4Deno';

import { GroupConf } from 'artigen/dice/dice.d.ts';
import { getRollConf } from 'artigen/dice/getRollConf.ts';
import { GroupOptions } from 'artigen/dice/rollOptions.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';

// Wrapper to abuse getRollConf, produces a GroupConf by making the groupStr into a rollStr by adding a 1d1 onto it
export const getGroupConf = (groupStr: string, rawStr: string): GroupConf => {
  const numberMatches = rawStr.match(/\d+/g) ?? ['1'];

  let biggest = parseInt(numberMatches.length ? numberMatches[0] : '1');
  for (const num of numberMatches) {
    loopCountCheck('getGroupConf.ts - finding biggest number for die size');

    const curNum = parseInt(num);
    loggingEnabled && log(LT.LOG, `Finding biggest number to use as die size, ${curNum} ${biggest}`);
    if (curNum > biggest) {
      biggest = curNum;
    }
  }

  loggingEnabled && log(LT.LOG, `Abusing getRollConf with "1d${biggest} ${groupStr}"`);
  const fakeRollConf = getRollConf(`1d${biggest}${groupStr}`);
  loggingEnabled && log(LT.LOG, `Abused rollConf back for ${groupStr}: ${JSON.stringify(fakeRollConf)}`);

  // Apply > to minValue and < to maxValue for success and fail
  const groupSplit = groupStr.split(/(\d+)/g).filter((x) => x);
  loggingEnabled && log(LT.LOG, `Handling success/fail gt/lt ${JSON.stringify(groupSplit)}`);

  let minSuccess: number | null = null;
  let maxSuccess: number | null = null;
  let minFail: number | null = null;
  let maxFail: number | null = null;

  while (groupSplit.length) {
    loopCountCheck('getGroupConf.ts - parsing groupConf');

    const option = groupSplit.shift() ?? '';
    const value = parseInt(groupSplit.shift() ?? '');

    if (!isNaN(value)) {
      switch (option) {
        case GroupOptions.SuccessLt:
          maxSuccess = maxSuccess && value < maxSuccess ? maxSuccess : value;
          break;
        case GroupOptions.SuccessGtr:
          minSuccess = minSuccess && value > minSuccess ? minSuccess : value;
          break;
        case GroupOptions.FailLt:
          maxFail = maxFail && value < maxFail ? maxFail : value;
          break;
        case GroupOptions.FailGtr:
          minFail = minFail && value > minFail ? minFail : value;
          break;
      }
    }
  }

  loggingEnabled && log(LT.LOG, `Parsed GT/LT: minSuccess: ${minSuccess} maxSuccess: ${maxSuccess} minFail: ${minFail} maxFail: ${maxFail}`);

  return {
    drop: fakeRollConf.drop,
    keep: fakeRollConf.keep,
    dropHigh: fakeRollConf.dropHigh,
    keepLow: fakeRollConf.keepLow,
    success: { ...fakeRollConf.success, minValue: minSuccess, maxValue: maxSuccess },
    fail: { ...fakeRollConf.fail, minValue: minFail, maxValue: maxFail },
  };
};
