/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

// DEVMODE is to prevent users from accessing parts of the bot that are currently broken
const DEVMODE = false;
// DEBUG is used to toggle the cmdPrompt
const DEBUG = true;

import {
	startBot, editBotsStatus,
	Intents, StatusTypes, ActivityType,
	Message, Guild, sendMessage, sendDirectMessage,
	cache
} from "https://deno.land/x/discordeno@10.0.0/mod.ts";
import { serve } from "https://deno.land/std@0.83.0/http/server.ts";
import { Status, STATUS_TEXT } from "https://deno.land/std@0.83.0/http/http_status.ts";

import utils from "./src/utils.ts";
import solver from "./src/solver.ts";

import config from "./config.ts";

startBot({
	token: config.token,
	intents: [Intents.GUILD_MESSAGES, Intents.DIRECT_MESSAGES, Intents.GUILDS],
	eventHandlers: {
		ready: () => {
			console.log("Logged in!");
			editBotsStatus(StatusTypes.Online, `${config.prefix}help for commands`, ActivityType.Game);
			// setTimeout added to make sure the startup message does not error out
			setTimeout(() => {
				sendMessage(config.logChannel, `${config.name} has started, running version ${config.version}.`).catch(() => {
					console.error("Failed to send message 00");
				});
			}, 1000);
		},
		guildCreate: (guild: Guild) => {
			sendMessage(config.logChannel, `New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`).catch(() => {
				console.error("Failed to send message 01");
			});
		},
		guildDelete: (guild: Guild) => {
			sendMessage(config.logChannel, `I have been removed from: ${guild.name} (id: ${guild.id})`).catch(() => {
				console.error("Failed to send message 02");
			});
		},
		debug: (DEVMODE ? console.error : () => { }),
		messageCreate: async (message: Message) => {
			// Ignore all other bots
			if (message.author.bot) return;

			// Ignore all messages that are not commands
			if (message.content.indexOf(config.prefix) !== 0) return;

			// Split into standard command + args format
			const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
			const command = args.shift()?.toLowerCase();

			// All commands below here

			// [[ping
			// Its a ping test, what else do you want.
			if (command === "ping") {
				// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
				try {
					const m = await utils.sendIndirectMessage(message, "Ping?", sendMessage, sendDirectMessage);
					m.edit(`Pong! Latency is ${m.timestamp - message.timestamp}ms.`);
				} catch (err) {
					console.error("Failed to send message 10", message, err);
				}
			}

			// [[rip [[memory
			// Displays a short message I wanted to include
			else if (command === "rip" || command === "memory") {
				utils.sendIndirectMessage(message, "The Artificer was built in memory of my Grandmother, Babka\nWith much love, Ean\n\nDecember 21, 2020", sendMessage, sendDirectMessage).catch(err => {
					console.error("Failed to send message 11", message, err);
				});
			}

			// [[help or [[h or [[?
			// Help command, prints from help file
			else if (command === "help" || command === "h" || command === "?") {
				utils.sendIndirectMessage(message, config.help.join("\n"), sendMessage, sendDirectMessage).catch(err => {
					console.error("Failed to send message 20", message, err);
				});
			}

			// [[version or [[v
			// Returns version of the bot
			else if (command === "version" || command === "v") {
				utils.sendIndirectMessage(message, `My current version is ${config.version}.`, sendMessage, sendDirectMessage).catch(err => {
					console.error("Failed to send message 30", message, err);
				});
			}

			// [[popcat or [[pop or [[p
			// popcat animated emoji
			else if (command === "popcat" || command === "pop" || command === "p") {
				utils.sendIndirectMessage(message, `<${config.emojis.popcat.animated ? "a" : ""}:${config.emojis.popcat.name}:${config.emojis.popcat.id}>`, sendMessage, sendDirectMessage).catch(err => {
					console.error("Failed to send message 40", message, err);
				});
				message.delete().catch(err => {
					console.error("Failed to delete message 41", message, err);
				});
			}

			// [[report or [[r (command that failed)
			// Manually report a failed roll
			else if (command === "report" || command === "r") {
				sendMessage(config.reportChannel, ("USER REPORT:\n" + args.join(" "))).catch(err => {
					console.error("Failed to send message 50", message, err);
				});
				utils.sendIndirectMessage(message, "Failed command has been reported to my developer.", sendMessage, sendDirectMessage).catch(err => {
					console.error("Failed to send message 51", message, err);
				});
			}

			// [[stats or [[s
			// Displays stats on the bot
			else if (command === "stats" || command === "s") {
				utils.sendIndirectMessage(message, `${config.name} is rolling dice for ${cache.members.size} users, in ${cache.channels.size} channels of ${cache.guilds.size} servers.`, sendMessage, sendDirectMessage).catch(err => {
					console.error("Failed to send message 60", message, err);
				});
			}

			// [[
			// Dice rolling commence!
			else {
				// If DEVMODE is on, only allow this command to be used in the devServer
				if (DEVMODE && message.guildID !== config.devServer) {
					utils.sendIndirectMessage(message, "Command is in development, please try again later.", sendMessage, sendDirectMessage).catch(err => {
						console.error("Failed to send message 70", message, err);
					});
					return;
				}

				// Rest of this command is in a try-catch to protect all sends/edits from erroring out
				try {
					const m = await utils.sendIndirectMessage(message, "Rolling...", sendMessage, sendDirectMessage);

					const modifiers = {
						noDetails: false,
						spoiler: "",
						maxRoll: false,
						nominalRoll: false,
						gmRoll: false,
						gms: <string[]>[]
					};

					// Check if any of the args are command flags and pull those out into the modifiers object
					for (let i = 0; i < args.length; i++) {
						switch (args[i].toLowerCase()) {
							case "-nd":
								modifiers.noDetails = true;

								args.splice(i, 1);
								i--;
								break;
							case "-s":
								modifiers.spoiler = "||";

								args.splice(i, 1);
								i--;
								break;
							case "-m":
								modifiers.maxRoll = true;

								args.splice(i, 1);
								i--;
								break;
							case "-n":
								modifiers.nominalRoll = true;

								args.splice(i, 1);
								i--;
								break;
							case "-gm":
								modifiers.gmRoll = true;

								// -gm is a little more complex, as we must get all of the GMs that need to be DMd
								while (((i + 1) < args.length) && args[i + 1].startsWith("<@")) {
									// Keep looping thru the rest of the args until one does not start with the discord mention code
									modifiers.gms.push(args[i + 1].replace(/[!]/g, ""));
									args.splice((i + 1), 1);
								}
								if (modifiers.gms.length < 1) {
									// If -gm is on and none were found, throw an error
									m.edit("Error: Must specifiy at least one GM by mentioning them");
									return;
								}

								args.splice(i, 1);
								i--;
								break;
							default:
								break;
						}
					}

					// maxRoll and nominalRoll cannot both be on, throw an error
					if (modifiers.maxRoll && modifiers.nominalRoll) {
						m.edit("Error: Cannot maximise and nominise the roll at the same time");
						return;
					}

					// Rejoin all of the args and send it into the solver, if solver returns a falsy item, an error object will be substituded in
					const rollCmd = command + " " + args.join(" ");
					const returnmsg = solver.parseRoll(rollCmd, config.prefix, config.postfix, modifiers.maxRoll, modifiers.nominalRoll) || { error: true, errorMsg: "Error: Empty message", line1: "", line2: "", line3: "" };

					let returnText = "";

					// If there was an error, report it to the user in hopes that they can determine what they did wrong
					if (returnmsg.error) {
						returnText = returnmsg.errorMsg;
						m.edit(returnText);
						return;
					} else {
						// Else format the output using details from the solver
						returnText = "<@" + message.author.id + ">" + returnmsg.line1 + "\n" + returnmsg.line2;

						if (modifiers.noDetails) {
							returnText += "\nDetails suppressed by -nd flag.";
						} else {
							returnText += "\nDetails:\n" + modifiers.spoiler + returnmsg.line3 + modifiers.spoiler;
						}
					}

					// If the roll was a GM roll, send DMs to all the GMs
					if (modifiers.gmRoll) {
						// Make a new return line to be sent to the roller
						const normalText = "<@" + message.author.id + ">" + returnmsg.line1 + "\nResults have been messaged to the following GMs: " + modifiers.gms.join(" ");

						// And message the full details to each of the GMs, alerting roller of every GM that could not be messaged
						modifiers.gms.forEach(async e => {
							const msgs = utils.split2k(returnText);
							const failedDMs = <string[]>[];
							for (let i = 0; ((failedDMs.indexOf(e) === -1) && (i < msgs.length)); i++) {
								await sendDirectMessage(e.substr(2, (e.length - 3)), msgs[i]).catch(() => {
									failedDMs.push(e);
									utils.sendIndirectMessage(message, "WARNING: " + e + " could not be messaged.  If this issue persists, make sure direct messages are allowed from this server.", sendMessage, sendDirectMessage);
								});
							}
						});

						// Finally send the text
						m.edit(normalText);
					} else {
						// When not a GM roll, make sure the message is not too big
						if (returnText.length > 2000) {
							// If its too big, attempt to DM details to the roller
							const msgs = utils.split2k(returnText);
							let failed = false;
							for (let i = 0; (!failed && (i < msgs.length)); i++) {
								await sendDirectMessage(message.author.id, msgs[i]).catch(() => {
									failed = true;
								});
							}

							// If DM fails to send, alert roller of the failure, else handle normally
							if (failed) {
								returnText = "<@" + message.author.id + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nDetails have been ommitted from this message for being over 2000 characters.  WARNING: <@" + message.author.id + "> could **NOT** be messaged full details for verification purposes.";
							} else {
								returnText = "<@" + message.author.id + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nDetails have been ommitted from this message for being over 2000 characters.  Full details have been messaged to <@" + message.author.id + "> for verification purposes.";
							}
						}

						// Finally send the text
						m.edit(returnText);
					}
				} catch (err) {
					console.error("Something failed 71");
				}
			}
		}
	}
});

