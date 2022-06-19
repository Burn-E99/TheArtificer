import config from '../../../config.ts';
import { dbClient, queries } from '../../db.ts';
import {
	// Discordeno deps
	cache,
	CreateMessage,
	// Log4Deno deps
	log,
	LT,
	// Discordeno deps
	sendDirectMessage,
	sendMessage,
	// httpd deps
	Status,
	STATUS_TEXT,
} from '../../../deps.ts';
import { RollModifiers } from '../../mod.d.ts';
import solver from '../../solver/_index.ts';
import { generateDMFailed } from '../../commandUtils.ts';

export const apiRoll = async (requestEvent: Deno.RequestEvent, query: Map<string, string>, apiUserid: BigInt) => {
	// Make sure query contains all the needed parts
	if (
		(query.has('rollstr') && ((query.get('rollstr') || '').length > 0)) && (query.has('channel') && ((query.get('channel') || '').length > 0)) &&
		(query.has('user') && ((query.get('user') || '').length > 0))
	) {
		if (query.has('n') && query.has('m')) {
			// Alert API user that they shouldn't be doing this
			requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));
			return;
		}

		// Check if user is authenticated to use this endpoint
		let authorized = false;
		let hideWarn = false;

		// Check if the db has the requested userid/channelid combo, and that the requested userid matches the userid linked with the api key
		const dbChannelQuery = await dbClient.query('SELECT active, banned FROM allowed_channels WHERE userid = ? AND channelid = ?', [apiUserid, BigInt(query.get('channel') || '0')]);
		if (dbChannelQuery.length === 1 && (apiUserid === BigInt(query.get('user') || '0')) && dbChannelQuery[0].active && !dbChannelQuery[0].banned) {
			// Get the guild from the channel and make sure user is in said guild
			const guild = cache.channels.get(BigInt(query.get('channel') || ''))?.guild;
			if (guild && guild.members.get(BigInt(query.get('user') || ''))?.id) {
				const dbGuildQuery = await dbClient.query('SELECT active, banned, hidewarn FROM allowed_guilds WHERE guildid = ? AND channelid = ?', [
					guild.id,
					BigInt(query.get('channel') || '0'),
				]);

				// Make sure guild allows API rolls
				if (dbGuildQuery.length === 1 && dbGuildQuery[0].active && !dbGuildQuery[0].banned) {
					authorized = true;
					hideWarn = dbGuildQuery[0].hidewarn;
				}
			}
		}

		if (authorized) {
			// Rest of this command is in a try-catch to protect all sends/edits from erroring out
			try {
				// Flag to tell if roll was completely successful
				let errorOut = false;
				// Make sure rollCmd is not undefined
				let rollCmd = query.get('rollstr') || '';
				const originalCommand = query.get('rollstr');

				if (rollCmd.length === 0) {
					// Alert API user that they messed up
					requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));

					// Always log API rolls for abuse detection
					dbClient.execute(queries.insertRollLogCmd(1, 1), [originalCommand, 'EmptyInput', null]).catch((e) => {
						log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
					});
					return;
				}

				if (query.has('o') && (query.get('o')?.toLowerCase() !== 'd' && query.get('o')?.toLowerCase() !== 'a')) {
					// Alert API user that they messed up
					requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));

					// Always log API rolls for abuse detection
					dbClient.execute(queries.insertRollLogCmd(1, 1), [originalCommand, 'BadOrder', null]).catch((e) => {
						log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
					});
					return;
				}

				// Clip off the leading prefix.  API calls must be formatted with a prefix at the start to match how commands are sent in Discord
				rollCmd = rollCmd.substring(rollCmd.indexOf(config.prefix) + 2).replace(/%20/g, ' ');

				const modifiers: RollModifiers = {
					noDetails: false,
					superNoDetails: false,
					spoiler: '',
					maxRoll: query.has('m'),
					nominalRoll: query.has('n'),
					gmRoll: false,
					gms: [],
					order: query.has('o') ? (query.get('o')?.toLowerCase() || '') : '',
					valid: true,
					count: query.has('c'),
				};

				// Parse the roll and get the return text
				const returnmsg = solver.parseRoll(rollCmd, modifiers);

				// Alert users why this message just appeared and how they can report abues pf this feature
				const apiPrefix = hideWarn
					? ''
					: `The following roll was conducted using my built in API.  If someone in this channel did not request this roll, please report API abuse here: <${config.api.supportURL}>\n\n`;
				let m, returnText = '';

				// Handle sending the error message to whoever called the api
				if (returnmsg.error) {
					requestEvent.respondWith(new Response(returnmsg.errorMsg, { status: Status.InternalServerError }));

					// Always log API rolls for abuse detection
					dbClient.execute(queries.insertRollLogCmd(1, 1), [originalCommand, returnmsg.errorCode, null]).catch((e) => {
						log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
					});
					return;
				} else {
					returnText = `${apiPrefix}<@${query.get('user')}>${returnmsg.line1}\n${returnmsg.line2}`;
					let spoilerTxt = '';

					// Determine if spoiler flag was on
					if (query.has('s')) {
						spoilerTxt = '||';
					}

					// Determine if no details flag was on
					if (!query.has('snd')) {
						if (query.has('nd')) {
							returnText += '\nDetails suppressed by nd query.';
						} else {
							returnText += `\nDetails:\n${spoilerTxt}${returnmsg.line3}${spoilerTxt}`;
						}
					}
				}

				// If the roll was a GM roll, send DMs to all the GMs
				if (query.has('gms')) {
					// Get all the GM user IDs from the query
					const gms = (query.get('gms') || '').split(',');
					if (gms.length === 0) {
						// Alert API user that they messed up
						requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));

						// Always log API rolls for abuse detection
						dbClient.execute(queries.insertRollLogCmd(1, 1), [originalCommand, 'NoGMsSent', null]).catch((e) => {
							log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
						});
						return;
					}

					// Make a new return line to be sent to the roller
					let normalText = `${apiPrefix}<@${query.get('user')}>${returnmsg.line1}\nResults have been messaged to the following GMs: `;
					gms.forEach((e) => {
						log(LT.LOG, `Appending GM ${e} to roll text`);
						normalText += `<@${e}> `;
					});

					// Send the return message as a DM or normal message depening on if the channel is set
					if ((query.get('channel') || '').length > 0) {
						// todo: embedify
						m = await sendMessage(BigInt(query.get('channel') || ''), normalText).catch(() => {
							requestEvent.respondWith(new Response('Message 00 failed to send.', { status: Status.InternalServerError }));
							errorOut = true;
						});
					} else {
						// todo: embedify
						m = await sendDirectMessage(BigInt(query.get('user') || ''), normalText).catch(() => {
							requestEvent.respondWith(new Response('Message 01 failed to send.', { status: Status.InternalServerError }));
							errorOut = true;
						});
					}

					const newMessage: CreateMessage = {};
					// If its too big, collapse it into a .txt file and send that instead.
					const b = await new Blob([returnText as BlobPart], { 'type': 'text' });

					if (b.size > 8388290) {
						// Update return text
						newMessage.content = `${apiPrefix}<@${query.get('user')
							}>${returnmsg.line1}\n${returnmsg.line2}\nDetails have been ommitted from this message for being over 2000 characters.  Full details could not be attached to this messaged as a \`.txt\` file as the file would be too large for Discord to handle.  If you would like to see the details of rolls, please send the rolls in multiple messages instead of bundled into one.`;
					} else {
						// Update return text
						newMessage.content = `${apiPrefix}<@${query.get('user')
							}>${returnmsg.line1}\n${returnmsg.line2}\nFull details have been attached to this messaged as a \`.txt\` file for verification purposes.`;
						newMessage.file = { 'blob': b, 'name': 'rollDetails.txt' };
					}

					// And message the full details to each of the GMs, alerting roller of every GM that could not be messaged
					gms.forEach(async (e) => {
						log(LT.LOG, `Messaging GM ${e} roll results`);
						// Attempt to DM the GMs and send a warning if it could not DM a GM
						await sendDirectMessage(BigInt(e), newMessage).catch(async () => {
							const failedSend = generateDMFailed(e);
							// Send the return message as a DM or normal message depening on if the channel is set
							if ((query.get('channel') || '').length > 0) {
								m = await sendMessage(BigInt(query.get('channel') || ''), failedSend).catch(() => {
									requestEvent.respondWith(new Response('Message failed to send.', { status: Status.InternalServerError }));
									errorOut = true;
								});
							} else {
								m = await sendDirectMessage(BigInt(query.get('user') || ''), failedSend).catch(() => {
									requestEvent.respondWith(new Response('Message failed to send.', { status: Status.InternalServerError }));
									errorOut = true;
								});
							}
						});
					});

					// Always log API rolls for abuse detection
					dbClient.execute(queries.insertRollLogCmd(1, 0), [originalCommand, returnText, (typeof m === 'object') ? m.id : null]).catch((e) => {
						log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
					});

					// Handle closing the request out
					if (errorOut) {
						return;
					} else {
						requestEvent.respondWith(new Response(normalText, { status: Status.OK }));
						return;
					}
				} else {
					// todo: embedify
					const newMessage: CreateMessage = {};
					newMessage.content = returnText;

					// When not a GM roll, make sure the message is not too big
					if (returnText.length > 2000) {
						// If its too big, collapse it into a .txt file and send that instead.
						const b = await new Blob([returnText as BlobPart], { 'type': 'text' });

						if (b.size > 8388290) {
							// Update return text
							newMessage.content = `${apiPrefix}<@${query.get('user')
								}>${returnmsg.line1}\n${returnmsg.line2}\nDetails have been ommitted from this message for being over 2000 characters.  Full details could not be attached to this messaged as a \`.txt\` file as the file would be too large for Discord to handle.  If you would like to see the details of rolls, please send the rolls in multiple messages instead of bundled into one.`;
						} else {
							// Update return text
							newMessage.content = `${apiPrefix}<@${query.get('user')
								}>${returnmsg.line1}\n${returnmsg.line2}\nDetails have been ommitted from this message for being over 2000 characters.  Full details have been attached to this messaged as a \`.txt\` file for verification purposes.`;
							newMessage.file = { 'blob': b, 'name': 'rollDetails.txt' };
						}
					}

					// Send the return message as a DM or normal message depening on if the channel is set
					if ((query.get('channel') || '').length > 0) {
						m = await sendMessage(BigInt(query.get('channel') || ''), newMessage).catch(() => {
							requestEvent.respondWith(new Response('Message 20 failed to send.', { status: Status.InternalServerError }));
							errorOut = true;
						});
					} else {
						m = await sendDirectMessage(BigInt(query.get('user') || ''), newMessage).catch(() => {
							requestEvent.respondWith(new Response('Message 21 failed to send.', { status: Status.InternalServerError }));
							errorOut = true;
						});
					}

					// If enabled, log rolls so we can verify the bots math
					dbClient.execute(queries.insertRollLogCmd(1, 0), [originalCommand, returnText, (typeof m === 'object') ? m.id : null]).catch((e) => {
						log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
					});

					// Handle closing the request out
					if (errorOut) {
						return;
					} else {
						requestEvent.respondWith(new Response(returnText, { status: Status.OK }));
						return;
					}
				}
			} catch (err) {
				// Handle any errors we missed
				log(LT.ERROR, `Unhandled Error: ${JSON.stringify(err)}`);
				requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.InternalServerError), { status: Status.InternalServerError }));
			}
		} else {
			// Alert API user that they messed up
			requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden }));
		}
	} else {
		// Alert API user that they shouldn't be doing this
		requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));
	}
};
