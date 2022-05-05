/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

import {
	// Discordeno deps
	cache, CreateMessage,
	sendMessage, sendDirectMessage,

	// httpd deps
	Status, STATUS_TEXT,

	// nanoid deps
	nanoid
} from "../deps.ts";

import { dbClient } from "./db.ts";
import solver from "./solver.ts";
import { LogTypes as LT } from "./utils.enums.ts";
import utils from "./utils.ts";
import {
	generateApiKeyEmail, generateApiDeleteEmail, generateDMFailed
} from "./constantCmds.ts";

import config from "../config.ts";

// start(databaseClient) returns nothing
// start initializes and runs the entire API for the bot
const start = async (): Promise<void> => {
	const server = Deno.listen({ port: config.api.port });
	utils.log(LT.INFO, `HTTP api running at: http://localhost:${config.api.port}/`);

	// rateLimitTime holds all users with the last time they started a rate limit timer
	const rateLimitTime = new Map<string, number>();
	// rateLimitCnt holds the number of times the user has called the api in the current rate limit timer
	const rateLimitCnt = new Map<string, number>();

	// Catching every request made to the server
	for await (const conn of server) {
		(async () => {
			const httpConn = Deno.serveHttp(conn);
			for await (const requestEvent of httpConn) {
				const request = requestEvent.request;
				utils.log(LT.LOG, `Handling request: ${JSON.stringify(request)}`);
				// Check if user is authenticated to be using this API
				let authenticated = false;
				let rateLimited = false;
				let updateRateLimitTime = false;
				let apiUserid = 0n;
				let apiUseridStr = "";
				let apiUserEmail = "";
				let apiUserDelCode = "";

				// Check the requests API key
				if (request.headers.has("X-Api-Key")) {
					// Get the userid and flags for the specific key
					const dbApiQuery = await dbClient.query("SELECT userid, email, deleteCode FROM all_keys WHERE apiKey = ? AND active = 1 AND banned = 0", [request.headers.get("X-Api-Key")]);

					// If only one user returned, is not banned, and is currently active, mark as authenticated
					if (dbApiQuery.length === 1) {
						apiUserid = BigInt(dbApiQuery[0].userid);
						apiUserEmail = dbApiQuery[0].email;
						apiUserDelCode = dbApiQuery[0].deleteCode;
						authenticated = true;

						// Rate limiting inits
						apiUseridStr = apiUserid.toString();
						const apiTimeNow = new Date().getTime();

						// Check if user has sent a request recently
						if (rateLimitTime.has(apiUseridStr) && (((rateLimitTime.get(apiUseridStr) || 0) + config.api.rateLimitTime) > apiTimeNow)) {
							// Get current count
							const currentCnt = rateLimitCnt.get(apiUseridStr) || 0;
							if (currentCnt < config.api.rateLimitCnt) {
								// Limit not yet exceeded, update count
								rateLimitCnt.set(apiUseridStr, (currentCnt + 1));
							} else {
								// Limit exceeded, prevent API use
								rateLimited = true;
							}
						} else {
							// Update the maps
							updateRateLimitTime = true;
							rateLimitCnt.set(apiUseridStr, 1);
						}
					}
				}

				if (authenticated && !rateLimited) {
					// Get path and query as a string
					const [path, tempQ] = request.url.split("?");

					// Turn the query into a map (if it exists)
					const query = new Map<string, string>();
					if (tempQ !== undefined) {
						tempQ.split("&").forEach((e: string) => {
							utils.log(LT.LOG, `Breaking down request query: ${request} ${e}`);
							const [option, params] = e.split("=");
							query.set(option.toLowerCase(), params);
						});
					}

					// Handle the request
					switch (request.method) {
						case "GET":
							switch (path.toLowerCase()) {
								case "/api/key":
								case "/api/key/":
									if ((query.has("user") && ((query.get("user") || "").length > 0)) && (query.has("a") && ((query.get("a") || "").length > 0))) {
										if (apiUserid === config.api.admin && apiUserid === BigInt(query.get("a") || "0")) {
											// Generate new secure key
											const newKey = await nanoid(25);

											// Flag to see if there is an error inside the catch
											let erroredOut = false;

											// Insert new key/user pair into the db
											await dbClient.execute("INSERT INTO all_keys(userid,apiKey) values(?,?)", [apiUserid, newKey]).catch(e => {
												utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
												requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.InternalServerError), { status: Status.InternalServerError }));
												erroredOut = true;
											});

											// Exit this case now if catch errored
											if (erroredOut) {
												break;
											} else {
												// Send API key as response
												requestEvent.respondWith(new Response(JSON.stringify({ "key": newKey, "userid": query.get("user") }), { status: Status.OK }));
												break;
											}
										} else {
											// Only allow the db admin to use this API
											requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden }));
										}
									} else {
										// Alert API user that they messed up
										requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));
									}
									break;
								case "/api/channel":
								case "/api/channel/":
									if (query.has("user") && ((query.get("user") || "").length > 0)) {
										if (apiUserid === BigInt(query.get("user") || "0")) {
											// Flag to see if there is an error inside the catch
											let erroredOut = false;

											// Get all channels userid has authorized
											const dbAllowedChannelQuery = await dbClient.query("SELECT * FROM allowed_channels WHERE userid = ?", [apiUserid]).catch(e => {
												utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
												requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.InternalServerError), { status: Status.InternalServerError }));
												erroredOut = true;
											});

											if (erroredOut) {
												break;
											} else {
												// Customized strinification to handle BigInts correctly
												const returnChannels = JSON.stringify(dbAllowedChannelQuery, (_key, value) => (typeof value === 'bigint' ? value.toString() : value));
												// Send API key as response
												requestEvent.respondWith(new Response(returnChannels, { status: Status.OK }));
												break;
											}
										} else {
											// Alert API user that they shouldn't be doing this
											requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden }));
										}
									} else {
										// Alert API user that they messed up
										requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));
									}
									break;
								case "/api/roll":
								case "/api/roll/":
									// Make sure query contains all the needed parts
									if ((query.has("rollstr") && ((query.get("rollstr") || "").length > 0)) && (query.has("channel") && ((query.get("channel") || "").length > 0)) && (query.has("user") && ((query.get("user") || "").length > 0))) {
										if (query.has("n") && query.has("m")) {
											// Alert API user that they shouldn't be doing this
											requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));
											break;
										}

										// Check if user is authenticated to use this endpoint
										let authorized = false;

										// Check if the db has the requested userid/channelid combo, and that the requested userid matches the userid linked with the api key
										const dbChannelQuery = await dbClient.query("SELECT active, banned FROM allowed_channels WHERE userid = ? AND channelid = ?", [apiUserid, BigInt(query.get("channel") || "0")]);
										if (dbChannelQuery.length === 1 && (apiUserid === BigInt(query.get("user") || "0")) && dbChannelQuery[0].active && !dbChannelQuery[0].banned) {

											// Get the guild from the channel and make sure user is in said guild
											const guild = cache.channels.get(BigInt(query.get("channel") || ""))?.guild;
											if (guild && guild.members.get(BigInt(query.get("user") || ""))?.id) {
												const dbGuildQuery = await dbClient.query("SELECT active, banned FROM allowed_guilds WHERE guildid = ?", [BigInt(guild.id)]);

												// Make sure guild allows API rolls
												if (dbGuildQuery.length === 1 && dbGuildQuery[0].active && !dbGuildQuery[0].banned) {
													authorized = true;
												}
											}
										}

										if (authorized) {
											// Rest of this command is in a try-catch to protect all sends/edits from erroring out
											try {
												// Flag to tell if roll was completely successful
												let errorOut = false;
												// Make sure rollCmd is not undefined
												let rollCmd = query.get("rollstr") || "";
												const originalCommand = query.get("rollstr");

												if (rollCmd.length === 0) {
													// Alert API user that they messed up
													requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));

													// Always log API rolls for abuse detection
													dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,1,1)", [originalCommand, "EmptyInput", null]).catch(e => {
														utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
													});
													break;
												}

												if (query.has("o") && (query.get("o")?.toLowerCase() !== "d" && query.get("o")?.toLowerCase() !== "a")) {
													// Alert API user that they messed up
													requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));

													// Always log API rolls for abuse detection
													dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,1,1)", [originalCommand, "BadOrder", null]).catch(e => {
														utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
													});
													break;
												}

												// Clip off the leading prefix.  API calls must be formatted with a prefix at the start to match how commands are sent in Discord
												rollCmd = rollCmd.substr(rollCmd.indexOf(config.prefix) + 2).replace(/%20/g, " ");

												// Parse the roll and get the return text
												const returnmsg = solver.parseRoll(rollCmd, config.prefix, config.postfix, query.has("m"), query.has("n"), query.has("o") ? (query.get("o")?.toLowerCase() || "") : "");

												// Alert users why this message just appeared and how they can report abues pf this feature
												const apiPrefix = `The following roll was conducted using my built in API.  If someone in this channel did not request this roll, please report API abuse here: <${config.api.supportURL}>\n\n`;
												let m, returnText = "";

												// Handle sending the error message to whoever called the api
												if (returnmsg.error) {
													requestEvent.respondWith(new Response(returnmsg.errorMsg, { status: Status.InternalServerError }));

													// Always log API rolls for abuse detection
													dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,1,1)", [originalCommand, returnmsg.errorCode, null]).catch(e => {
														utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
													});
													break;
												} else {
													returnText = `${apiPrefix}<@${query.get("user")}>${returnmsg.line1}\n${returnmsg.line2}`;
													let spoilerTxt = "";

													// Determine if spoiler flag was on
													if (query.has("s")) {
														spoilerTxt = "||";
													}

													// Determine if no details flag was on
													if (query.has("nd")) {
														returnText += "\nDetails suppressed by nd query.";
													} else {
														returnText += `\nDetails:\n${spoilerTxt}${returnmsg.line3}${spoilerTxt}`;
													}
												}

												// If the roll was a GM roll, send DMs to all the GMs
												if (query.has("gms")) {
													// Get all the GM user IDs from the query
													const gms = (query.get("gms") || "").split(",");
													if (gms.length === 0) {
														// Alert API user that they messed up
														requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));

														// Always log API rolls for abuse detection
														dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,1,1)", [originalCommand, "NoGMsSent", null]).catch(e => {
															utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
														});
														break;
													}

													// Make a new return line to be sent to the roller
													let normalText = `${apiPrefix}<@${query.get("user")}>${returnmsg.line1}\nResults have been messaged to the following GMs: `;
													gms.forEach(e => {
														utils.log(LT.LOG, `Appending GM ${e} to roll text`);
														normalText += `<@${e}> `;
													});

													// Send the return message as a DM or normal message depening on if the channel is set
													if ((query.get("channel") || "").length > 0) {
														// todo: embedify
														m = await sendMessage(BigInt(query.get("channel") || ""), normalText).catch(() => {
															requestEvent.respondWith(new Response("Message 00 failed to send.", { status: Status.InternalServerError }));
															errorOut = true;
														});
													} else {
														// todo: embedify
														m = await sendDirectMessage(BigInt(query.get("user") || ""), normalText).catch(() => {
															requestEvent.respondWith(new Response("Message 01 failed to send.", { status: Status.InternalServerError }));
															errorOut = true;
														});
													}

													const newMessage: CreateMessage = {};
													// If its too big, collapse it into a .txt file and send that instead.
													const b = await new Blob([returnText as BlobPart], { "type": "text" });

													if (b.size > 8388290) {
														// Update return text
														newMessage.content = `${apiPrefix}<@${query.get("user")}>${returnmsg.line1}\n${returnmsg.line2}\nDetails have been ommitted from this message for being over 2000 characters.  Full details could not be attached to this messaged as a \`.txt\` file as the file would be too large for Discord to handle.  If you would like to see the details of rolls, please send the rolls in multiple messages instead of bundled into one.`;
													} else {
														// Update return text
														newMessage.content = `${apiPrefix}<@${query.get("user")}>${returnmsg.line1}\n${returnmsg.line2}\nFull details have been attached to this messaged as a \`.txt\` file for verification purposes.`;
														newMessage.file = { "blob": b, "name": "rollDetails.txt" };
													}

													// And message the full details to each of the GMs, alerting roller of every GM that could not be messaged
													gms.forEach(async e => {
														utils.log(LT.LOG, `Messaging GM ${e} roll results`);
														// Attempt to DM the GMs and send a warning if it could not DM a GM
														await sendDirectMessage(BigInt(e), newMessage).catch(async () => {
															const failedSend = generateDMFailed(e);
															// Send the return message as a DM or normal message depening on if the channel is set
															if ((query.get("channel") || "").length > 0) {
																m = await sendMessage(BigInt(query.get("channel") || ""), failedSend).catch(() => {
																	requestEvent.respondWith(new Response("Message failed to send.", { status: Status.InternalServerError }));
																	errorOut = true;
																});
															} else {
																m = await sendDirectMessage(BigInt(query.get("user") || ""), failedSend).catch(() => {
																	requestEvent.respondWith(new Response("Message failed to send.", { status: Status.InternalServerError }));
																	errorOut = true;
																});
															}
														});
													});

													// Always log API rolls for abuse detection
													dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,1,0)", [originalCommand, returnText, ((typeof m === "object") ? m.id : null)]).catch(e => {
														utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
													});

													// Handle closing the request out
													if (errorOut) {
														break;
													} else {
														requestEvent.respondWith(new Response(normalText, { status: Status.OK }));
														break;
													}
												} else {
													// todo: embedify
													const newMessage: CreateMessage = {};
													newMessage.content = returnText;

													// When not a GM roll, make sure the message is not too big
													if (returnText.length > 2000) {
														// If its too big, collapse it into a .txt file and send that instead.
														const b = await new Blob([returnText as BlobPart], { "type": "text" });

														if (b.size > 8388290) {
															// Update return text
															newMessage.content = `${apiPrefix}<@${query.get("user")}>${returnmsg.line1}\n${returnmsg.line2}\nDetails have been ommitted from this message for being over 2000 characters.  Full details could not be attached to this messaged as a \`.txt\` file as the file would be too large for Discord to handle.  If you would like to see the details of rolls, please send the rolls in multiple messages instead of bundled into one.`;
														} else {
															// Update return text
															newMessage.content = `${apiPrefix}<@${query.get("user")}>${returnmsg.line1}\n${returnmsg.line2}\nDetails have been ommitted from this message for being over 2000 characters.  Full details have been attached to this messaged as a \`.txt\` file for verification purposes.`;
															newMessage.file = { "blob": b, "name": "rollDetails.txt" };
														}
													}

													// Send the return message as a DM or normal message depening on if the channel is set
													if ((query.get("channel") || "").length > 0) {
														m = await sendMessage(BigInt(query.get("channel") || ""), newMessage).catch(() => {
															requestEvent.respondWith(new Response("Message 20 failed to send.", { status: Status.InternalServerError }));
															errorOut = true;
														});
													} else {
														m = await sendDirectMessage(BigInt(query.get("user") || ""), newMessage).catch(() => {
															requestEvent.respondWith(new Response("Message 21 failed to send.", { status: Status.InternalServerError }));
															errorOut = true;
														});
													}

													// If enabled, log rolls so we can verify the bots math
													dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,1,0)", [originalCommand, returnText, ((typeof m === "object") ? m.id : null)]).catch(e => {
														utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
													});

													// Handle closing the request out
													if (errorOut) {
														break;
													} else {
														requestEvent.respondWith(new Response(returnText, { status: Status.OK }));
														break;
													}
												}
											} catch (err) {
												// Handle any errors we missed
												utils.log(LT.ERROR, `Unhandled Error: ${JSON.stringify(err)}`);
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
									break;
								default:
									// Alert API user that they messed up
									requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.NotFound), { status: Status.NotFound }));
									break;
							}
							break;
						case "POST":
							switch (path.toLowerCase()) {
								case "/api/channel/add":
								case "/api/channel/add/":
									if ((query.has("user") && ((query.get("user") || "").length > 0)) && (query.has("channel") && ((query.get("channel") || "").length > 0))) {
										if (apiUserid === BigInt(query.get("user") || "0")) {
											// Flag to see if there is an error inside the catch
											let erroredOut = false;

											// Insert new user/channel pair into the db
											await dbClient.execute("INSERT INTO allowed_channels(userid,channelid) values(?,?)", [apiUserid, BigInt(query.get("channel") || "0")]).catch(e => {
												utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
												requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.InternalServerError), { status: Status.InternalServerError }));
												erroredOut = true;
											});

											// Exit this case now if catch errored
											if (erroredOut) {
												break;
											} else {
												// Send API key as response
												requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.OK), { status: Status.OK }));
												break;
											}
										} else {
											// Alert API user that they shouldn't be doing this
											requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden }));
										}
									} else {
										// Alert API user that they messed up
										requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));
									}
									break;
								default:
									// Alert API user that they messed up
									requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.NotFound), { status: Status.NotFound }));
									break;
							}
							break;
						case "PUT":
							switch (path.toLowerCase()) {
								case "/api/key/ban":
								case "/api/key/ban/":
								case "/api/key/unban":
								case "/api/key/unban/":
								case "/api/key/activate":
								case "/api/key/activate/":
								case "/api/key/deactivate":
								case "/api/key/deactivate/":
									if ((query.has("a") && ((query.get("a") || "").length > 0)) && (query.has("user") && ((query.get("user") || "").length > 0))) {
										if (apiUserid === config.api.admin && apiUserid === BigInt(query.get("a") || "0")) {
											// Flag to see if there is an error inside the catch
											let key, value, erroredOut = false;

											// Determine key to edit
											if (path.toLowerCase().indexOf("ban") > 0) {
												key = "banned";
											} else {
												key = "active";
											}

											// Determine value to set
											if (path.toLowerCase().indexOf("de") > 0 || path.toLowerCase().indexOf("un") > 0) {
												value = 0;
											} else {
												value = 1;
											}

											// Execute the DB modification
											await dbClient.execute("UPDATE all_keys SET ?? = ? WHERE userid = ?", [key, value, apiUserid]).catch(e => {
												utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
												requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.InternalServerError), { status: Status.InternalServerError }));
												erroredOut = true;
											});

											// Exit this case now if catch errored
											if (erroredOut) {
												break;
											} else {
												// Send API key as response
												requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.OK), { status: Status.OK }));
												break;
											}
										} else {
											// Alert API user that they shouldn't be doing this
											requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden }));
										}
									} else {
										// Alert API user that they messed up
										requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));
									}
									break;
								case "/api/channel/ban":
								case "/api/channel/ban/":
								case "/api/channel/unban":
								case "/api/channel/unban/":
									if ((query.has("a") && ((query.get("a") || "").length > 0)) && (query.has("channel") && ((query.get("channel") || "").length > 0)) && (query.has("user") && ((query.get("user") || "").length > 0))) {
										if (apiUserid === config.api.admin && apiUserid === BigInt(query.get("a") || "0")) {
											// Flag to see if there is an error inside the catch
											let value, erroredOut = false;

											// Determine value to set
											if (path.toLowerCase().indexOf("un") > 0) {
												value = 0;
											} else {
												value = 1;
											}

											// Execute the DB modification
											await dbClient.execute("UPDATE allowed_channels SET banned = ? WHERE userid = ? AND channelid = ?", [value, apiUserid, BigInt(query.get("channel") || "0")]).catch(e => {
												utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
												requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.InternalServerError), { status: Status.InternalServerError }));
												erroredOut = true;
											});

											// Exit this case now if catch errored
											if (erroredOut) {
												break;
											} else {
												// Send API key as response
												requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.OK), { status: Status.OK }));
												break;
											}
										} else {
											// Alert API user that they shouldn't be doing this
											requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden }));
										}
									} else {
										// Alert API user that they messed up
										requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));
									}
									break;
								case "/api/channel/activate":
								case "/api/channel/activate/":
								case "/api/channel/deactivate":
								case "/api/channel/deactivate/":
									if ((query.has("channel") && ((query.get("channel") || "").length > 0)) && (query.has("user") && ((query.get("user") || "").length > 0))) {
										if (apiUserid === BigInt(query.get("user") || "0")) {
											// Flag to see if there is an error inside the catch
											let value, erroredOut = false;

											// Determine value to set
											if (path.toLowerCase().indexOf("de") > 0) {
												value = 0;
											} else {
												value = 1;
											}

											// Update the requested entry
											await dbClient.execute("UPDATE allowed_channels SET active = ? WHERE userid = ? AND channelid = ?", [value, apiUserid, BigInt(query.get("channel") || "0")]).catch(e => {
												utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
												requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.InternalServerError), { status: Status.InternalServerError }));
												erroredOut = true;
											});

											// Exit this case now if catch errored
											if (erroredOut) {
												break;
											} else {
												// Send API key as response
												requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.OK), { status: Status.OK }));
												break;
											}
										} else {
											// Alert API user that they shouldn't be doing this
											requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden  }));
										}
									} else {
										// Alert API user that they messed up
										requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));
									}
									break;
								default:
									// Alert API user that they messed up
									requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.NotFound), { status: Status.NotFound }));
									break;
							}
							break;
						case "DELETE":
							switch (path.toLowerCase()) {
								case "/api/key/delete":
								case "/api/key/delete/":
									if (query.has("user") && ((query.get("user") || "").length > 0) && query.has("email") && ((query.get("email") || "").length > 0)) {
										if (apiUserid === BigInt(query.get("user") || "0") && apiUserEmail === query.get("email")) {
											if (query.has("code") && ((query.get("code") || "").length > 0)) {
												if ((query.get("code") || "") === apiUserDelCode) {
													// User has recieved their delete code and we need to delete the account now
													let erroredOut = false;

													await dbClient.execute("DELETE FROM allowed_channels WHERE userid = ?", [apiUserid]).catch(e => {
														utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
														requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.InternalServerError), { status: Status.InternalServerError }));
														erroredOut = true;
													});
													if (erroredOut) {
														break;
													}

													await dbClient.execute("DELETE FROM all_keys WHERE userid = ?", [apiUserid]).catch(e => {
														utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
														requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.InternalServerError), { status: Status.InternalServerError }));
														erroredOut = true;
													});
													if (erroredOut) {
														break;
													} else {
														// Send API key as response
														requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.OK), { status: Status.OK }));
														break;
													}
												} else {
													// Alert API user that they shouldn't be doing this
													requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden }));
												}
											} else {
												// User does not have their delete code yet, so we need to generate one and email it to them
												const deleteCode = await nanoid(10);

												let erroredOut = false;

												// Execute the DB modification
												await dbClient.execute("UPDATE all_keys SET deleteCode = ? WHERE userid = ?", [deleteCode, apiUserid]).catch(e => {
													utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
													requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.InternalServerError), { status: Status.InternalServerError }));
													erroredOut = true;
												});
												if (erroredOut) {
													break;
												}

												// "Send" the email
												await sendMessage(config.api.email, generateApiDeleteEmail(apiUserEmail, deleteCode)).catch(() => {
													requestEvent.respondWith(new Response("Message 30 failed to send.", { status: Status.InternalServerError }));
													erroredOut = true;
												});
												if (erroredOut) {
													break;
												} else {
													// Send API key as response
													requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.FailedDependency), { status: Status.FailedDependency }));
													break;
												}
											}
										} else {
											// Alert API user that they shouldn't be doing this
											requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden }));
										}
									} else {
										// Alert API user that they messed up
										requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest  }));
									}
									break;
								default:
									// Alert API user that they messed up
									requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.NotFound), { status: Status.NotFound }));
									break;
							}
							break;
						default:
							// Alert API user that they messed up
							requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.MethodNotAllowed), { status: Status.MethodNotAllowed }));
							break;
					}

					if (updateRateLimitTime) {
						const apiTimeNow = new Date().getTime();
						rateLimitTime.set(apiUseridStr, apiTimeNow);
					}
				} else if (!authenticated && !rateLimited) {
					// Get path and query as a string
					const [path, tempQ] = request.url.split("?");

					// Turn the query into a map (if it exists)
					const query = new Map<string, string>();
					if (tempQ !== undefined) {
						tempQ.split("&").forEach((e: string) => {
							utils.log(LT.LOG, `Parsing request query #2 ${request} ${e}`);
							const [option, params] = e.split("=");
							query.set(option.toLowerCase(), params);
						});
					}

					// Handle the request
					switch (request.method) {
						case "GET":
							switch (path.toLowerCase()) {
								case "/api/key":
								case "/api/key/":
									if ((query.has("user") && ((query.get("user") || "").length > 0)) && (query.has("email") && ((query.get("email") || "").length > 0))) {
										// Generate new secure key
										const newKey = await nanoid(25);

										// Flag to see if there is an error inside the catch
										let erroredOut = false;

										// Insert new key/user pair into the db
										await dbClient.execute("INSERT INTO all_keys(userid,apiKey,email) values(?,?,?)", [BigInt(query.get("user") || "0"), newKey, (query.get("email") || "").toLowerCase()]).catch(e => {
											utils.log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
											requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.InternalServerError), { status: Status.InternalServerError }));
											erroredOut = true;
										});

										// Exit this case now if catch errored
										if (erroredOut) {
											break;
										}
										
										// "Send" the email
										await sendMessage(config.api.email, generateApiKeyEmail(query.get("email") || "no email", newKey)).catch(() => {
											requestEvent.respondWith(new Response("Message 31 failed to send.", { status: Status.InternalServerError }));
											erroredOut = true;
										});

										if (erroredOut) {
											break;
										} else {
											// Send API key as response
											requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.OK), { status: Status.OK }));
											break;
										}
									} else {
										// Alert API user that they messed up
										requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));
									}
									break;
								default:
									// Alert API user that they messed up
									requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.NotFound), { status: Status.NotFound }));
									break;
							}
							break;
						default:
							// Alert API user that they messed up
							requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.MethodNotAllowed), { status: Status.MethodNotAllowed }));
							break;
					}
				} else if (authenticated && rateLimited) {
					// Alert API user that they are doing this too often
					requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.TooManyRequests), { status: Status.TooManyRequests }));
				} else {
					// Alert API user that they shouldn't be doing this
					requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden }));
				}
			}
		})();
	}
};

export default { start };
