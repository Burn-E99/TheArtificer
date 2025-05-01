import { DiscordenoMessage } from '@discordeno';

// EmojiConf is used as a structure for the emojis stored in config.ts
export type EmojiConf = {
  name: string;
  aliases: Array<string>;
  id: string;
  animated: boolean;
  deleteSender: boolean;
};

// RollModifiers is the structure to keep track of the decorators applied to a roll command
export type RollModifiers = {
  noDetails: boolean;
  superNoDetails: boolean;
  spoiler: string;
  maxRoll: boolean;
  minRoll: boolean;
  nominalRoll: boolean;
  gmRoll: boolean;
  gms: string[];
  order: string;
  count: boolean;
  commaTotals: boolean;
  valid: boolean;
  apiWarn: string;
};

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
    m: DiscordenoMessage;
    message: DiscordenoMessage;
  };
}
export type QueuedRoll = ApiQueuedRoll | DDQueuedRoll;

export type PastCommandCount = {
  command: string;
  count: number;
};
