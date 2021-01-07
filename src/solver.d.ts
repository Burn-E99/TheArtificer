// solver.ts custom types

// RollSet is used to preserve all information about a calculated roll
export type RollSet = {
	origidx: number,
	roll: number,
	dropped: boolean,
	rerolled: boolean,
	exploding: boolean,
	critHit: boolean,
	critFail: boolean
};

// SolvedStep is used to preserve information while math is being performed on the roll
export type SolvedStep = {
	total: number,
	details: string,
	containsCrit: boolean,
	containsFail: boolean
};

// SolvedRoll is the complete solved and formatted roll, or the error said roll created
export type SolvedRoll = {
	error: boolean,
	errorMsg: string,
	line1: string,
	line2: string,
	line3: string
};
