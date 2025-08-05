import { closeLog, initLog } from '@Log4Deno';

import { runCmd } from 'artigen/artigen.ts';
import { SolvedRoll } from 'artigen/artigen.d.ts';

import { QueuedRoll } from 'artigen/managers/manager.d.ts';

import { loggingEnabled, loopLoggingEnabled } from 'artigen/utils/logFlag.ts';

if (loggingEnabled || loopLoggingEnabled) initLog('logs/worker', loggingEnabled || loopLoggingEnabled);

// Extend the BigInt prototype to support JSON.stringify
interface BigIntX extends BigInt {
  // Convert to BigInt to string form in JSON.stringify
  toJSON: () => string;
}
(BigInt.prototype as BigIntX).toJSON = function () {
  return this.toString();
};

// Alert rollQueue that this worker is ready
self.postMessage('ready');

// Handle the roll
self.onmessage = async (e: MessageEvent<QueuedRoll>) => {
  const payload = e.data;
  const returnMsg: SolvedRoll = runCmd(payload) || {
    error: true,
    errorCode: 'EmptyMessage',
    errorMsg: 'Error: Empty message',
    line1: '',
    line2: '',
    line3: '',
    footer: '',
    counts: {
      total: 0,
      successful: 0,
      failed: 0,
      rerolled: 0,
      dropped: 0,
      exploded: 0,
      success: 0,
      fail: 0,
      matches: new Map<string, number>(),
    },
  };
  self.postMessage(returnMsg);
  if (loggingEnabled || loopLoggingEnabled) await closeLog();
  self.close();
};
