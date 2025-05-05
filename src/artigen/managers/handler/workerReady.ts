import { log, LogTypes as LT } from '@Log4Deno';

import { QueuedRoll } from 'artigen/managers/manager.d.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';

export const onWorkerReady = (rollWorker: Worker, rollRequest: QueuedRoll) => {
  loggingEnabled && log(LT.LOG, `Sending roll to worker: ${rollRequest.rollCmd}, ${JSON.stringify(rollRequest.modifiers)}`);
  rollWorker.postMessage(rollRequest);
};
