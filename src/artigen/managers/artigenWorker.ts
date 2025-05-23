import { closeLog, initLog } from '@Log4Deno';

import { runCmd } from 'artigen/artigen.ts';

import { QueuedRoll } from 'artigen/managers/manager.d.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';

loggingEnabled && initLog('logs/worker', loggingEnabled);

// Alert rollQueue that this worker is ready
self.postMessage('ready');

// Handle the roll
self.onmessage = async (e: MessageEvent<QueuedRoll>) => {
  const payload = e.data;
  const returnMsg = runCmd(payload) || {
    error: true,
    errorCode: 'EmptyMessage',
    errorMsg: 'Error: Empty message',
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
  self.postMessage(returnMsg);
  loggingEnabled && (await closeLog());
  self.close();
};
