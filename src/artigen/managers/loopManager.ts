import config from '~config';

let loopCount = 0;

// Will ensure if maxLoops is 10, 10 loops will be allowed, 11 will not.
export const loopCountCheck = (): void => {
  loopCount++;
  if (loopCount > config.limits.maxLoops) {
    throw new Error('MaxLoopsExceeded');
  }
};

export const getLoopCount = (): number => loopCount;
