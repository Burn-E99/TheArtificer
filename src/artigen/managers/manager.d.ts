import { DiscordenoMessage } from '@discordeno';

import { RollModifiers } from 'artigen/dice/dice.d.ts';

// QueuedRoll is the structure to track rolls we could not immediately handle
interface BaseQueuedRoll {
  rollCmd: string;
  modifiers: RollModifiers;
  originalCommand: string;
}
export type ApiResolve = (value: Response | PromiseLike<Response>) => void;
interface ApiQueuedRoll extends BaseQueuedRoll {
  apiRoll: true;
  ddRoll: false;
  testRoll: false;
  resolve: string | ApiResolve;
  api: {
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
    authorId: bigint;
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
export type TestResolve = (value: TestResults) => void;
interface TestQueuedRoll extends BaseQueuedRoll {
  apiRoll: false;
  ddRoll: false;
  testRoll: true;
  resolve: string | TestResolve;
}
export type QueuedRoll = ApiQueuedRoll | DDQueuedRoll | TestQueuedRoll;
