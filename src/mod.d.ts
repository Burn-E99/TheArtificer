// EmojiConf is used as a structure for the emojis stored in config.ts
export interface EmojiConf {
  name: string;
  aliases: string[];
  id: string;
  animated: boolean;
  deleteSender: boolean;
}

// PastCommandCount is used in calculating the hourly rate of commands
export interface PastCommandCount {
  command: string;
  count: number;
}
