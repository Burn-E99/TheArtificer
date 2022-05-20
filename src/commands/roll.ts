import config from '../../config.ts';
import { DEVMODE } from '../../flags.ts';
import { dbClient, queries } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	log,
	// Log4Deno deps
	LT,
	sendDirectMessage,
} from '../../deps.ts';
import solver from '../solver/_index.ts';
import { constantCmds, generateDMFailed } from '../constantCmds.ts';
import rollFuncs from './roll/_index.ts';

export const roll = async (message: DiscordenoMessage, args: string[], command: string) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("roll");`).catch((e) => {
		log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	// If DEVMODE is on, only allow this command to be used in the devServer
	if (DEVMODE && message.guildId !== config.devServer) {
		message.send(constantCmds.indev).catch((e) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
		return;
	}

	// Rest of this command is in a try-catch to protect all sends/edits from erroring out
	try {
		const originalCommand = `${config.prefix}${command} ${args.join(' ')}`;

		const m = await message.send(constantCmds.rolling);

		// Get modifiers from command
		const modifiers = rollFuncs.getModifiers(m, args, command, originalCommand);

		// Return early if the modifiers were invalid
		if (!modifiers.valid) {
			return;
		}

		// Rejoin all of the args and send it into the solver, if solver returns a falsy item, an error object will be substituded in
		const rollCmd = `${command} ${args.join(' ')}`;
		const returnmsg = solver.parseRoll(rollCmd, modifiers) || { error: true, errorCode: 'EmptyMessage', errorMsg: 'Error: Empty message', line1: '', line2: '', line3: '' };

		let returnText = '';

		// If there was an error, report it to the user in hopes that they can determine what they did wrong
		if (returnmsg.error) {
			returnText = returnmsg.errorMsg;
			m.edit(returnText);

			if (DEVMODE && config.logRolls) {
				// If enabled, log rolls so we can verify the bots math
				dbClient.execute(queries.insertRollLogCmd(0, 1), [originalCommand, returnmsg.errorCode, m.id]).catch((e) => {
					log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e)}`);
				});
			}
			return;
		} else {
			// Else format the output using details from the solver
			returnText = `<@${message.authorId}>${returnmsg.line1}\n${returnmsg.line2}`;

			if (!modifiers.superNoDetails) {
				if (modifiers.noDetails) {
					returnText += '\nDetails suppressed by -nd flag.';
				} else {
					returnText += `\nDetails:\n${modifiers.spoiler}${returnmsg.line3}${modifiers.spoiler}`;
				}
			}
		}

		// If the roll was a GM roll, send DMs to all the GMs
		if (modifiers.gmRoll) {
			// Make a new return line to be sent to the roller
			const normalText = `<@${message.authorId}>${returnmsg.line1}\nResults have been messaged to the following GMs: ${modifiers.gms.join(' ')}`;

			// And message the full details to each of the GMs, alerting roller of every GM that could not be messaged
			modifiers.gms.forEach(async (e) => {
				log(LT.LOG, `Messaging GM ${e}`);
				// If its too big, collapse it into a .txt file and send that instead.
				const b = await new Blob([returnText as BlobPart], { 'type': 'text' });

				if (b.size > 8388290) {
					// Update return text
					// todo: embedify
					returnText =
						`<@${message.authorId}>${returnmsg.line1}\n${returnmsg.line2}\nFull details could not be attached to this messaged as a \`.txt\` file as the file would be too large for Discord to handle.  If you would like to see the details of rolls, please send the rolls in multiple messages instead of bundled into one.`;

					// Attempt to DM the GMs and send a warning if it could not DM a GM
					await sendDirectMessage(BigInt(e.substring(2, e.length - 1)), returnText).catch(() => {
						message.send(generateDMFailed(e));
					});
				} else {
					// Update return
					// todo: embedify
					returnText = `<@${message.authorId}>${returnmsg.line1}\n${returnmsg.line2}\nFull details have been attached to this messaged as a \`.txt\` file for verification purposes.`;

					// Attempt to DM the GMs and send a warning if it could not DM a GM
					await sendDirectMessage(BigInt(e.substring(2, e.length - 1)), { 'content': returnText, 'file': { 'blob': b, 'name': 'rollDetails.txt' } }).catch(() => {
						message.send(generateDMFailed(e));
					});
				}
			});

			// Finally send the text
			m.edit(normalText);

			if (DEVMODE && config.logRolls) {
				// If enabled, log rolls so we can verify the bots math
				dbClient.execute(queries.insertRollLogCmd(0, 0), [originalCommand, returnText, m.id]).catch((e) => {
					log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e)}`);
				});
			}
		} else {
			// When not a GM roll, make sure the message is not too big
			if (returnText.length > 2000) {
				// If its too big, collapse it into a .txt file and send that instead.
				const b = await new Blob([returnText as BlobPart], { 'type': 'text' });

				if (b.size > 8388290) {
					// Update return text
					returnText =
						`<@${message.authorId}>${returnmsg.line1}\n${returnmsg.line2}\nDetails have been ommitted from this message for being over 2000 characters.  Full details could not be attached to this messaged as a \`.txt\` file as the file would be too large for Discord to handle.  If you would like to see the details of rolls, please send the rolls in multiple messages instead of bundled into one.`;

					// Send the results
					m.edit(returnText);
				} else {
					// Update return text
					returnText =
						`<@${message.authorId}>${returnmsg.line1}\n${returnmsg.line2}\nDetails have been ommitted from this message for being over 2000 characters.  Full details have been attached to this messaged as a \`.txt\` file for verification purposes.`;

					// Remove the original message to send new one with attachment
					m.delete();

					// todo: embedify
					await message.send({ 'content': returnText, 'file': { 'blob': b, 'name': 'rollDetails.txt' } });
				}
			} else {
				// Finally send the text
				m.edit(returnText);
			}

			if (DEVMODE && config.logRolls) {
				// If enabled, log rolls so we can verify the bots math
				dbClient.execute(queries.insertRollLogCmd(0, 0), [originalCommand, returnText, m.id]).catch((e) => {
					log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e)}`);
				});
			}
		}
	} catch (e) {
		log(LT.ERROR, `Undandled Error: ${JSON.stringify(e)}`);
	}
};
