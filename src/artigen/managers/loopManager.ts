import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { loopLoggingEnabled } from 'artigen/utils/logFlag.ts';

let loopCount = 0;

// Will ensure if maxLoops is 10, 10 loops will be allowed, 11 will not.
export const loopCountCheck = (location = 'unset'): void => {
  loopCount++;
  loopLoggingEnabled && log(LT.LOG, `Loop #${loopCount} at "${location}"`);
  if (loopCount > config.limits.maxLoops) {
    throw new Error('MaxLoopsExceeded');
  }
};

export const getLoopCount = (): number => loopCount;
