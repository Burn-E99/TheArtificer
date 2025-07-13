import { log, LogTypes as LT } from '@Log4Deno';
import { nanoid } from '@nanoid';

import { QueuedRoll } from 'artigen/managers/manager.d.ts';
import { ApiResolveMap, TestResolveMap } from 'artigen/managers/resolveManager.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';

export const onWorkerReady = (rollWorker: Worker, rollRequest: QueuedRoll) => {
  if ((rollRequest.apiRoll || rollRequest.testRoll) && typeof rollRequest.resolve !== 'string') {
    const resolveId = nanoid();
    rollRequest.apiRoll && ApiResolveMap.set(resolveId, rollRequest.resolve);
    rollRequest.testRoll && TestResolveMap.set(resolveId, rollRequest.resolve);
    rollRequest.resolve = resolveId;
  }
  loggingEnabled && log(LT.LOG, `Sending roll to worker: ${rollRequest.rollCmd}, ${JSON.stringify(rollRequest.modifiers)}`);
  rollWorker.postMessage(rollRequest);
};
