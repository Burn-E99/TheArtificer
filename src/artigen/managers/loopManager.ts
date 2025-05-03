import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { loggingEnabled } from 'src/artigen/utils/logFlag.ts';

let loopCount = 0;
loggingEnabled && log(LT.LOG, 'Loop Manager Initialized');

// Will ensure if maxLoops is 10, 10 loops will be allowed, 11 will not.
export const loopCountCheck = (): void => {
  loopCount++;
  if (loopCount > config.limits.maxLoops) {
    throw new Error('MaxLoopsExceeded');
  }
};

export const getLoopCount = (): number => loopCount;
