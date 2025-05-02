import { DiscordenoMessage } from '@discordeno';

import { RollModifiers } from 'src/mod.d.ts';

// QueuedRoll is the structure to track rolls we could not immediately handle
interface BaseQueuedRoll {
  rollCmd: string;
  modifiers: RollModifiers;
  originalCommand: string;
}
export interface ApiQueuedRoll extends BaseQueuedRoll {
  apiRoll: true;
  api: {
    resolve: (value: Response | PromiseLike<Response>) => void;
    channelId: bigint;
    userId: bigint;
  };
}
export interface DDQueuedRoll extends BaseQueuedRoll {
  apiRoll: false;
  dd: {
    myResponse: DiscordenoMessage;
    originalMessage: DiscordenoMessage;
  };
}
export type QueuedRoll = ApiQueuedRoll | DDQueuedRoll;
