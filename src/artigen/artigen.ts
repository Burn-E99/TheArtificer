import { log, LogTypes as LT } from '@Log4Deno';

import { SolvedRoll } from 'artigen/artigen.d.ts';
import { tokenizeCmd } from 'artigen/cmdTokenizer.ts';

import { Modifiers } from 'artigen/dice/getModifiers.ts';

import { getLoopCount, loopCountCheck } from 'artigen/managers/loopManager.ts';
import { QueuedRoll } from 'artigen/managers/manager.d.ts';

import { reduceCountDetails } from 'artigen/utils/counter.ts';
import { cmdSplitRegex, escapeCharacters, withYVarsDash } from 'artigen/utils/escape.ts';
import { loggingEnabled, loopLoggingEnabled } from 'artigen/utils/logFlag.ts';
import { assertPrePostBalance } from 'artigen/utils/parenBalance.ts';
import { reduceRollDistMaps } from 'artigen/utils/rollDist.ts';
import { compareTotalRolls, compareTotalRollsReverse, sortYVars } from 'artigen/utils/sortFuncs.ts';
import { translateError } from 'artigen/utils/translateError.ts';

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
    footer: '',
    counts: {
      total: 0,
      successful: 0,
      failed: 0,
      rerolled: 0,
      dropped: 0,
      exploded: 0,
      success: 0,
      fail: 0,
      matches: new Map<string, number>(),
    },
    rollDistributions: new Map<string, number[]>(),
  };

  // Whole processor lives in a try-catch to catch artigen's intentional error conditions
  try {
    loggingEnabled && log(LT.LOG, `rollRequest received! ${JSON.stringify(rollRequest)}`);
    // filter removes all null/empty strings since we don't care about them
    const sepCmds = rollRequest.rollCmd.split(cmdSplitRegex).filter((x) => x);
    loggingEnabled && log(LT.LOG, `Split cmd into parts ${JSON.stringify(sepCmds)}`);

    // Verify prefix/postfix balance
    assertPrePostBalance(sepCmds);

    // Send the split roll into the command tokenizer to get raw response data
    const [tempReturnData, tempCountDetails, tempRollDists] = tokenizeCmd(sepCmds, rollRequest.modifiers, true);
    loggingEnabled && log(LT.LOG, `Return data is back ${JSON.stringify(tempReturnData)} ${JSON.stringify(tempCountDetails)} ${JSON.stringify(tempRollDists)}`);

    // Remove any floating spaces from originalCommand
    // Escape any | and ` chars in originalCommand to prevent spoilers and code blocks from acting up
    let rawCmd = escapeCharacters(rollRequest.originalCommand.trim(), '|').replace(/`/g, '');

    // Remove yvariables from the rawCmd since this is intended for internal use only
    if (rawCmd.includes(Modifiers.YVars)) {
      rawCmd = rawCmd.replaceAll(new RegExp(`( ${Modifiers.YVars} (\\d+,)+\\d+)`, 'g'), '');
    }

    let line1 = '';
    let line2 = '';
    let line3 = '';

    // The ': ' is used by generateRollEmbed to split line 2 up
    const resultStr = tempReturnData.length > 1 ? 'Results: ' : 'Result: ';
    line2 = resultStr;

    // If a theoretical roll is requested, mark the output as such, else use default formatting
    const theoreticalBools = [
      rollRequest.modifiers.maxRoll,
      rollRequest.modifiers.minRoll,
      rollRequest.modifiers.nominalRoll,
      rollRequest.modifiers.simulatedNominal > 0,
    ];
    if (theoreticalBools.includes(true)) {
      const theoreticalTexts = ['Theoretical Maximum', 'Theoretical Minimum', 'Theoretical Nominal', 'Simulated Nominal'];
      const theoreticalText = theoreticalTexts[theoreticalBools.indexOf(true)];

      line1 = ` requested the ${theoreticalText.toLowerCase()} of:\n\`${rawCmd}\``;
      line2 = `${theoreticalText} ${resultStr}`;
    } else if (rollRequest.modifiers.order === 'a') {
      line1 = ` requested the following rolls to be ordered from least to greatest:\n\`${rawCmd}\``;
      tempReturnData.sort(compareTotalRolls);
    } else if (rollRequest.modifiers.order === 'd') {
      line1 = ` requested the following rolls to be ordered from greatest to least:\n\`${rawCmd}\``;
      tempReturnData.sort(compareTotalRollsReverse);
    } else {
      line1 = ` rolled:\n\`${rawCmd}\``;
    }

    if (rollRequest.modifiers.yVars.size) {
      line1 += `\n${withYVarsDash} With yVars: ${
        rollRequest.modifiers.yVars
          .entries()
          .toArray()
          .sort((a, b) => sortYVars(a[0], b[0]))
          .map((yVar) => `\`${yVar[0]}=${yVar[1]}\``)
          .join(' ')
      }`;
    }

    // List number of iterations on simulated nominals
    if (rollRequest.modifiers.simulatedNominal) line2 += `Iterations performed per roll: \`${rollRequest.modifiers.simulatedNominal.toLocaleString()}\`\n`;

    // Reduce counts to a single object
    returnMsg.counts = reduceCountDetails(tempCountDetails);

    // If a regular nominal and roll looks somewhat complex, alert user simulatedNominal exists
    if (rollRequest.modifiers.nominalRoll && tempReturnData.filter((data) => data.isComplex).length) {
      line2 +=
        "One or more of the rolls requested appear to be more complex than what the Nominal calculator is intended for.  For a better approximation of this roll's nominal value, please rerun this roll with the `-sn` flag.\n";
    }

    const line2Space = rollRequest.modifiers.noSpaces ? '' : ' ';
    // Fill out all of the details and results now
    tempReturnData.forEach((e, i) => {
      loopCountCheck('artigen.ts - tempReturnData');

      loggingEnabled && log(LT.LOG, `Parsing roll ${rollRequest.rollCmd} | Making return text ${JSON.stringify(e)}`);
      let preFormat = '';
      let postFormat = '';

      if (!rollRequest.modifiers.simulatedNominal) {
        // If the roll contained a crit success or fail, set the formatting around it
        if (e.containsCrit) {
          preFormat = `**${preFormat}`;
          postFormat = `${postFormat}**`;
        }
        if (e.containsFail) {
          preFormat = `__${preFormat}`;
          postFormat = `${postFormat}__`;
        }
      }

      // Populate line2 (the results) and line3 (the details) with their data
      if (rollRequest.modifiers.order === '') {
        line2 += `${e.rollPreFormat ? escapeCharacters(e.rollPreFormat, '|*_~`') : line2Space}${preFormat}${
          rollRequest.modifiers.commaTotals ? e.rollTotal.toLocaleString() : e.rollTotal
        }${postFormat}${e.rollPostFormat ? escapeCharacters(e.rollPostFormat, '|*_~`') : ''}`;
      } else {
        // If order is on, turn rolls into csv without formatting
        line2 += `${preFormat}${rollRequest.modifiers.commaTotals ? e.rollTotal.toLocaleString() : e.rollTotal}${postFormat}, `;
      }

      const varNum = `\`x${i}\`: `;
      const rollDetails = rollRequest.modifiers.noDetails || rollRequest.modifiers.simulatedNominal > 0 ? ' = ' : ` = ${e.rollDetails} = `;
      line3 += `${rollRequest.modifiers.numberVariables && i + 1 !== tempReturnData.length ? varNum : ''}\`${
        e.initConfig.replaceAll(
          ' ',
          '',
        )
      }\`${rollDetails}${preFormat}${rollRequest.modifiers.commaTotals ? e.rollTotal.toLocaleString() : e.rollTotal}${postFormat}\n`;
    });

    // If order is on, remove trailing ", "
    if (rollRequest.modifiers.order !== '') {
      line2 = line2.substring(0, line2.length - 2);
    }

    // Fill in the return block
    returnMsg.line1 = line1;
    returnMsg.line2 = line2;
    returnMsg.line3 = line3;

    // Reduce rollDist maps into a single map
    returnMsg.rollDistributions = reduceRollDistMaps(tempRollDists);
  } catch (e) {
    // Fill in the return block
    const solverError = e as Error;
    loggingEnabled && log(LT.ERROR, `Error hit: ${solverError.message} | ${rollRequest.rollCmd}`);
    returnMsg.error = true;
    [returnMsg.errorCode, returnMsg.errorMsg] = translateError(solverError);
  }

  if (loopLoggingEnabled) returnMsg.footer = `Loop Count: ${getLoopCount()}`;

  return returnMsg;
};
