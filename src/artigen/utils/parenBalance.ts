import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

import { MathConf } from 'artigen/math/math.d.ts';

import { closeInternal, openInternal } from 'artigen/utils/escape.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';

const checkBalance = (conf: MathConf[], openStr: string, closeStr: string, errorType: string, getMatching: boolean, openIdx: number): number => {
  let parenCnt = 0;

  // Verify there are equal numbers of opening and closing parenthesis by adding 1 for opening parens and subtracting 1 for closing parens
  for (let i = openIdx; i < conf.length; i++) {
    loopCountCheck();
    loggingEnabled &&
      log(
        LT.LOG,
        `${getMatching ? 'Looking for matching' : 'Checking'} ${openStr}/${closeStr} ${getMatching ? '' : 'balance '}on ${
          JSON.stringify(
            conf,
          )
        } | at ${JSON.stringify(conf[i])}`,
      );
    if (conf[i] === openStr) {
      parenCnt++;
    } else if (conf[i] === closeStr) {
      parenCnt--;
    }

    // If parenCnt ever goes below 0, that means too many closing paren appeared before opening parens
    if (parenCnt < 0) {
      throw new Error(`Unbalanced${errorType}`);
    }

    // When parenCnt reaches 0 again, we will have found the matching closing parenthesis and can safely exit the for loop
    if (getMatching && parenCnt === 0) {
      loggingEnabled && log(LT.LOG, `Matching ${openStr}/${closeStr} found at "${i}" | ${JSON.stringify(conf[i])}`);
      return i;
    }
  }

  // If the parenCnt is not 0, then we do not have balanced parens and need to error out now
  // If getMatching flag is set and we have exited the loop, we did not find a matching paren
  if (parenCnt !== 0 || getMatching) {
    throw new Error(`Unbalanced${errorType}`);
  }

  // getMatching flag not set, this value is unused
  return 0;
};

// assertXBalance verifies the entire conf has balanced X
export const assertParenBalance = (conf: MathConf[]) => checkBalance(conf, '(', ')', 'Paren', false, 0);
export const assertPrePostBalance = (conf: MathConf[]) => checkBalance(conf, config.prefix, config.postfix, 'PrefixPostfix', false, 0);

// getMatchingXIdx gets the matching X, also partially verifies the conf has balanced X
export const getMatchingInternalIdx = (conf: MathConf[], openIdx: number): number => checkBalance(conf, openInternal, closeInternal, 'Internal', true, openIdx);
export const getMatchingParenIdx = (conf: MathConf[], openIdx: number): number => checkBalance(conf, '(', ')', 'Paren', true, openIdx);
export const getMatchingPostfixIdx = (conf: MathConf[], openIdx: number): number => checkBalance(conf, config.prefix, config.postfix, 'PrefixPostfix', true, openIdx);
