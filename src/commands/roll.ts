import config from '../../config.ts';
import { DEVMODE } from '../../flags.ts';
import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
} from '../../deps.ts';
import { rollingEmbed, warnColor } from '../commandUtils.ts';
import rollFuncs from './roll/_index.ts';
import { queueRoll } from '../solver/rollQueue.ts';
import { QueuedRoll } from '../mod.d.ts';

export const roll = async (message: DiscordenoMessage, args: string[], command: string) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("roll");`).catch((e) => {
		log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	// If DEVMODE is on, only allow this command to be used in the devServer
	if (DEVMODE && message.guildId !== config.devServer) {
		message.send({
			embeds: [{
				color: warnColor,
				title: 'Command is in development, please try again later.',
			}],
		}).catch((e) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
		return;
	}

	// Rest of this command is in a try-catch to protect all sends/edits from erroring out
	try {
		const originalCommand = `${config.prefix}${command} ${args.join(' ')}`;

		const m = await message.reply(rollingEmbed);

		// Get modifiers from command
		const modifiers = rollFuncs.getModifiers(m, args, command, originalCommand);

		// Return early if the modifiers were invalid
		if (!modifiers.valid) {
			return;
		}

		// Rejoin all of the args and send it into the solver, if solver returns a falsy item, an error object will be substituded in
		const rollCmd = `${command} ${args.join(' ')}`;

		queueRoll(
			<QueuedRoll> {
				apiRoll: false,
				dd: { m, message, originalCommand },
				rollCmd,
				modifiers,
			},
		);
	} catch (e) {
		log(LT.ERROR, `Undandled Error: ${JSON.stringify(e)}`);
	}
};
