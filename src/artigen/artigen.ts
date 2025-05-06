import { log, LogTypes as LT } from '@Log4Deno';

import { SolvedRoll } from 'artigen/artigen.d.ts';
import { tokenizeCmd } from 'artigen/cmdTokenizer.ts';

import { QueuedRoll } from 'artigen/managers/manager.d.ts';

import { cmdSplitRegex, escapeCharacters } from 'artigen/utils/escape.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { assertPrePostBalance } from 'artigen/utils/parenBalance.ts';
import { compareTotalRolls, compareTotalRollsReverse } from 'artigen/utils/sortFuncs.ts';
import { translateError } from 'artigen/utils/translateError.ts';
import { reduceCountDetails } from 'artigen/utils/counter.ts';

// runCmd(rollRequest)
// runCmd handles converting rollRequest into a computer readable format for processing, and finally executes the solving
export const runCmd = (rollRequest: QueuedRoll): SolvedRoll => {
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
    const sepCmds = rollRequest.rollCmd.split(cmdSplitRegex).filter((x) => x);
    loggingEnabled && log(LT.LOG, `Split cmd into parts ${JSON.stringify(sepCmds)}`);

    // Verify prefix/postfix balance
    assertPrePostBalance(sepCmds);

    // Send the split roll into the command tokenizer to get raw response data
    const [tempReturnData, tempCountDetails] = tokenizeCmd(sepCmds, rollRequest.modifiers, true);
    loggingEnabled && log(LT.LOG, `Return data is back ${JSON.stringify(tempReturnData)}`);

    // Remove any floating spaces from originalCommand
    // Escape any | and ` chars in originalCommand to prevent spoilers and code blocks from acting up
    const rawCmd = escapeCharacters(rollRequest.originalCommand.trim(), '|').replace(/`/g, '');

    let line1 = '';
    let line2 = '';
    let line3 = '';

    // The ': ' is used by generateRollEmbed to split line 2 up
    const resultStr = tempReturnData.length > 1 ? 'Results: ' : 'Result: ';
    line2 = resultStr;

    // If a theoretical roll is requested, mark the output as such, else use default formatting
    if (rollRequest.modifiers.maxRoll || rollRequest.modifiers.minRoll || rollRequest.modifiers.nominalRoll) {
      const theoreticalTexts = ['Maximum', 'Minimum', 'Nominal'];
      const theoreticalBools = [rollRequest.modifiers.maxRoll, rollRequest.modifiers.minRoll, rollRequest.modifiers.nominalRoll];
      const theoreticalText = theoreticalTexts[theoreticalBools.indexOf(true)];

      line1 = ` requested the Theoretical ${theoreticalText} of:\n\`${rawCmd}\``;
      line2 = `Theoretical ${theoreticalText} ${resultStr}`;
    } else if (rollRequest.modifiers.order === 'a') {
      line1 = ` requested the following rolls to be ordered from least to greatest:\n\`${rawCmd}\``;
      tempReturnData.sort(compareTotalRolls);
    } else if (rollRequest.modifiers.order === 'd') {
      line1 = ` requested the following rolls to be ordered from greatest to least:\n\`${rawCmd}\``;
      tempReturnData.sort(compareTotalRollsReverse);
    } else {
      line1 = ` rolled:\n\`${rawCmd}\``;
    }

    // Fill out all of the details and results now
    tempReturnData.forEach((e) => {
      loggingEnabled && log(LT.LOG, `Parsing roll ${rollRequest.rollCmd} | Making return text ${JSON.stringify(e)}`);
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
      if (rollRequest.modifiers.order === '') {
        line2 += `${e.rollPreFormat ? escapeCharacters(e.rollPreFormat, '|*_~`') : ' '}${preFormat}${rollRequest.modifiers.commaTotals ? e.rollTotal.toLocaleString() : e.rollTotal}${postFormat}${
          e.rollPostFormat ? escapeCharacters(e.rollPostFormat, '|*_~`') : ''
        }`;
      } else {
        // If order is on, turn rolls into csv without formatting
        line2 += `${preFormat}${rollRequest.modifiers.commaTotals ? e.rollTotal.toLocaleString() : e.rollTotal}${postFormat}, `;
      }

      const rollDetails = rollRequest.modifiers.noDetails ? ' = ' : ` = ${e.rollDetails} = `;
      line3 += `\`${e.initConfig}\`${rollDetails}${preFormat}${rollRequest.modifiers.commaTotals ? e.rollTotal.toLocaleString() : e.rollTotal}${postFormat}\n`;
    });

    // If order is on, remove trailing ", "
    if (rollRequest.modifiers.order !== '') {
      line2 = line2.substring(0, line2.length - 2);
    }

    // Fill in the return block
    returnMsg.line1 = line1;
    returnMsg.line2 = line2;
    returnMsg.line3 = line3;

    // Reduce counts to a single object
    returnMsg.counts = reduceCountDetails(tempCountDetails);
  } catch (e) {
    // Fill in the return block
    const solverError = e as Error;
    loggingEnabled && log(LT.ERROR, `Error hit: ${solverError.message} | ${rollRequest.rollCmd}`);
    returnMsg.error = true;
    [returnMsg.errorCode, returnMsg.errorMsg] = translateError(solverError);
  }

  return returnMsg;
};
