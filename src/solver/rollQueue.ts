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
import { QueuedRoll, RollModifiers } from '../mod.d.ts';
import { generateCountDetailsEmbed, generateDMFailed, generateRollEmbed, infoColor2, rollingEmbed } from '../commandUtils.ts';

let currentWorkers = 0;
const rollQueue: Array<QueuedRoll> = [];

// Handle setting up and calling the rollWorker
const handleRollWorker = async (rq: QueuedRoll) => {
	currentWorkers++;

	// gmModifiers used to create gmEmbed (basically just turn off the gmRoll)
	const gmModifiers = JSON.parse(JSON.stringify(rq.modifiers));
	gmModifiers.gmRoll = false;

	const rollWorker = new Worker(new URL('../solver/rollWorker.ts', import.meta.url).href, { type: 'module' });

	const workerTimeout = setTimeout(async () => {
		rollWorker.terminate();
		currentWorkers--;
		rq.dd.m.edit({
			embeds: [
				(await generateRollEmbed(
					rq.dd.message.authorId,
					<SolvedRoll> {
						error: true,
						errorCode: 'TooComplex',
						errorMsg: 'Error: Roll took too long to process, try breaking roll down into simpler parts',
					},
					<RollModifiers> {},
				)).embed,
			],
		});
	}, config.limits.workerTimeout);

	rollWorker.postMessage({
		rollCmd: rq.rollCmd,
		modifiers: rq.modifiers,
	});

	rollWorker.addEventListener('message', async (workerMessage) => {
		try {
			currentWorkers--;
			clearTimeout(workerTimeout);
			const returnmsg = workerMessage.data;
			const pubEmbedDetails = await generateRollEmbed(rq.dd.message.authorId, returnmsg, rq.modifiers);
			const gmEmbedDetails = await generateRollEmbed(rq.dd.message.authorId, returnmsg, gmModifiers);
			const countEmbed = generateCountDetailsEmbed(returnmsg.counts);

			// If there was an error, report it to the user in hopes that they can determine what they did wrong
			if (returnmsg.error) {
				rq.dd.m.edit({ embeds: [pubEmbedDetails.embed] });

				if (DEVMODE && config.logRolls) {
					// If enabled, log rolls so we can see what went wrong
					dbClient.execute(queries.insertRollLogCmd(0, 1), [rq.dd.originalCommand, returnmsg.errorCode, rq.dd.m.id]).catch((e) => {
						log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e)}`);
					});
				}
			} else {
				// Determine if we are to send a GM roll or a normal roll
				if (rq.modifiers.gmRoll) {
					// Send the public embed to correct channel
					rq.dd.m.edit({ embeds: [pubEmbedDetails.embed] });

					// And message the full details to each of the GMs, alerting roller of every GM that could not be messaged
					rq.modifiers.gms.forEach(async (gm) => {
						log(LT.LOG, `Messaging GM ${gm}`);
						// Attempt to DM the GM and send a warning if it could not DM a GM
						await sendDirectMessage(BigInt(gm.substring(2, gm.length - 1)), {
							embeds: rq.modifiers.count ? [gmEmbedDetails.embed, countEmbed] : [gmEmbedDetails.embed],
						}).then(async () => {
							// Check if we need to attach a file and send it after the initial details sent
							if (gmEmbedDetails.hasAttachment) {
								await sendDirectMessage(BigInt(gm.substring(2, gm.length - 1)), {
									file: gmEmbedDetails.attachment,
								}).catch(() => {
									rq.dd.message.reply(generateDMFailed(gm));
								});
							}
						}).catch(() => {
							rq.dd.message.reply(generateDMFailed(gm));
						});
					});
				} else {
					// Not a gm roll, so just send normal embed to correct channel
					const n = await rq.dd.m.edit({
						embeds: rq.modifiers.count ? [pubEmbedDetails.embed, countEmbed] : [pubEmbedDetails.embed],
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
};

// Runs the roll or queues it depending on how many workers are currently running
export const queueRoll = async (rq: QueuedRoll) => {
	if (rq.apiRoll) {
		handleRollWorker(rq);
	} else if (!rollQueue.length && currentWorkers < config.limits.maxWorkers) {
		handleRollWorker(rq);
	} else {
		rq.dd.m.edit({
			embeds: [{
				color: infoColor2,
				title: `${config.name} currently has its hands full and has queued your roll.`,
				description: `There are currently ${currentWorkers + rollQueue.length} rolls ahead of this roll.

The results for this roll will replace this message when it is done.`,
			}],
		}).catch((e) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(rq.dd.m)} | ${JSON.stringify(e)}`);
		});
		rollQueue.push(rq);
	}
};

// Checks the queue constantly to make sure the queue stays empty
setInterval(async () => {
	log(LT.LOG, `Checking rollQueue for items, rollQueue length: ${rollQueue.length}, currentWorkers: ${currentWorkers}, config.limits.maxWorkers: ${config.limits.maxWorkers}`);
	if (rollQueue.length && currentWorkers < config.limits.maxWorkers) {
		const temp = rollQueue.shift();
		if (temp) {
			temp.dd.m.edit(rollingEmbed).catch((e) => {
				log(LT.ERROR, `Failed to send message: ${JSON.stringify(temp.dd.m)} | ${JSON.stringify(e)}`);
			});
			handleRollWorker(temp);
		}
	}
}, 1000);
