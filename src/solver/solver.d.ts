// solver.ts custom types

export type RollType = '' | 'roll20' | 'cwod' | 'ova';

// RollSet is used to preserve all information about a calculated roll
export type RollSet = {
	type: RollType;
	origidx: number;
	roll: number;
	dropped: boolean;
	rerolled: boolean;
	exploding: boolean;
	critHit: boolean;
	critFail: boolean;
};

// SolvedStep is used to preserve information while math is being performed on the roll
export type SolvedStep = {
	total: number;
	details: string;
	containsCrit: boolean;
	containsFail: boolean;
};

// ReturnData is the temporary internal type used before getting turned into SolvedRoll
export type ReturnData = {
	rollTotal: number;
	rollPostFormat: string;
	rollDetails: string;
	containsCrit: boolean;
	containsFail: boolean;
	initConfig: string;
};

// CountDetails is the object holding the count data for creating the Count Embed
export type CountDetails = {
	total: number;
	successful: number;
	failed: number;
	rerolled: number;
	dropped: number;
	exploded: number;
};

// RollFormat is the return structure for the rollFormatter
export type RollFormat = {
	solvedStep: SolvedStep;
	countDetails: CountDetails;
};

// SolvedRoll is the complete solved and formatted roll, or the error said roll created
export type SolvedRoll = {
	error: boolean;
	errorMsg: string;
	errorCode: string;
	line1: string;
	line2: string;
	line3: string;
	counts: CountDetails;
};

// RollConf is used by the roll20 setup
export type RollConf = {
	dieCount: number;
	dieSize: number;
	drop: {
		on: boolean;
		count: number;
	};
	keep: {
		on: boolean;
		count: number;
	};
	dropHigh: {
		on: boolean;
		count: number;
	};
	keepLow: {
		on: boolean;
		count: number;
	};
	reroll: {
		on: boolean;
		once: boolean;
		nums: number[];
	};
	critScore: {
		on: boolean;
		range: number[];
	};
	critFail: {
		on: boolean;
		range: number[];
	};
	exploding: {
		on: boolean;
		once: boolean;
		nums: number[];
	};
}
