import config from '../../../config.ts';
import {
	// Log4Deno deps
	log,
	LT,
} from '../../../deps.ts';
import { RollSet } from '../solver.d.ts';
import { genRoll, loggingEnabled } from '../rollUtils.ts';

export const rollCWOD = (rollStr: string): RollSet[] => {
	// Parse the roll
	const cwodParts = rollStr.split('cwod');
	const cwodConf = {
		dieCount: parseInt(cwodParts[0] || '1'),
		difficulty: parseInt(cwodParts[1] || '10'),
	};

	// Begin counting the number of loops to prevent from getting into an infinite loop
	let loopCount = 0;

	// Roll the roll
	const rollSet = [];

	const templateRoll: RollSet = {
		type: 'cwod',
		origidx: 0,
		roll: 0,
		dropped: false,
		rerolled: false,
		exploding: false,
		critHit: false,
		critFail: false,
	};

	for (let i = 0; i < cwodConf.dieCount; i++) {
		loggingEnabled && log(LT.LOG, `Handling cwod ${rollStr} | Initial rolling ${i} of ${JSON.stringify(cwodConf)}`);
		// If loopCount gets too high, stop trying to calculate infinity
		if (loopCount > config.limits.maxLoops) {
			throw new Error('MaxLoopsExceeded');
		}

		// Copy the template to fill out for this iteration
		const rolling = JSON.parse(JSON.stringify(templateRoll));

		// Roll this die
		rolling.roll = genRoll(10, false, false);
		rolling.origidx = i;

		// Set success/fail flags
		rolling.critHit = rolling.roll >= cwodConf.difficulty;
		rolling.critFail = rolling.roll === 1;

		// Add in the new roll
		rollSet.push(rolling);

		loopCount++;
	}

	return rollSet;
};