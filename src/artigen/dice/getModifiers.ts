import { log, LogTypes as LT } from '@Log4Deno';

import { RollModifiers } from 'artigen/dice/dice.d.ts';
import config from '~config';

export const Modifiers = Object.freeze({
  Count: '-c',
  NoDetails: '-nd',
  SuperNoDetails: '-snd',
  HideRaw: '-hr',
  Spoiler: '-s',
  Max: '-max',
  MaxShorthand: '-m',
  Min: '-min',
  Nominal: '-n',
  SimulatedNominal: '-sn',
  GM: '-gm',
  Order: '-o',
  CommaTotals: '-ct',
  ConfirmCrit: '-cc',
  RollDistribution: '-rd',
});

export const getModifiers = (args: string[]): [RollModifiers, string[]] => {
  const modifiers: RollModifiers = {
    noDetails: false,
    superNoDetails: false,
    hideRaw: false,
    spoiler: '',
    maxRoll: false,
    minRoll: false,
    nominalRoll: false,
    simulatedNominal: 0,
    gmRoll: false,
    gms: [],
    order: '',
    count: false,
    commaTotals: false,
    confirmCrit: false,
    rollDist: false,
    apiWarn: '',
    valid: true,
    error: new Error(),
  };

  // Check if any of the args are command flags and pull those out into the modifiers object
  for (let i = 0; i < args.length; i++) {
    log(LT.LOG, `Checking ${args.join(' ')} for command modifiers ${i}`);
    let defaultCase = false;
    switch (args[i].toLowerCase()) {
      case Modifiers.Count:
        modifiers.count = true;
        break;
      case Modifiers.NoDetails:
        modifiers.noDetails = true;
        break;
      case Modifiers.SuperNoDetails:
        modifiers.superNoDetails = true;
        break;
      case Modifiers.HideRaw:
        modifiers.hideRaw = true;
        break;
      case Modifiers.Spoiler:
        modifiers.spoiler = '||';
        break;
      case Modifiers.Max:
      case Modifiers.MaxShorthand:
        modifiers.maxRoll = true;
        break;
      case Modifiers.Min:
        modifiers.minRoll = true;
        break;
      case Modifiers.Nominal:
        modifiers.nominalRoll = true;
        break;
      case Modifiers.SimulatedNominal:
        if (args[i + 1] && parseInt(args[i + 1]).toString() === args[i + 1]) {
          // Shift the -sn out so the next item is the amount
          args.splice(i, 1);

          modifiers.simulatedNominal = parseInt(args[i]);
        } else {
          modifiers.simulatedNominal = 10000;
        }
        break;
      case Modifiers.ConfirmCrit:
        modifiers.confirmCrit = true;
        break;
      case Modifiers.GM:
        modifiers.gmRoll = true;

        // -gm is a little more complex, as we must get all of the GMs that need to be DMd
        while (i + 1 < args.length && args[i + 1].startsWith('<@')) {
          log(LT.LOG, `Finding all GMs, checking args ${JSON.stringify(args)}`);
          // Keep looping thru the rest of the args until one does not start with the discord mention code
          modifiers.gms.push(args[i + 1].replace(/!/g, ''));
          args.splice(i + 1, 1);
        }
        if (modifiers.gms.length < 1) {
          // If -gm is on and none were found, throw an error
          modifiers.error.name = 'NoGMsFound';
          modifiers.error.message = 'Must specify at least one GM by @mentioning them';
          return [modifiers, args];
        }
        break;
      case Modifiers.Order:
        // Shift the -o out of the array so the next item is the direction
        args.splice(i, 1);

        if (!args[i] || (args[i].toLowerCase()[0] !== 'd' && args[i].toLowerCase()[0] !== 'a')) {
          // If -o is on and asc or desc was not specified, error out
          modifiers.error.name = 'NoOrderFound';
          modifiers.error.message = 'Must specify `a` or `d` to order the rolls ascending or descending';
          return [modifiers, args];
        }

        modifiers.order = args[i].toLowerCase()[0];
        break;
      case Modifiers.CommaTotals:
        modifiers.commaTotals = true;
        break;
      case Modifiers.RollDistribution:
        modifiers.rollDist = true;
        break;
      default:
        // Default case should not mess with the array
        defaultCase = true;
        break;
    }

    if (!defaultCase) {
      args.splice(i, 1);
      i--;
    }
  }

  // maxRoll, minRoll, nominalRoll, simulatedNominal cannot be on at same time, throw an error
  if ([modifiers.maxRoll, modifiers.minRoll, modifiers.nominalRoll, modifiers.simulatedNominal].filter((b) => b).length > 1) {
    modifiers.error.name = 'MaxAndNominal';
    modifiers.error.message = 'Can only use one of the following at a time:\n`maximize`, `minimize`, `nominal`, `simulatedNominal`';
    modifiers.valid = false;
  }

  // simulatedNominal and confirmCrit cannot be used at same time, throw an error
  if ([modifiers.confirmCrit, modifiers.simulatedNominal].filter((b) => b).length > 1) {
    modifiers.error.name = 'SimNominalAndCC';
    modifiers.error.message = 'Cannot use the following at the same time:\n`confirmCrit`, `simulatedNominal`';
    modifiers.valid = false;
  }

  // simulatedNominal cannot be greater than config.limits.simulatedNominal
  if (modifiers.simulatedNominal > config.limits.simulatedNominal) {
    modifiers.error.name = 'SimNominalTooBig';
    modifiers.error.message = `Number of iterations for \`simulatedNominal\` cannot be greater than \`${config.limits.simulatedNominal}\``;
    modifiers.valid = false;
  }

  return [modifiers, args];
};
