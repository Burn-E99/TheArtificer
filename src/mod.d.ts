// EmojiConf is used as a structure for the emojis stored in config.ts
export type EmojiConf = {
  name: string;
  aliases: string[];
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

// PastCommandCount is used in calculating the hourly rate of commands
export type PastCommandCount = {
  command: string;
  count: number;
};
