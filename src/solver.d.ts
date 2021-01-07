export type RollSet = {
	origidx: number,
	roll: number,
	dropped: boolean,
	rerolled: boolean,
	exploding: boolean,
	critHit: boolean,
	critFail: boolean
};

export type SolvedStep = {
	total: number,
	details: string,
	containsCrit: boolean,
	containsFail: boolean
};

export type SolvedRoll = {
	error: boolean,
	errorMsg: string,
	line1: string,
	line2: string,
	line3: string
};
