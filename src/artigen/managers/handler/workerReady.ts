import { log, LogTypes as LT } from '@Log4Deno';

import { loggingEnabled } from 'artigen/rollUtils.ts';

import { QueuedRoll } from 'artigen/managers/manager.d.ts';

export const onWorkerReady = (rollWorker: Worker, rollRequest: QueuedRoll) => {
  loggingEnabled && log(LT.LOG, `Sending roll to worker: ${rollRequest.rollCmd}, ${JSON.stringify(rollRequest.modifiers)}`);
  rollWorker.postMessage({
    rollCmd: rollRequest.rollCmd,
    modifiers: rollRequest.modifiers,
  });
};
