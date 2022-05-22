import {
	log,
	// Log4Deno deps
	LT,
} from '../../deps.ts';

import { ReturnData, RollSet } from './solver.d.ts';

// MAXLOOPS determines how long the bot will attempt a roll
// Default is 5000000 (5 million), which results in at most a 10 second delay before the bot calls the roll infinite or too complex
// Increase at your own risk
export const MAXLOOPS = 5000000;

// genRoll(size) returns number
// genRoll rolls a die of size size and returns the result
export const genRoll = (size: number, maximiseRoll: boolean, nominalRoll: boolean): number => {
	if (maximiseRoll) {
		return size;
	} else {
		// Math.random * size will return a decimal number between 0 and size (excluding size), so add 1 and floor the result to not get 0 as a result
		return nominalRoll ? ((size / 2) + 0.5) : Math.floor((Math.random() * size) + 1);
	}
};

// compareRolls(a, b) returns -1|0|1
// compareRolls is used to order an array of RollSets by RollSet.roll
export const compareRolls = (a: RollSet, b: RollSet): number => {
	if (a.roll < b.roll) {
		return -1;
	}
	if (a.roll > b.roll) {
		return 1;
	}
	return 0;
};

// compareTotalRolls(a, b) returns -1|0|1
// compareTotalRolls is used to order an array of RollSets by RollSet.roll
export const compareTotalRolls = (a: ReturnData, b: ReturnData): number => {
	if (a.rollTotal < b.rollTotal) {
		return -1;
	}
	if (a.rollTotal > b.rollTotal) {
		return 1;
	}
	return 0;
};

// compareRolls(a, b) returns -1|0|1
// compareRolls is used to order an array of RollSets by RollSet.origidx
export const compareOrigidx = (a: RollSet, b: RollSet): number => {
	if (a.origidx < b.origidx) {
		return -1;
	}
	if (a.origidx > b.origidx) {
		return 1;
	}
	return 0;
};

// escapeCharacters(str, esc) returns str
// escapeCharacters escapes all characters listed in esc
export const escapeCharacters = (str: string, esc: string): string => {
	// Loop thru each esc char one at a time
	for (const e of  esc) {
		log(LT.LOG, `Escaping character ${e} | ${str}, ${esc}`);
		// Create a new regex to look for that char that needs replaced and escape it
		const temprgx = new RegExp(`[${e}]`, 'g');
		str = str.replace(temprgx, `\\${e}`);
	}
	return str;
};
