// mod.d.ts custom types
import { DiscordenoMessage } from '../deps.ts';

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
  nominalRoll: boolean;
  gmRoll: boolean;
  gms: string[];
  order: string;
  count: boolean;
  valid: boolean;
  apiWarn: string;
};

// QueuedRoll is the structure to track rolls we could not immediately handle
export type QueuedRoll = {
  apiRoll: boolean;
  api: {
    requestEvent: Deno.RequestEvent;
    channelId: bigint;
    userId: bigint;
  };
  dd: {
    m: DiscordenoMessage;
    message: DiscordenoMessage;
  };
  originalCommand: string;
  rollCmd: string;
  modifiers: RollModifiers;
};

export type PastCommandCount = {
  command: string;
  count: number;
};
