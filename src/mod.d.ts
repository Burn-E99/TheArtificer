// mod.d.ts custom types

// EmojiConf is used as a structure for the emojis stored in config.ts
export type EmojiConf = {
	name: string,
	aliases: Array<string>,
	id: string,
	animated: boolean,
	deleteSender: boolean
};