// Start up the command prompt for debug usage
if (DEBUG) {
	utils.cmdPrompt(config.logChannel, config.name, sendMessage);
}

// Start up the API for rolling from third party apps (like excel macros)
if (config.api.enable) {
	const server = serve({ hostname: "0.0.0.0", port: config.api.port });
	console.log(`HTTP webserver running at: http://localhost:${config.api.port}/`);

	// Catching every request made to the server
	for await (const request of server) {

		// Super secure authentication
		const authenticated = true;

		if (authenticated) {
			// Get path and query as a string
			const [path, tempQ] = request.url.split("?");

			// Turn the query into a map (if it exists)
			const query = new Map<string, string>();
			if (tempQ !== undefined) {
				tempQ.split("&").forEach(e => {
					const [option, params] = e.split("=");
					query.set(option.toLowerCase(), params);
				});
			}

			// Handle the request
			switch (request.method) {
				case "GET":
					switch (path) {
						case "/roll":
						case "/roll/":
							// Make sure query contains all the needed parts
							if (query.has("rollstr") && query.has("channel") && query.has("user")) {

								if (query.has("n") && query.has("m")) {
									// Alert API user that they shouldn't be doing this
									request.respond({ status: Status.BadRequest, body: STATUS_TEXT.get(Status.BadRequest) });
									break;
								}

								// Super secure authorization
								const authorized = true;

								if (authorized) {
									// Rest of this command is in a try-catch to protect all sends/edits from erroring out
									try {
										// Flag to tell if roll was completely successful
										let errorOut = false;
										// Make sure rollCmd is not undefined
										let rollCmd = query.get("rollstr") || "";

										if (rollCmd.length === 0) {
											// Alert API user that they messed up
											request.respond({ status: Status.BadRequest, body: STATUS_TEXT.get(Status.BadRequest) });
											break;
										}

										// Clip off the leading prefix.  API calls must be formatted with a prefix at the start to match how commands are sent in Discord
										rollCmd = rollCmd.substr(rollCmd.indexOf(config.prefix) + 2).replace(/%20/g, " ");

										// Parse the roll and get the return text
										const returnmsg = solver.parseRoll(rollCmd, config.prefix, config.postfix, query.has("m"), query.has("n"));

										// Alert users why this message just appeared and how they can report abues pf this feature
										const apiPrefix = "The following roll was conducted using my built in API.  If someone in this channel did not request this roll, please report API abuse here: <" + config.api.supportURL + ">\n\n";
										let returnText = "";

										// Handle sending the error message to whoever called the api
										if (returnmsg.error) {
											request.respond({ status: Status.InternalServerError, body: returnmsg.errorMsg });
											break;
										} else {
											returnText = apiPrefix + "<@" + query.get("user") + ">" + returnmsg.line1 + "\n" + returnmsg.line2;
											let spoilerTxt = "";

											// Determine if spoiler flag was on
											if (query.has("s")) {
												spoilerTxt = "||";
											}

											// Determine if no details flag was on
											if (query.has("nd")) {
												returnText += "\nDetails suppressed by nd query.";
											} else {
												returnText += "\nDetails:\n" + spoilerTxt + returnmsg.line3 + spoilerTxt;
											}
										}

										// If the roll was a GM roll, send DMs to all the GMs
										if (query.has("gms")) {
											// Get all the GM user IDs from the query
											const gms = (query.get("gms") || "").split(",");
											if (gms.length === 0) {
												// Alert API user that they messed up
												request.respond({ status: Status.BadRequest, body: STATUS_TEXT.get(Status.BadRequest) });
												break;
											}

											// Make a new return line to be sent to the roller
											let normalText = apiPrefix + "<@" + query.get("user") + ">" + returnmsg.line1 + "\nResults have been messaged to the following GMs: ";
											gms.forEach(e => {
												normalText += "<@" + e + "> ";
											});

											// Send the return message as a DM or normal message depening on if the channel is set
											if ((query.get("channel") || "").length > 0) {
												await sendMessage(query.get("channel") || "", normalText).catch(() => {
													request.respond({ status: Status.InternalServerError, body: "Message 00 failed to send." });
													errorOut = true;
												});
											} else {
												await sendDirectMessage(query.get("user") || "", normalText).catch(() => {
													request.respond({ status: Status.InternalServerError, body: "Message 01 failed to send." });
													errorOut = true;
												});
											}

											// And message the full details to each of the GMs, alerting roller of every GM that could not be messaged
											gms.forEach(async e => {
												const msgs = utils.split2k(returnText);
												const failedDMs = <string[]>[];
												for (let i = 0; ((failedDMs.indexOf(e) === -1) && (i < msgs.length)); i++) {
													await sendDirectMessage(e, msgs[i]).catch( async () => {
														failedDMs.push(e);
														const failedSend = "WARNING: <@" + e + "> could not be messaged.  If this issue persists, make sure direct messages are allowed from this server."
														// Send the return message as a DM or normal message depening on if the channel is set
														if ((query.get("channel") || "").length > 0) {
															await sendMessage(query.get("channel") || "", failedSend).catch(() => {
																request.respond({ status: Status.InternalServerError, body: "Message 10 failed to send." });
																errorOut = true;
															});
														} else {
															await sendDirectMessage(query.get("user") || "", failedSend).catch(() => {
																request.respond({ status: Status.InternalServerError, body: "Message 11 failed to send." });
																errorOut = true;
															});
														}
													});
												}
											});

											// Handle closing the request out
											if (errorOut) {
												break;
											} else {
												request.respond({ status: Status.OK, body: normalText });
												break;
											}
										} else {
											// When not a GM roll, make sure the message is not too big
											if (returnText.length > 2000) {
												// If its too big, attempt to DM details to the roller
												const msgs = utils.split2k(returnText);
												let failed = false;
												for (let i = 0; (!failed && (i < msgs.length)); i++) {
													await sendDirectMessage(query.get("user") || "", msgs[i]).catch(() => {
														failed = true;
													});
												}

												// If DM fails to send, alert roller of the failure, else handle normally
												if (failed) {
													returnText = apiPrefix + "<@" + query.get("user") + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nDetails have been ommitted from this message for being over 2000 characters.  WARNING: <@" + query.get("user") + "> could **NOT** be messaged full details for verification purposes.";
												} else {
													returnText = apiPrefix + "<@" + query.get("user") + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nDetails have been ommitted from this message for being over 2000 characters.  Full details have been messaged to <@" + query.get("user") + "> for verification purposes.";
												}
											}

											// Send the return message as a DM or normal message depening on if the channel is set
											if ((query.get("channel") || "").length > 0) {
												await sendMessage(query.get("channel") || "", returnText).catch(() => {
													request.respond({ status: Status.InternalServerError, body: "Message 20 failed to send." });
													errorOut = true;
												});
											} else {
												await sendDirectMessage(query.get("user") || "", returnText).catch(() => {
													request.respond({ status: Status.InternalServerError, body: "Message 21 failed to send." });
													errorOut = true;
												});
											}

											// Handle closing the request out
											if (errorOut) {
												break;
											} else {
												request.respond({ status: Status.OK, body: returnText });
												break;
											}
										}
									} catch (err) {
										// Handle any errors we missed
										console.log(err)
										request.respond({ status: Status.InternalServerError, body: STATUS_TEXT.get(Status.InternalServerError) });
									}
								} else {
									// Alert API user that they messed up
									request.respond({ status: Status.Forbidden, body: STATUS_TEXT.get(Status.Forbidden) });
								}
							} else {
								// Alert API user that they shouldn't be doing this
								request.respond({ status: Status.BadRequest, body: STATUS_TEXT.get(Status.BadRequest) });
							}
							break;
						default:
							// Alert API user that they messed up
							request.respond({ status: Status.NotFound, body: STATUS_TEXT.get(Status.NotFound) });
							break;
					}
					break;
				default:
					// Alert API user that they messed up
					request.respond({ status: Status.MethodNotAllowed, body: STATUS_TEXT.get(Status.MethodNotAllowed) });
					break;
			}
		} else {
			// Alert API user that they shouldn't be doing this
			request.respond({ status: Status.Forbidden, body: STATUS_TEXT.get(Status.Forbidden) });
		}
	}
}
