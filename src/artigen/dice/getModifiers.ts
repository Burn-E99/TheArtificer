import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { RollModifiers } from 'artigen/dice/dice.d.ts';

export const reservedCharacters = ['d', '%', '^', '*', '(', ')', '{', '}', '/', '+', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
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
  NumberVariables: '-nv',
  VariablesNumber: '-vn',
  CustomDiceShapes: '-cd',
  NoSpaces: '-ns',
  YVars: '-yvariables',
});

// args will look like this: ['-sn', ' ', '10'] as spaces/newlines are split on their own
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
    numberVariables: false,
    customDiceShapes: new Map<string, number[]>(),
    noSpaces: false,
    yVars: new Map<string, number>(),
    apiWarn: '',
    valid: true,
    error: new Error(),
  };

  // Check if any of the args are command flags and pull those out into the modifiers object
  for (let i = 0; i < args.length; i++) {
    log(LT.LOG, `Checking ${args.join(' ')} for command modifiers ${i} | ${args[i]}`);
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
        if (args[i + 2] && parseInt(args[i + 2]).toString() === args[i + 2]) {
          // Shift the ["-sn", " "] out so the next item is the amount
          args.splice(i, 2);

          modifiers.simulatedNominal = parseInt(args[i]);
        } else {
          modifiers.simulatedNominal = config.limits.defaultSimulatedNominal;
        }
        break;
      case Modifiers.ConfirmCrit:
        modifiers.confirmCrit = true;
        break;
      case Modifiers.GM:
        modifiers.gmRoll = true;

        // -gm is a little more complex, as we must get all of the GMs that need to be DMd
        log(LT.LOG, `Finding all GMs, checking args ${JSON.stringify(args)}`);
        while (i + 2 < args.length && args[i + 2].startsWith('<@')) {
          // Keep looping thru the rest of the args until one does not start with the discord mention code
          modifiers.gms.push(args[i + 2].replace(/!/g, ''));
          args.splice(i + 1, 2);
        }
        if (modifiers.gms.length < 1) {
          // If -gm is on and none were found, throw an error
          modifiers.error.name = 'NoGMsFound';
          modifiers.error.message = 'Must specify at least one GM by @mentioning them';
          modifiers.valid = false;
          return [modifiers, args];
        }
        log(LT.LOG, `Found all GMs, ${modifiers.gms}`);
        break;
      case Modifiers.Order:
        // Shift the -o out of the array so the next item is the direction
        args.splice(i, 2);

        if (!args[i] || (args[i].toLowerCase()[0] !== 'd' && args[i].toLowerCase()[0] !== 'a')) {
          // If -o is on and asc or desc was not specified, error out
          modifiers.error.name = 'NoOrderFound';
          modifiers.error.message = 'Must specify `a` or `d` to order the rolls ascending or descending';
          modifiers.valid = false;
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
      case Modifiers.NumberVariables:
      case Modifiers.VariablesNumber:
        modifiers.numberVariables = true;
        break;
      case Modifiers.CustomDiceShapes: {
        // Shift the -cd out of the array so the dice shapes are next
        args.splice(i, 2);

        const cdSyntaxMessage =
          'Must specify at least one custom dice shape using the `name:[side1,side2,...,sideN]` syntax.  If multiple custom dice shapes are needed, use a `;` to separate the list.';

        const shapes = (args[i] ?? '').split(';').filter((x) => x);
        if (!shapes.length) {
          modifiers.error.name = 'NoShapesSpecified';
          modifiers.error.message = `No custom shaped dice found.\n\n${cdSyntaxMessage}`;
          modifiers.valid = false;
          return [modifiers, args];
        }

        for (const shape of shapes) {
          const [name, rawSides] = shape.split(':').filter((x) => x);
          if (!name || !rawSides || !rawSides.includes('[') || !rawSides.includes(']')) {
            modifiers.error.name = 'InvalidShapeSpecified';
            modifiers.error.message = `One of the custom dice is not formatted correctly.\n\n${cdSyntaxMessage}`;
            modifiers.valid = false;
            return [modifiers, args];
          }

          if (modifiers.customDiceShapes.has(name)) {
            modifiers.error.name = 'ShapeAlreadySpecified';
            modifiers.error.message = `Shape \`${name}\` is already specified, please give it a different name.\n\n${cdSyntaxMessage}`;
            modifiers.valid = false;
            return [modifiers, args];
          }

          if (reservedCharacters.some((char) => name.includes(char))) {
            modifiers.error.name = 'InvalidCharacterInCDName';
            modifiers.error.message = `Custom dice names cannot include any of the following characters:\n${
              JSON.stringify(
                reservedCharacters,
              )
            }\n\n${cdSyntaxMessage}`;
            modifiers.valid = false;
            return [modifiers, args];
          }

          const sides = rawSides
            .replaceAll('[', '')
            .replaceAll(']', '')
            .split(',')
            .filter((x) => x)
            .map((side) => parseFloat(side));
          if (!sides.length) {
            modifiers.error.name = 'NoCustomSidesSpecified';
            modifiers.error.message = `No sides found for \`${name}\`.\n\n${cdSyntaxMessage}`;
            modifiers.valid = false;
            return [modifiers, args];
          }

          modifiers.customDiceShapes.set(name, sides);
        }

        log(LT.LOG, `Generated Custom Dice: ${JSON.stringify(modifiers.customDiceShapes.entries().toArray())}`);
        break;
      }
      case Modifiers.NoSpaces:
        modifiers.noSpaces = true;
        break;
      case Modifiers.YVars: {
        // Shift the -yvariables out of the array so the next item is the first yVar
        args.splice(i, 2);
        const yVars = args[i].split(',');
        yVars.forEach((yVar, idx) => {
          modifiers.yVars.set(`y${idx}`, parseFloat(yVar));
        });
        break;
      }
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
  if (modifiers.simulatedNominal > config.limits.maxSimulatedNominal) {
    modifiers.error.name = 'SimNominalTooBig';
    modifiers.error.message = `Number of iterations for \`simulatedNominal\` cannot be greater than \`${config.limits.maxSimulatedNominal}\``;
    modifiers.valid = false;
  }

  if (modifiers.simulatedNominal < 0) {
    modifiers.error.name = 'NegativeSimNominal';
    modifiers.error.message = 'Number of iterations for `simulatedNominal` must be at least 1';
    modifiers.valid = false;
  }

  return [modifiers, args];
};
