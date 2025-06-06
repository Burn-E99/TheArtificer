import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';

// escapeCharacters(str, esc) returns str
// escapeCharacters escapes all characters listed in esc
export const escapeCharacters = (str: string, esc: string): string => {
  // Loop thru each esc char one at a time
  for (const e of esc) {
    loopCountCheck();

    loggingEnabled && log(LT.LOG, `Escaping character ${e} | ${str}, ${esc}`);
    // Create a new regex to look for that char that needs replaced and escape it
    const tempRgx = new RegExp(`[${e}]`, 'g');
    str = str.replace(tempRgx, `\\${e}`);
  }
  return str;
};

// escapePrefixPostfix(str) returns str
// Escapes all characters that need escaped in a regex string to allow prefix/postfix to be configurable
const escapePrefixPostfix = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const cmdSplitRegex = new RegExp(`(${escapePrefixPostfix(config.prefix)})|(${escapePrefixPostfix(config.postfix)})`, 'g');

// Internal is used for recursive text replacement, these will always be the top level as they get replaced with config.prefix/postfix when exiting each level
export const openInternal = '\u2045';
export const closeInternal = '\u2046';
export const internalWrapRegex = new RegExp(`([${openInternal}${closeInternal}])`, 'g');
