import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { currentWorkers, handleRollWorker } from 'artigen/managers/workerManager.ts';

import { infoColor2, rollingEmbed } from 'src/commandUtils.ts';
import { QueuedRoll } from 'src/mod.d.ts';
import utils from 'src/utils.ts';

const rollQueue: Array<QueuedRoll> = [];

// Runs the roll or queues it depending on how many workers are currently running
export const queueRoll = (rq: QueuedRoll) => {
  if (rq.apiRoll) {
    handleRollWorker(rq);
  } else if (!rollQueue.length && currentWorkers < config.limits.maxWorkers) {
    handleRollWorker(rq);
  } else {
    rollQueue.push(rq);
    rq.dd.m
      .edit({
        embeds: [
          {
            color: infoColor2,
            title: `${config.name} currently has its hands full and has queued your roll.`,
            description: `There are currently ${currentWorkers + rollQueue.length} rolls ahead of this roll.

The results for this roll will replace this message when it is done.`,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageEditError('rollQueue.ts:197', rq.dd.m, e));
  }
};

// Checks the queue constantly to make sure the queue stays empty
setInterval(() => {
  log(
    LT.LOG,
    `Checking rollQueue for items, rollQueue length: ${rollQueue.length}, currentWorkers: ${currentWorkers}, config.limits.maxWorkers: ${config.limits.maxWorkers}`,
  );
  if (rollQueue.length && currentWorkers < config.limits.maxWorkers) {
    const temp = rollQueue.shift();
    if (temp && !temp.apiRoll) {
      temp.dd.m.edit(rollingEmbed).catch((e: Error) => utils.commonLoggers.messageEditError('rollQueue.ts:208', temp.dd.m, e));
      handleRollWorker(temp);
    } else if (temp && temp.apiRoll) {
      handleRollWorker(temp);
    }
  }
}, 1000);
