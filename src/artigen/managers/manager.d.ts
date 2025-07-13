import { DiscordenoMessage } from '@discordeno';

import { RollModifiers } from 'artigen/dice/dice.d.ts';

// QueuedRoll is the structure to track rolls we could not immediately handle
interface BaseQueuedRoll {
  rollCmd: string;
  modifiers: RollModifiers;
  originalCommand: string;
}
interface ApiQueuedRoll extends BaseQueuedRoll {
  apiRoll: true;
  ddRoll: false;
  testRoll: false;
  api: {
    resolve: (value: Response | PromiseLike<Response>) => void;
    channelId: bigint;
    userId: bigint;
  };
}
interface DDQueuedRoll extends BaseQueuedRoll {
  apiRoll: false;
  ddRoll: true;
  testRoll: false;
  dd: {
    myResponse: DiscordenoMessage;
    originalMessage: DiscordenoMessage;
  };
}
interface TestResultFail {
  error: true;
  errorMsg: string;
  errorCode: string;
}
interface TestResultSuccess {
  error: false;
}
export type TestResults = TestResultFail | TestResultSuccess;
interface TestQueuedRoll extends BaseQueuedRoll {
  apiRoll: false;
  ddRoll: false;
  testRoll: true;
  test: {
    resolve: (value: TestResults) => void;
  };
}
export type QueuedRoll = ApiQueuedRoll | DDQueuedRoll | TestQueuedRoll;
