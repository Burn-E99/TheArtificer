import config from '../../../config.ts';
import { DEVMODE } from '../../../flags.ts';
import { dbClient, queries } from '../../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
} from '../../../deps.ts';
import { generateRollError } from '../../commandUtils.ts';
import { RollModifiers } from '../../mod.d.ts';
import utils from '../../utils.ts';

export const getModifiers = (m: DiscordenoMessage, args: string[], command: string, originalCommand: string): RollModifiers => {
	const errorType = 'Modifiers invalid:';
	const modifiers: RollModifiers = {
		noDetails: false,
		superNoDetails: false,
		spoiler: '',
		maxRoll: false,
		nominalRoll: false,
		gmRoll: false,
		gms: [],
		order: '',
		valid: false,
		count: false,
		apiWarn: '',
	};

	// Check if any of the args are command flags and pull those out into the modifiers object
	for (let i = 0; i < args.length; i++) {
		log(LT.LOG, `Checking ${command}${args.join(' ')} for command modifiers ${i}`);
		let defaultCase = false;
		switch (args[i].toLowerCase()) {
			case '-c':
				modifiers.count = true;
				break;
			case '-nd':
				modifiers.noDetails = true;
				break;
			case '-snd':
				modifiers.superNoDetails = true;
				break;
			case '-s':
				modifiers.spoiler = '||';
				break;
			case '-m':
				modifiers.maxRoll = true;
				break;
			case '-n':
				modifiers.nominalRoll = true;
				break;
			case '-gm':
				modifiers.gmRoll = true;

				// -gm is a little more complex, as we must get all of the GMs that need to be DMd
				while (((i + 1) < args.length) && args[i + 1].startsWith('<@')) {
					log(LT.LOG, `Finding all GMs, checking args ${JSON.stringify(args)}`);
					// Keep looping thru the rest of the args until one does not start with the discord mention code
					modifiers.gms.push(args[i + 1].replace(/[!]/g, ''));
					args.splice(i + 1, 1);
				}
				if (modifiers.gms.length < 1) {
					// If -gm is on and none were found, throw an error
					m.edit(generateRollError(errorType, 'Must specifiy at least one GM by @mentioning them')).catch((e) => utils.commonLoggers.messageEditError('getModifiers.ts:66', m, e));

					if (DEVMODE && config.logRolls) {
						// If enabled, log rolls so we can verify the bots math
						dbClient.execute(queries.insertRollLogCmd(0, 1), [originalCommand, 'NoGMsFound', m.id]).catch((e) => utils.commonLoggers.dbError('getModifiers.ts:72', 'insert into', e));
					}
					return modifiers;
				}
				break;
			case '-o':
				// Shift the -o out of the array so the next item is the direction
				args.splice(i, 1);

				if (!args[i] || args[i].toLowerCase()[0] !== 'd' && args[i].toLowerCase()[0] !== 'a') {
					// If -o is on and asc or desc was not specified, error out
					m.edit(generateRollError(errorType, 'Must specifiy `a` or `d` to order the rolls ascending or descending')).catch((e) => utils.commonLoggers.messageEditError('getModifiers.ts:81', m, e));

					if (DEVMODE && config.logRolls) {
						// If enabled, log rolls so we can verify the bots math
						dbClient.execute(queries.insertRollLogCmd(0, 1), [originalCommand, 'NoOrderFound', m.id]).catch((e) => utils.commonLoggers.dbError('getModifiers.ts:89', 'insert into', e));
					}
					return modifiers;
				}

				modifiers.order = args[i].toLowerCase()[0];
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

	// maxRoll and nominalRoll cannot both be on, throw an error
	if (modifiers.maxRoll && modifiers.nominalRoll) {
		m.edit(generateRollError(errorType, 'Cannot maximise and nominise the roll at the same time')).catch((e) => utils.commonLoggers.messageEditError('getModifiers.ts:106', m, e));

		if (DEVMODE && config.logRolls) {
			// If enabled, log rolls so we can verify the bots math
			dbClient.execute(queries.insertRollLogCmd(0, 1), [originalCommand, 'MaxAndNominal', m.id]).catch((e) => utils.commonLoggers.dbError('getModifiers.ts:120', 'insert into', e));
		}
		return modifiers;
	}

	modifiers.valid = true;
	return modifiers;
};
