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

export const reduceCountDetails = (counts: CountDetails[]): CountDetails => {
  return counts.reduce(
    (acc, cnt) => {
      loopCountCheck();
      return {
        total: acc.total + cnt.total,
        successful: acc.successful + cnt.successful,
        failed: acc.failed + cnt.failed,
        rerolled: acc.rerolled + cnt.rerolled,
        dropped: acc.dropped + cnt.dropped,
        exploded: acc.exploded + cnt.exploded,
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
};
