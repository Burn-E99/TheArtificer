import config from '../../config.ts';
import { DEVMODE } from '../../flags.ts';
import { dbClient, queries } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
	// Discordeno deps
	sendDirectMessage,
} from '../../deps.ts';
import { SolvedRoll } from '../solver/solver.d.ts';
import { RollModifiers } from '../mod.d.ts';
import { generateCountDetailsEmbed, generateDMFailed, generateRollEmbed, infoColor1, warnColor } from '../commandUtils.ts';
import rollFuncs from './roll/_index.ts';

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

		const m = await message.reply({
			embeds: [{
				color: infoColor1,
				title: 'Rolling . . .',
			}],
		});

		// Get modifiers from command
		const modifiers = rollFuncs.getModifiers(m, args, command, originalCommand);

		// gmModifiers used to create gmEmbed (basically just turn off the gmRoll)
		const gmModifiers = JSON.parse(JSON.stringify(modifiers));
		gmModifiers.gmRoll = false;

		// Return early if the modifiers were invalid
		if (!modifiers.valid) {
			return;
		}

		// Rejoin all of the args and send it into the solver, if solver returns a falsy item, an error object will be substituded in
		const rollCmd = `${command} ${args.join(' ')}`;
		// const returnmsg = solver.parseRoll(rollCmd, modifiers) || <SolvedRoll>{ error: true, errorCode: 'EmptyMessage', errorMsg: 'Error: Empty message' };

		const rollWorker = new Worker(new URL('../solver/rollWorker.ts', import.meta.url).href, { type: 'module' });

		const workerTimeout = setTimeout(async () => {
			rollWorker.terminate();
			m.edit({
				embeds: [
					(await generateRollEmbed(
						message.authorId,
						<SolvedRoll> {
							error: true,
							errorCode: 'TooComplex',
							errorMsg: 'Error: Roll Too Complex, try breaking roll down into simpler parts',
						},
						<RollModifiers> {},
					)).embed,
				],
			});
		}, 60000);

		rollWorker.postMessage({
			rollCmd,
			modifiers,
		});

		rollWorker.addEventListener('message', async (workerMessage) => {
			try {
				clearTimeout(workerTimeout);
				const returnmsg = workerMessage.data;
				const pubEmbedDetails = await generateRollEmbed(message.authorId, returnmsg, modifiers);
				const gmEmbedDetails = await generateRollEmbed(message.authorId, returnmsg, gmModifiers);
				const countEmbed = generateCountDetailsEmbed(returnmsg.counts);

				// If there was an error, report it to the user in hopes that they can determine what they did wrong
				if (returnmsg.error) {
					m.edit({ embeds: [pubEmbedDetails.embed] });

					if (DEVMODE && config.logRolls) {
						// If enabled, log rolls so we can see what went wrong
						dbClient.execute(queries.insertRollLogCmd(0, 1), [originalCommand, returnmsg.errorCode, m.id]).catch((e) => {
							log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e)}`);
						});
					}
				} else {
					// Determine if we are to send a GM roll or a normal roll
					if (modifiers.gmRoll) {
						// Send the public embed to correct channel
						m.edit({ embeds: [pubEmbedDetails.embed] });

						// And message the full details to each of the GMs, alerting roller of every GM that could not be messaged
						modifiers.gms.forEach(async (gm) => {
							log(LT.LOG, `Messaging GM ${gm}`);
							// Attempt to DM the GM and send a warning if it could not DM a GM
							await sendDirectMessage(BigInt(gm.substring(2, gm.length - 1)), {
								embeds: modifiers.count ? [gmEmbedDetails.embed, countEmbed] : [gmEmbedDetails.embed],
							}).then(async () => {
								// Check if we need to attach a file and send it after the initial details sent
								if (gmEmbedDetails.hasAttachment) {
									await sendDirectMessage(BigInt(gm.substring(2, gm.length - 1)), {
										file: gmEmbedDetails.attachment,
									}).catch(() => {
										message.reply(generateDMFailed(gm));
									});
								}
							}).catch(() => {
								message.reply(generateDMFailed(gm));
							});
						});
					} else {
						// Not a gm roll, so just send normal embed to correct channel
						const n = await m.edit({
							embeds: modifiers.count ? [pubEmbedDetails.embed, countEmbed] : [pubEmbedDetails.embed],
						});
						if (pubEmbedDetails.hasAttachment) {
							// Attachment requires you to send a new message
							n.reply({
								file: pubEmbedDetails.attachment,
							});
						}
					}
				}
			} catch (e) {
				log(LT.ERROR, `Unddandled Error: ${JSON.stringify(e)}`);
			}
		});
	} catch (e) {
		log(LT.ERROR, `Undandled Error: ${JSON.stringify(e)}`);
	}
};
