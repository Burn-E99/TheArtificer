import { CountDetails, RollSet } from 'artigen/dice/dice.d.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

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
    loopCountCheck();
    countDetails.total++;
    if (roll.critHit) countDetails.successful++;
    if (roll.critFail) countDetails.failed++;
    if (roll.rerolled) countDetails.rerolled++;
    if (roll.dropped) countDetails.dropped++;
    if (roll.exploding) countDetails.exploded++;
  });

  return countDetails;
};

export const reduceCountDetails = (counts: CountDetails[]): CountDetails =>
  counts.reduce(
    (acc, cur) => {
      loopCountCheck();
      return {
        total: acc.total + cur.total,
        successful: acc.successful + cur.successful,
        failed: acc.failed + cur.failed,
        rerolled: acc.rerolled + cur.rerolled,
        dropped: acc.dropped + cur.dropped,
        exploded: acc.exploded + cur.exploded,
      };
    },
    {
      total: 0,
      successful: 0,
      failed: 0,
      rerolled: 0,
      dropped: 0,
      exploded: 0,
    },
  );
