import config from '~config';

import { addWorker } from 'artigen/managers/countManager.ts';
import { QueuedRoll } from 'artigen/managers/manager.d.ts';

import { onWorkerComplete } from 'artigen/managers/handler/workerComplete.ts';
import { onWorkerReady } from 'artigen/managers/handler/workerReady.ts';
import { terminateWorker } from 'artigen/managers/handler/workerTerminate.ts';

export const handleRollRequest = (rollRequest: QueuedRoll) => {
  // Handle setting up and calling the rollWorker
  addWorker();
  const rollWorker = new Worker(new URL('../rollWorker.ts', import.meta.url).href, { type: 'module' });
  const workerTimeout = setTimeout(() => terminateWorker(rollWorker, rollRequest), config.limits.workerTimeout);

  // Handle events from the worker
  rollWorker.addEventListener('message', (workerMessage) => {
    if (workerMessage.data === 'ready') {
      return onWorkerReady(rollWorker, rollRequest);
    }
    onWorkerComplete(workerMessage, workerTimeout, rollRequest);
  });
};
