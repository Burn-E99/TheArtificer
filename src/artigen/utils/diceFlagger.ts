import { CustomDiceShapes, RollConf, RollSet } from 'artigen/dice/dice.d.ts';

export const flagRoll = (rollConf: RollConf, rollSet: RollSet, customDiceShapes: CustomDiceShapes) => {
  // If critScore arg is on, check if the roll should be a crit, if its off, check if the roll matches the die size
  if (rollConf.critScore.on && rollConf.critScore.range.includes(rollSet.roll)) {
    rollSet.critHit = true;
  } else if (!rollConf.critScore.on) {
    rollSet.critHit = rollSet.roll === (rollConf.dPercent.on ? rollConf.dPercent.critVal : rollConf.dieSize);
  }

  // If critFail arg is on, check if the roll should be a fail, if its off, check if the roll matches 1
  if (rollConf.critFail.on && rollConf.critFail.range.includes(rollSet.roll)) {
    rollSet.critFail = true;
  } else if (!rollConf.critFail.on) {
    if (rollConf.type === 'fate') {
      rollSet.critFail = rollSet.roll === -1;
    } else if (rollConf.type === 'custom') {
      rollSet.critFail = rollSet.roll === Math.min(...(customDiceShapes.get(rollConf.customType ?? '') ?? []));
    } else {
      rollSet.critFail = rollSet.roll === (rollConf.dPercent.on ? 0 : 1);
    }
  }

  // If success arg is on, check if roll should be successful
  if (rollConf.success.on && rollConf.success.range.includes(rollSet.roll)) {
    rollSet.success = true;
    rollSet.matchLabel = 'S';
  }

  // If fail arg is on, check if roll should be failed
  if (rollConf.fail.on && rollConf.fail.range.includes(rollSet.roll)) {
    rollSet.fail = true;
    rollSet.matchLabel = 'F';
  }
};
