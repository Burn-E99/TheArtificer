import { CountDetails, RollSet } from 'artigen/dice/dice.d.ts';

import { loopCountCheck } from 'artigen/managers/loopManager.ts';

export const rollCounter = (rollSet: RollSet[]): CountDetails => {
  const countDetails: CountDetails = {
    total: 0,
    successful: 0,
    failed: 0,
    rerolled: 0,
    dropped: 0,
    exploded: 0,
    success: 0,
    fail: 0,
    matches: new Map<string, number>(),
  };

  rollSet.forEach((roll) => {
    loopCountCheck('counter.ts - summing RollSet into CountDetails');
    countDetails.total++;
    if (roll.critHit) countDetails.successful++;
    if (roll.critFail) countDetails.failed++;
    if (roll.rerolled) countDetails.rerolled++;
    if (roll.dropped) countDetails.dropped++;
    if (roll.exploding) countDetails.exploded++;
    if (roll.success) countDetails.success++;
    if (roll.fail) countDetails.fail++;
    if (roll.matchLabel) countDetails.matches.set(roll.matchLabel, (countDetails.matches.get(roll.matchLabel) ?? 0) + 1);
  });

  return countDetails;
};

export const reduceCountDetails = (counts: CountDetails[]): CountDetails =>
  counts.reduce(
    (acc, cur) => {
      loopCountCheck('counter.ts - merging array of CountDetails down to single CountDetail');
      cur.matches.forEach((cnt, label) => {
        loopCountCheck('counter.ts - merging matches');
        acc.matches.set(label, (acc.matches.get(label) ?? 0) + cnt);
      });
      return {
        total: acc.total + cur.total,
        successful: acc.successful + cur.successful,
        failed: acc.failed + cur.failed,
        rerolled: acc.rerolled + cur.rerolled,
        dropped: acc.dropped + cur.dropped,
        exploded: acc.exploded + cur.exploded,
        success: acc.success + cur.success,
        fail: acc.fail + cur.fail,
        matches: acc.matches,
      };
    },
    {
      total: 0,
      successful: 0,
      failed: 0,
      rerolled: 0,
      dropped: 0,
      exploded: 0,
      success: 0,
      fail: 0,
      matches: new Map<string, number>(),
    },
  );
