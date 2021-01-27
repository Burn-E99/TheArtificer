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
	cache,
	MessageContent
} from "https://deno.land/x/discordeno@10.0.0/mod.ts";

import { serve } from "https://deno.land/std@0.83.0/http/server.ts";
import { Status, STATUS_TEXT } from "https://deno.land/std@0.83.0/http/http_status.ts";

import { Client } from "https://deno.land/x/mysql@v2.7.0/mod.ts";

import { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";

import utils from "./src/utils.ts";
import solver from "./src/solver.ts";

import { EmojiConf } from "./src/mod.d.ts";

import config from "./config.ts";

const dbClient = await new Client().connect({
	hostname: config.db.host,
	port: config.db.port,
	db: config.db.name,
	username: config.db.username,
	password: config.db.password,
});

// Start up the Discord Bot
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

			// [[rollhelp or [[rh or [[hr
			// Help command specifically for the roll command
			else if (command === "rollhelp" || command === "rh" || command === "hr" || command === "??") {
				utils.sendIndirectMessage(message, config.rollhelp.join("\n"), sendMessage, sendDirectMessage).catch(err => {
					console.error("Failed to send message 21", message, err);
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

			// [[roll]]
			// Dice rolling commence!
			else if ((command + args.join("")).indexOf(config.postfix) > -1) {
				// If DEVMODE is on, only allow this command to be used in the devServer
				if (DEVMODE && message.guildID !== config.devServer) {
					utils.sendIndirectMessage(message, "Command is in development, please try again later.", sendMessage, sendDirectMessage).catch(err => {
						console.error("Failed to send message 70", message, err);
					});
					return;
				}

				// Rest of this command is in a try-catch to protect all sends/edits from erroring out
				try {
					const originalCommand = config.prefix + command + " " + args.join(" ");

					const m = await utils.sendIndirectMessage(message, "Rolling...", sendMessage, sendDirectMessage);

					const modifiers = {
						noDetails: false,
						spoiler: "",
						maxRoll: false,
						nominalRoll: false,
						gmRoll: false,
						gms: <string[]>[],
						order: ""
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

									if (config.logRolls) {
										// If enabled, log rolls so we can verify the bots math
										dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,0,1)", [originalCommand, "NoGMsFound", m.id]).catch(e => {
											console.log("Failed to insert into database 00", e);
										});
									}
									return;
								}

								args.splice(i, 1);
								i--;
								break;
							case "-o":
								args.splice(i, 1);

								if (args[i].toLowerCase() !== "d" && args[i].toLowerCase() !== "a") {
									// If -o is on and asc or desc was not specified, error out
									m.edit("Error: Must specifiy a or d to order the rolls ascending or descending");

									if (config.logRolls) {
										// If enabled, log rolls so we can verify the bots math
										dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,0,1)", [originalCommand, "NoOrderFound", m.id]).catch(e => {
											console.log("Failed to insert into database 05", e);
										});
									}
									return;
								}

								modifiers.order = args[i].toLowerCase();

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

						if (config.logRolls) {
							// If enabled, log rolls so we can verify the bots math
							dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,0,1)", [originalCommand, "MaxAndNominal", m.id]).catch(e => {
								console.log("Failed to insert into database 01", e);
							});
						}
						return;
					}

					// Rejoin all of the args and send it into the solver, if solver returns a falsy item, an error object will be substituded in
					const rollCmd = command + " " + args.join(" ");
					const returnmsg = solver.parseRoll(rollCmd, config.prefix, config.postfix, modifiers.maxRoll, modifiers.nominalRoll, modifiers.order) || { error: true, errorCode: "EmptyMessage", errorMsg: "Error: Empty message", line1: "", line2: "", line3: "" };

					let returnText = "";

					// If there was an error, report it to the user in hopes that they can determine what they did wrong
					if (returnmsg.error) {
						returnText = returnmsg.errorMsg;
						m.edit(returnText);

						if (config.logRolls) {
							// If enabled, log rolls so we can verify the bots math
							dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,0,1)", [originalCommand, returnmsg.errorCode, m.id]).catch(e => {
								console.log("Failed to insert into database 02", e);
							});
						}
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
							// If its too big, collapse it into a .txt file and send that instead.
							const b = await new Blob([returnText as BlobPart], {"type": "text"});
							
							// Update return text
							returnText = "<@" + message.author.id + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nFull details have been attached to this messaged as a `.txt` file for verification purposes.";

							// Attempt to DM the GMs and send a warning if it could not DM a GM
							await sendDirectMessage(e.substr(2, (e.length - 3)), {"content": returnText, "file": {"blob": b, "name": "rollDetails.txt"}}).catch(() => {
								utils.sendIndirectMessage(message, "WARNING: " + e + " could not be messaged.  If this issue persists, make sure direct messages are allowed from this server.", sendMessage, sendDirectMessage);
							});
						});

						// Finally send the text
						m.edit(normalText);

						if (config.logRolls) {
							// If enabled, log rolls so we can verify the bots math
							dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,0,0)", [originalCommand, returnText, m.id]).catch(e => {
								console.log("Failed to insert into database 03", e);
							});
						}
					} else {
						// When not a GM roll, make sure the message is not too big
						if (returnText.length > 2000) {
							// If its too big, collapse it into a .txt file and send that instead.
							const b = await new Blob([returnText as BlobPart], {"type": "text"});

							// Update return text
							returnText = "<@" + message.author.id + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nDetails have been ommitted from this message for being over 2000 characters.  Full details have been attached to this messaged as a `.txt` file for verification purposes.";

							// Remove the original message to send new one with attachment
							m.delete();

							await utils.sendIndirectMessage(message, {"content": returnText, "file": {"blob": b, "name": "rollDetails.txt"}}, sendMessage, sendDirectMessage);
						} else {
							// Finally send the text
							m.edit(returnText);
						}

						if (config.logRolls) {
							// If enabled, log rolls so we can verify the bots math
							dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,0,0)", [originalCommand, returnText, m.id]).catch(e => {
								console.log("Failed to insert into database 04", e);
							});
						}
					}
				} catch (err) {
					console.error("Something failed 71");
				}
			}

			// [[emoji or [[emojialias
			// Check if the unhandled command is an emoji request
			else {
				// Start looping thru the possible emojis
				config.emojis.some((e: EmojiConf) => {
					// If a match gets found
					if (e.aliases.indexOf(command || "") > -1) {
						// Send the needed emoji
						utils.sendIndirectMessage(message, `<${e.animated ? "a" : ""}:${e.name}:${e.id}>`, sendMessage, sendDirectMessage).catch(err => {
							console.error("Failed to send message 40", message, err);
						});
						// And attempt to delete if needed
						if (e.deleteSender) {
							message.delete().catch(err => {
								console.error("Failed to delete message 41", message, err);
							});
						}
						return true;
					}
				});
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
	console.log(`HTTP api running at: http://localhost:${config.api.port}/`);

	// rateLimitTime holds all users with the last time they started a rate limit timer
	const rateLimitTime = new Map<string, number>();
	// rateLimitCnt holds the number of times the user has called the api in the current rate limit timer
	const rateLimitCnt = new Map<string, number>();

	// Catching every request made to the server
	for await (const request of server) {
		// Check if user is authenticated to be using this API
		let authenticated = false;
		let rateLimited = false;
		let updateRateLimitTime = false;
		let apiUserid = 0n;
		let apiUseridStr = "";

		// Check the requests API key
		if (request.headers.has("X-Api-Key")) {
			// Get the userid and flags for the specific key
			const dbApiQuery = await dbClient.query("SELECT userid FROM all_keys WHERE apiKey = ? AND active = 1 AND banned = 0", [request.headers.get("X-Api-Key")]);

			// If only one user returned, is not banned, and is currently active, mark as authenticated
			if (dbApiQuery.length === 1) {
				apiUserid = dbApiQuery[0].userid;
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
				tempQ.split("&").forEach(e => {
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
								if (apiUserid === config.api.admin && apiUserid === BigInt(query.get("a"))) {
									// Generate new secure key
									const newKey = await nanoid(25);

									// Flag to see if there is an error inside the catch
									let erroredOut = false;

									// Insert new key/user pair into the db
									await dbClient.execute("INSERT INTO all_keys(userid,apiKey) values(?,?)", [BigInt(query.get("user")), newKey]).catch(e => {
										console.log("Failed to insert into database 20");
										request.respond({ status: Status.InternalServerError, body: STATUS_TEXT.get(Status.InternalServerError) });
										erroredOut = true;
									});

									// Exit this case now if catch errored
									if (erroredOut) {
										break;
									} else {
										// Send API key as response
										request.respond({ status: Status.OK, body: JSON.stringify({ "key": newKey, "userid": query.get("user") }) });
										break;
									}
								} else {
									// Only allow the db admin to use this API
									request.respond({ status: Status.Forbidden, body: STATUS_TEXT.get(Status.Forbidden) });
								}
							} else {
								// Alert API user that they messed up
								request.respond({ status: Status.BadRequest, body: STATUS_TEXT.get(Status.BadRequest) });
							}
							break;
						case "/api/key/ban":
						case "/api/key/ban/":
						case "/api/key/unban":
						case "/api/key/unban/":
						case "/api/key/activate":
						case "/api/key/activate/":
						case "/api/key/deactivate":
						case "/api/key/deactivate/":
							if ((query.has("a") && ((query.get("a") || "").length > 0)) && (query.has("user") && ((query.get("user") || "").length > 0))) {
								if (apiUserid === config.api.admin && apiUserid === BigInt(query.get("a"))) {
									// Flag to see if there is an error inside the catch
									let key,value,erroredOut = false;

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
									await dbClient.execute("UPDATE all_keys SET ?? = ? WHERE userid = ?", [key, value, BigInt(query.get("user"))]).catch(e => {
										console.log("Failed to update database 28");
										request.respond({ status: Status.InternalServerError, body: STATUS_TEXT.get(Status.InternalServerError) });
										erroredOut = true;
									});

									// Exit this case now if catch errored
									if (erroredOut) {
										break;
									} else {
										// Send API key as response
										request.respond({ status: Status.OK, body: STATUS_TEXT.get(Status.OK) });
										break;
									}
								} else {
									// Alert API user that they shouldn't be doing this
									request.respond({ status: Status.Forbidden, body: STATUS_TEXT.get(Status.Forbidden) });
								}
							} else {
								// Alert API user that they messed up
								request.respond({ status: Status.BadRequest, body: STATUS_TEXT.get(Status.BadRequest) });
							}
							break;
						case "/api/channel":
						case "/api/channel/":
							if (query.has("user") && ((query.get("user") || "").length > 0)) {
								if (apiUserid === BigInt(query.get("user"))) {
									// Flag to see if there is an error inside the catch
									let erroredOut = false;

									// Get all channels userid has authorized
									const dbAllowedChannelQuery = await dbClient.query("SELECT * FROM allowed_channels WHERE userid = ?", [BigInt(query.get("user"))]).catch(e => {
										console.log("Failed to query database 22");
										request.respond({ status: Status.InternalServerError, body: STATUS_TEXT.get(Status.InternalServerError) });
										erroredOut = true;
									});

									if (erroredOut) {
										break;
									} else {
										// Customized strinification to handle BigInts correctly
										const returnChannels = JSON.stringify(dbAllowedChannelQuery, (_key, value) => (typeof value === 'bigint' ? value.toString() : value));
										// Send API key as response
										request.respond({ status: Status.OK, body: returnChannels });
										break;
									}
								} else {
									// Alert API user that they shouldn't be doing this
									request.respond({ status: Status.Forbidden, body: STATUS_TEXT.get(Status.Forbidden) });
								}
							} else {
								// Alert API user that they messed up
								request.respond({ status: Status.BadRequest, body: STATUS_TEXT.get(Status.BadRequest) });
							}
							break;
						case "/api/channel/add":
						case "/api/channel/add/":
							if ((query.has("user") && ((query.get("user") || "").length > 0)) && (query.has("channel") && ((query.get("channel") || "").length > 0))) {
								if (apiUserid === BigInt(query.get("user"))) {
									// Flag to see if there is an error inside the catch
									let erroredOut = false;

									// Insert new user/channel pair into the db
									await dbClient.execute("INSERT INTO allowed_channels(userid,channelid) values(?,?)", [BigInt(query.get("user")), BigInt(query.get("channel"))]).catch(e => {
										console.log("Failed to insert into database 21");
										request.respond({ status: Status.InternalServerError, body: STATUS_TEXT.get(Status.InternalServerError) });
										erroredOut = true;
									});

									// Exit this case now if catch errored
									if (erroredOut) {
										break;
									} else {
										// Send API key as response
										request.respond({ status: Status.OK, body: STATUS_TEXT.get(Status.OK) });
										break;
									}
								} else {
									// Alert API user that they shouldn't be doing this
									request.respond({ status: Status.Forbidden, body: STATUS_TEXT.get(Status.Forbidden) });
								}
							} else {
								// Alert API user that they messed up
								request.respond({ status: Status.BadRequest, body: STATUS_TEXT.get(Status.BadRequest) });
							}
							break;
						case "/api/channel/ban":
						case "/api/channel/ban/":
						case "/api/channel/unban":
						case "/api/channel/unban/":
							if ((query.has("a") && ((query.get("a") || "").length > 0)) && (query.has("channel") && ((query.get("channel") || "").length > 0)) && (query.has("user") && ((query.get("user") || "").length > 0))) {
								if (apiUserid === config.api.admin && apiUserid === BigInt(query.get("a"))) {
									// Flag to see if there is an error inside the catch
									let value,erroredOut = false;

									// Determine value to set
									if (path.toLowerCase().indexOf("un") > 0) {
										value = 0;
									} else {
										value = 1;
									}

									// Execute the DB modification
									await dbClient.execute("UPDATE allowed_channels SET banned = ? WHERE userid = ? AND channelid = ?", [value, BigInt(query.get("user")), BigInt(query.get("channel"))]).catch(e => {
										console.log("Failed to update database 24");
										request.respond({ status: Status.InternalServerError, body: STATUS_TEXT.get(Status.InternalServerError) });
										erroredOut = true;
									});

									// Exit this case now if catch errored
									if (erroredOut) {
										break;
									} else {
										// Send API key as response
										request.respond({ status: Status.OK, body: STATUS_TEXT.get(Status.OK) });
										break;
									}
								} else {
									// Alert API user that they shouldn't be doing this
									request.respond({ status: Status.Forbidden, body: STATUS_TEXT.get(Status.Forbidden) });
								}
							} else {
								// Alert API user that they messed up
								request.respond({ status: Status.BadRequest, body: STATUS_TEXT.get(Status.BadRequest) });
							}
							break;
						case "/api/channel/activate":
						case "/api/channel/activate/":
						case "/api/channel/deactivate":
						case "/api/channel/deactivate/":
							if ((query.has("channel") && ((query.get("channel") || "").length > 0)) && (query.has("user") && ((query.get("user") || "").length > 0))) {
								if (apiUserid === BigInt(query.get("user"))) {
									// Flag to see if there is an error inside the catch
									let value,erroredOut = false;

									// Determine value to set
									if (path.toLowerCase().indexOf("de") > 0) {
										value = 0;
									} else {
										value = 1;
									}

									// Update the requested entry
									await dbClient.execute("UPDATE allowed_channels SET active = ? WHERE userid = ? AND channelid = ?", [value, BigInt(query.get("user")), BigInt(query.get("channel"))]).catch(e => {
										console.log("Failed to update database 26");
										request.respond({ status: Status.InternalServerError, body: STATUS_TEXT.get(Status.InternalServerError) });
										erroredOut = true;
									});

									// Exit this case now if catch errored
									if (erroredOut) {
										break;
									} else {
										// Send API key as response
										request.respond({ status: Status.OK, body: STATUS_TEXT.get(Status.OK) });
										break;
									}
								} else {
									// Alert API user that they shouldn't be doing this
									request.respond({ status: Status.Forbidden, body: STATUS_TEXT.get(Status.Forbidden) });
								}
							} else {
								// Alert API user that they messed up
								request.respond({ status: Status.BadRequest, body: STATUS_TEXT.get(Status.BadRequest) });
							}
							break;
						case "/api/roll":
						case "/api/roll/":
							// Make sure query contains all the needed parts
							if ((query.has("rollstr") && ((query.get("rollstr") || "").length > 0)) && (query.has("channel") && ((query.get("channel") || "").length > 0)) && (query.has("user") && ((query.get("user") || "").length > 0))) {
								if (query.has("n") && query.has("m")) {
									// Alert API user that they shouldn't be doing this
									request.respond({ status: Status.BadRequest, body: STATUS_TEXT.get(Status.BadRequest) });
									break;
								}

								// Check if user is authenticated to use this endpoint
								let authorized = false;

								// Check if the db has the requested userid/channelid combo, and that the requested userid matches the userid linked with the api key
								const dbChannelQuery = await dbClient.query("SELECT active, banned FROM allowed_channels WHERE userid = ? AND channelid = ?", [BigInt(query.get("user")), BigInt(query.get("channel"))])
								if (dbChannelQuery.length === 1 && (apiUserid === BigInt(query.get("user"))) && dbChannelQuery[0].active && !dbChannelQuery[0].banned) {
									authorized = true;
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
											request.respond({ status: Status.BadRequest, body: STATUS_TEXT.get(Status.BadRequest) });

											// Always log API rolls for abuse detection
											dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,1,1)", [originalCommand, "EmptyInput", null]).catch(e => {
												console.log("Failed to insert into database 10", e);
											});
											break;
										}

										if (query.has("o") && (query.get("o")?.toLowerCase() !== "d" && query.get("o")?.toLowerCase() !== "a")) {
											// Alert API user that they messed up
											request.respond({ status: Status.BadRequest, body: STATUS_TEXT.get(Status.BadRequest) });

											// Always log API rolls for abuse detection
											dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,1,1)", [originalCommand, "BadOrder", null]).catch(e => {
												console.log("Failed to insert into database 10", e);
											});
											break;
										}

										// Clip off the leading prefix.  API calls must be formatted with a prefix at the start to match how commands are sent in Discord
										rollCmd = rollCmd.substr(rollCmd.indexOf(config.prefix) + 2).replace(/%20/g, " ");

										// Parse the roll and get the return text
										const returnmsg = solver.parseRoll(rollCmd, config.prefix, config.postfix, query.has("m"), query.has("n"), query.has("o") ? (query.get("o")?.toLowerCase() || "") : "");

										// Alert users why this message just appeared and how they can report abues pf this feature
										const apiPrefix = "The following roll was conducted using my built in API.  If someone in this channel did not request this roll, please report API abuse here: <" + config.api.supportURL + ">\n\n";
										let m, returnText = "";

										// Handle sending the error message to whoever called the api
										if (returnmsg.error) {
											request.respond({ status: Status.InternalServerError, body: returnmsg.errorMsg });

											// Always log API rolls for abuse detection
											dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,1,1)", [originalCommand, returnmsg.errorCode, null]).catch(e => {
												console.log("Failed to insert into database 11", e);
											});
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

												// Always log API rolls for abuse detection
												dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,1,1)", [originalCommand, "NoGMsSent", null]).catch(e => {
													console.log("Failed to insert into database 12", e);
												});
												break;
											}

											// Make a new return line to be sent to the roller
											let normalText = apiPrefix + "<@" + query.get("user") + ">" + returnmsg.line1 + "\nResults have been messaged to the following GMs: ";
											gms.forEach(e => {
												normalText += "<@" + e + "> ";
											});

											// Send the return message as a DM or normal message depening on if the channel is set
											if ((query.get("channel") || "").length > 0) {
												m = await sendMessage(query.get("channel") || "", normalText).catch(() => {
													request.respond({ status: Status.InternalServerError, body: "Message 00 failed to send." });
													errorOut = true;
												});
											} else {
												m = await sendDirectMessage(query.get("user") || "", normalText).catch(() => {
													request.respond({ status: Status.InternalServerError, body: "Message 01 failed to send." });
													errorOut = true;
												});
											}

											// And message the full details to each of the GMs, alerting roller of every GM that could not be messaged
											gms.forEach(async e => {
												// If its too big, collapse it into a .txt file and send that instead.
												const b = await new Blob([returnText as BlobPart], {"type": "text"});
												
												// Update return text
												returnText = apiPrefix + "<@" + query.get("user") + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nFull details have been attached to this messaged as a `.txt` file for verification purposes.";

												// Attempt to DM the GMs and send a warning if it could not DM a GM
												await sendDirectMessage(e, {"content": returnText, "file": {"blob": b, "name": "rollDetails.txt"}}).catch(async () => {
													const failedSend = "WARNING: <@" + e + "> could not be messaged.  If this issue persists, make sure direct messages are allowed from this server."
													// Send the return message as a DM or normal message depening on if the channel is set
													if ((query.get("channel") || "").length > 0) {
														m = await sendMessage(query.get("channel") || "", failedSend).catch(() => {
															request.respond({ status: Status.InternalServerError, body: "Message 10 failed to send." });
															errorOut = true;
														});
													} else {
														m = await sendDirectMessage(query.get("user") || "", failedSend).catch(() => {
															request.respond({ status: Status.InternalServerError, body: "Message 11 failed to send." });
															errorOut = true;
														});
													}
												});
											});

											// Always log API rolls for abuse detection
											dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,1,0)", [originalCommand, returnText, ((typeof m === "object") ? m.id : null)]).catch(e => {
												console.log("Failed to insert into database 13", e);
											});

											// Handle closing the request out
											if (errorOut) {
												break;
											} else {
												request.respond({ status: Status.OK, body: normalText });
												break;
											}
										} else {
											const newMessage : MessageContent= {};
											newMessage.content = returnText;

											// When not a GM roll, make sure the message is not too big
											if (returnText.length > 2000) {
												// If its too big, collapse it into a .txt file and send that instead.
												const b = await new Blob([returnText as BlobPart], {"type": "text"});

												// Update return text
												returnText = "<@" + query.get("user") + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nDetails have been ommitted from this message for being over 2000 characters.  Full details have been attached to this messaged as a `.txt` file for verification purposes.";

												// Set info into the newMessage
												newMessage.content = returnText;
												newMessage.file = {"blob": b, "name": "rollDetails.txt"};
											}

											// Send the return message as a DM or normal message depening on if the channel is set
											if ((query.get("channel") || "").length > 0) {
												m = await sendMessage(query.get("channel") || "", newMessage).catch(() => {
													request.respond({ status: Status.InternalServerError, body: "Message 20 failed to send." });
													errorOut = true;
												});
											} else {
												m = await sendDirectMessage(query.get("user") || "", newMessage).catch(() => {
													request.respond({ status: Status.InternalServerError, body: "Message 21 failed to send." });
													errorOut = true;
												});
											}

											// If enabled, log rolls so we can verify the bots math
											dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,1,0)", [originalCommand, returnText, ((typeof m === "object") ? m.id : null)]).catch(e => {
												console.log("Failed to insert into database 14", e);
											});

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

			if (updateRateLimitTime) {
				const apiTimeNow = new Date().getTime();
				rateLimitTime.set(apiUseridStr, apiTimeNow);
			}
		} else if (authenticated && rateLimited) {
			// Alert API user that they are doing this too often
			request.respond({ status: Status.TooManyRequests, body: STATUS_TEXT.get(Status.TooManyRequests) });
		} else {
			// Alert API user that they shouldn't be doing this
			request.respond({ status: Status.Forbidden, body: STATUS_TEXT.get(Status.Forbidden) });
		}
	}
}
