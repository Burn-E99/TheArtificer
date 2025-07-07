import { log, LogTypes as LT } from '@Log4Deno';

import { GroupConf } from 'artigen/dice/dice.d.ts';
import { getRollConf } from 'artigen/dice/getRollConf.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';

// Wrapper to abuse getRollConf, produces a GroupConf by making the groupStr into a rollStr by adding a 1d1 onto it
export const getGroupConf = (groupStr: string, rawStr: string): GroupConf => {
  const numberMatches = rawStr.match(/\d+/g) ?? ['1'];

  let biggest = parseInt(numberMatches.length ? numberMatches[0] : '1');
  for (const num of numberMatches) {
    loopCountCheck();

    const curNum = parseInt(num);
    loggingEnabled && log(LT.LOG, `Finding biggest number to use as die size, ${curNum} ${biggest}`);
    if (curNum > biggest) {
      biggest = curNum;
    }
  }

  loggingEnabled && log(LT.LOG, `Abusing getRollConf with "1d${biggest} ${groupStr}"`);
  const fakeRollConf = getRollConf(`1d${biggest}${groupStr}`);
  loggingEnabled && log(LT.LOG, `Abused rollConf back for ${groupStr}: ${JSON.stringify(fakeRollConf)}`);
  return {
    drop: fakeRollConf.drop,
    keep: fakeRollConf.keep,
    dropHigh: fakeRollConf.dropHigh,
    keepLow: fakeRollConf.keepLow,
    success: fakeRollConf.success,
    fail: fakeRollConf.fail,
  };
};
