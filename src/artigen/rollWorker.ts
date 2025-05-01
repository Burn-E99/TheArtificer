import { closeLog, initLog } from '@Log4Deno';

import { DEBUG } from '~flags';

import { parseRoll } from 'artigen/parser.ts';
import { loggingEnabled } from 'artigen/rollUtils.ts';

loggingEnabled && initLog('logs/worker', DEBUG);

// Alert rollQueue that this worker is ready
self.postMessage('ready');

// Handle the roll
self.onmessage = async (e) => {
  const payload = e.data;
  const returnMsg = parseRoll(payload.rollCmd, payload.modifiers) || {
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
