// mod.d.ts custom types

// EmojiConf is used as a structure for the emojis stored in config.ts
export type EmojiConf = {
	name: string,
	aliases: Array<string>,
	id: string,
	animated: boolean,
	deleteSender: boolean
};

export type RollModifiers = {
	noDetails: boolean,
	superNoDetails: boolean,
	spoiler: string,
	maxRoll: boolean,
	nominalRoll: boolean,
	gmRoll: boolean,
	gms: string[],
	order: string,
	valid: boolean
}
