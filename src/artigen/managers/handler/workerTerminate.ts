import { SolvedRoll } from 'artigen/artigen.d.ts';

import { RollModifiers } from 'artigen/dice/dice.d.ts';

import { removeWorker } from 'artigen/managers/countManager.ts';
import { QueuedRoll } from 'artigen/managers/manager.d.ts';
import { ApiResolveMap, TestResolveMap } from 'artigen/managers/resolveManager.ts';

import { generateRollEmbed } from 'artigen/utils/embeds.ts';

import stdResp from 'endpoints/stdResponses.ts';

import utils from 'utils/utils.ts';

export const terminateWorker = async (rollWorker: Worker, rollRequest: QueuedRoll) => {
  rollWorker.terminate();
  removeWorker();
  const apiResolve = rollRequest.apiRoll ? ApiResolveMap.get(rollRequest.resolve as string) : undefined;
  const testResolve = rollRequest.testRoll ? TestResolveMap.get(rollRequest.resolve as string) : undefined;
  rollRequest.apiRoll && ApiResolveMap.delete(rollRequest.resolve as string);
  rollRequest.testRoll && TestResolveMap.delete(rollRequest.resolve as string);

  if (rollRequest.apiRoll) {
    apiResolve && apiResolve(stdResp.RequestTimeout('Roll took too long to process, try breaking roll down into simpler parts'));
  } else if (rollRequest.ddRoll) {
    rollRequest.dd.myResponse
      .edit({
        embeds: [
          (
            await generateRollEmbed(
              rollRequest.dd.originalMessage.authorId,
              <SolvedRoll>{
                error: true,
                errorCode: 'TooComplex',
                errorMsg: 'Error: Roll took too long to process, try breaking roll down into simpler parts',
              },
              <RollModifiers>{}
            )
          ).embed,
        ],
      })
      .catch((e) => utils.commonLoggers.messageEditError('rollQueue.ts:51', rollRequest.dd.myResponse, e));
  } else if (rollRequest.testRoll) {
    testResolve &&
      testResolve({
        error: true,
        errorCode: 'TooComplex',
        errorMsg: 'Error: Roll took too long to process, try breaking roll down into simpler parts',
      });
  }
};
