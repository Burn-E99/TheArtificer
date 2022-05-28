import { CountDetails, RollSet } from './solver.d.ts';

export const rollCounter = (rollSet: RollSet[]): CountDetails => {
	const countDetails = {
		total: 0,
		successful: 0,
		failed: 0,
		rerolled: 0,
		dropped: 0,
		exploded: 0,
	};

	rollSet.forEach((roll) => {
		countDetails.total++;
		if (roll.critHit) countDetails.successful++;
		if (roll.critFail) countDetails.failed++;
		if (roll.rerolled) countDetails.rerolled++;
		if (roll.dropped) countDetails.dropped++;
		if (roll.exploding) countDetails.exploded++;
	});

	return countDetails;
};
