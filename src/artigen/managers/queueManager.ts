import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { getWorkerCnt } from 'artigen/managers/countManager.ts';
import { QueuedRoll } from 'artigen/managers/manager.d.ts';
import { handleRollRequest } from 'artigen/managers/workerManager.ts';

import { infoColor2, rollingEmbed } from 'src/commandUtils.ts';
import utils from 'src/utils.ts';

const rollQueue: Array<QueuedRoll> = [];

// Runs the roll or queues it depending on how many workers are currently running
export const sendRollRequest = (rollRequest: QueuedRoll) => {
  if (rollRequest.apiRoll) {
    handleRollRequest(rollRequest);
  } else if (!rollQueue.length && getWorkerCnt() < config.limits.maxWorkers) {
    handleRollRequest(rollRequest);
  } else {
    rollQueue.push(rollRequest);
    rollRequest.dd.myResponse
      .edit({
        embeds: [
          {
            color: infoColor2,
            title: `${config.name} currently has its hands full and has queued your roll.`,
            description: `There are currently ${getWorkerCnt() + rollQueue.length} rolls ahead of this roll.

The results for this roll will replace this message when it is done.`,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageEditError('rollQueue.ts:197', rollRequest.dd.myResponse, e));
  }
};

// Checks the queue constantly to make sure the queue stays empty
setInterval(() => {
  log(
    LT.LOG,
    `Checking rollQueue for items, rollQueue length: ${rollQueue.length}, currentWorkers: ${getWorkerCnt()}, config.limits.maxWorkers: ${config.limits.maxWorkers}`,
  );
  if (rollQueue.length && getWorkerCnt() < config.limits.maxWorkers) {
    const rollRequest = rollQueue.shift();
    if (rollRequest && !rollRequest.apiRoll) {
      rollRequest.dd.myResponse.edit(rollingEmbed).catch((e: Error) => utils.commonLoggers.messageEditError('rollQueue.ts:208', rollRequest.dd.myResponse, e));
      handleRollRequest(rollRequest);
    } else if (rollRequest && rollRequest.apiRoll) {
      handleRollRequest(rollRequest);
    }
  }
}, 1000);
