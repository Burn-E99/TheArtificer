import { SolvedRoll } from 'artigen/artigen.d.ts';

import { RollModifiers } from 'artigen/dice/dice.d.ts';

import { removeWorker } from 'artigen/managers/countManager.ts';
import { QueuedRoll } from 'artigen/managers/manager.d.ts';

import { generateRollEmbed } from 'artigen/utils/embeds.ts';

import stdResp from 'endpoints/stdResponses.ts';

import utils from 'utils/utils.ts';

export const terminateWorker = async (rollWorker: Worker, rollRequest: QueuedRoll) => {
  rollWorker.terminate();
  removeWorker();

  if (rollRequest.apiRoll) {
    rollRequest.api.resolve(stdResp.RequestTimeout('Roll took too long to process, try breaking roll down into simpler parts'));
  } else {
    rollRequest.dd.myResponse
      .edit({
        embeds: [
          (
            await generateRollEmbed(
              rollRequest.dd.originalMessage.authorId,
              <SolvedRoll> {
                error: true,
                errorCode: 'TooComplex',
                errorMsg: 'Error: Roll took too long to process, try breaking roll down into simpler parts',
              },
              <RollModifiers> {},
            )
          ).embed,
        ],
      })
      .catch((e) => utils.commonLoggers.messageEditError('rollQueue.ts:51', rollRequest.dd.myResponse, e));
  }
};
