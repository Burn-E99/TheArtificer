import { log, LogTypes as LT } from '@Log4Deno';

import { tokenizeCmd } from 'artigen/cmdTokenizer.ts';
import { SolvedRoll } from 'artigen/solver.d.ts';

import { cmdSplitRegex, escapeCharacters } from 'artigen/utils/escape.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { compareTotalRolls, compareTotalRollsReverse } from 'artigen/utils/sortFuncs.ts';
import { translateError } from 'artigen/utils/translateError.ts';

import { RollModifiers } from 'src/mod.d.ts';
import { assertPrePostBalance } from 'src/artigen/utils/parenBalance.ts';

// parseRoll(fullCmd, modifiers)
// parseRoll handles converting fullCmd into a computer readable format for processing, and finally executes the solving
export const parseRoll = (fullCmd: string, modifiers: RollModifiers): SolvedRoll => {
  const returnMsg: SolvedRoll = {
    error: false,
    errorCode: '',
    errorMsg: '',
    line1: '',
    line2: '',
    line3: '',
    counts: {
      total: 0,
      successful: 0,
      failed: 0,
      rerolled: 0,
      dropped: 0,
      exploded: 0,
    },
  };

  // Whole processor lives in a try-catch to catch artigen's intentional error conditions
  try {
    // filter removes all null/empty strings since we don't care about them
    const sepCmds = fullCmd.split(cmdSplitRegex).filter((x) => x);
    loggingEnabled && log(LT.LOG, `Split cmd into parts ${JSON.stringify(sepCmds)}`);

    // Verify prefix/postfix balance
    assertPrePostBalance(sepCmds);

    // Send the split roll into the command tokenizer to get raw response data
    const [tempReturnData, tempCountDetails] = tokenizeCmd(sepCmds, modifiers, true);
    loggingEnabled && log(LT.LOG, `Return data is back ${JSON.stringify(tempReturnData)}`);

    // Remove any floating spaces from fullCmd
    fullCmd = fullCmd.trim();

    // Escape any | and ` chars in fullCmd to prevent spoilers and code blocks from acting up
    fullCmd = escapeCharacters(fullCmd, '|');
    fullCmd = fullCmd.replace(/`/g, '');

    let line1 = '';
    let line2 = '';
    let line3 = '';

    // The ': ' is used by generateRollEmbed to split line 2 up
    const resultStr = tempReturnData.length > 1 ? 'Results: ' : 'Result: ';
    line2 = resultStr;

    // If a theoretical roll is requested, mark the output as such, else use default formatting
    if (modifiers.maxRoll || modifiers.minRoll || modifiers.nominalRoll) {
      const theoreticalTexts = ['Maximum', 'Minimum', 'Nominal'];
      const theoreticalBools = [modifiers.maxRoll, modifiers.minRoll, modifiers.nominalRoll];
      const theoreticalText = theoreticalTexts[theoreticalBools.indexOf(true)];

      line1 = ` requested the Theoretical ${theoreticalText} of:\n\`${fullCmd}\``;
      line2 = `Theoretical ${theoreticalText} ${resultStr}`;
    } else if (modifiers.order === 'a') {
      line1 = ` requested the following rolls to be ordered from least to greatest:\n\`${fullCmd}\``;
      tempReturnData.sort(compareTotalRolls);
    } else if (modifiers.order === 'd') {
      line1 = ` requested the following rolls to be ordered from greatest to least:\n\`${fullCmd}\``;
      tempReturnData.sort(compareTotalRollsReverse);
    } else {
      line1 = ` rolled:\n\`${fullCmd}\``;
    }

    // Fill out all of the details and results now
    tempReturnData.forEach((e) => {
      loggingEnabled && log(LT.LOG, `Parsing roll ${fullCmd} | Making return text ${JSON.stringify(e)}`);
      let preFormat = '';
      let postFormat = '';

      // If the roll contained a crit success or fail, set the formatting around it
      if (e.containsCrit) {
        preFormat = `**${preFormat}`;
        postFormat = `${postFormat}**`;
      }
      if (e.containsFail) {
        preFormat = `__${preFormat}`;
        postFormat = `${postFormat}__`;
      }

      // Populate line2 (the results) and line3 (the details) with their data
      if (modifiers.order === '') {
        line2 += `${e.rollPreFormat ? escapeCharacters(e.rollPreFormat, '|*_~`') : ' '}${preFormat}${modifiers.commaTotals ? e.rollTotal.toLocaleString() : e.rollTotal}${postFormat}${
          e.rollPostFormat ? escapeCharacters(e.rollPostFormat, '|*_~`') : ''
        }`;
      } else {
        // If order is on, turn rolls into csv without formatting
        line2 += `${preFormat}${modifiers.commaTotals ? e.rollTotal.toLocaleString() : e.rollTotal}${postFormat}, `;
      }

      line3 += `\`${e.initConfig}\` = ${e.rollDetails} = ${preFormat}${modifiers.commaTotals ? e.rollTotal.toLocaleString() : e.rollTotal}${postFormat}\n`;
    });

    // If order is on, remove trailing ", "
    if (modifiers.order !== '') {
      line2 = line2.substring(0, line2.length - 2);
    }

    // Fill in the return block
    returnMsg.line1 = line1;
    returnMsg.line2 = line2;
    returnMsg.line3 = line3;

    // Reduce counts to a single object
    returnMsg.counts = tempCountDetails.reduce((acc, cnt) => ({
      total: acc.total + cnt.total,
      successful: acc.successful + cnt.successful,
      failed: acc.failed + cnt.failed,
      rerolled: acc.rerolled + cnt.rerolled,
      dropped: acc.dropped + cnt.dropped,
      exploded: acc.exploded + cnt.exploded,
    }));
  } catch (e) {
    // Fill in the return block
    returnMsg.error = true;
    [returnMsg.errorCode, returnMsg.errorMsg] = translateError(e as Error);
  }

  return returnMsg;
};
