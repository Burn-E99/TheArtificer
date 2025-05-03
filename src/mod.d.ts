// EmojiConf is used as a structure for the emojis stored in config.ts
export type EmojiConf = {
  name: string;
  aliases: string[];
  id: string;
  animated: boolean;
  deleteSender: boolean;
};

// PastCommandCount is used in calculating the hourly rate of commands
export type PastCommandCount = {
  command: string;
  count: number;
};
