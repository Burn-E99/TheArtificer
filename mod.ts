/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

import {
	// Discordeno deps
	startBot, editBotsStatus,
	Intents, StatusTypes, ActivityType,
	sendMessage, sendDirectMessage,
	cache, botID,
	memberIDHasPermission,
	Message, Guild,

	// MySQL Driver deps
	Client
} from "./deps.ts";

import api from "./src/api.ts";
import intervals from "./src/intervals.ts";
import utils from "./src/utils.ts";
import solver from "./src/solver.ts";

import { EmojiConf } from "./src/mod.d.ts";
import { LogTypes as LT } from "./src/utils.enums.ts";

import { DEVMODE, DEBUG, LOCALMODE } from "./flags.ts";
import config from "./config.ts";
import longStrs from "./longStrings.ts";

// Initialize DB client
const dbClient = await new Client().connect({
	hostname: LOCALMODE ? config.db.localhost : config.db.host,
	port: config.db.port,
	db: config.db.name,
	username: config.db.username,
	password: config.db.password
});

// Initialize logging client with folder to use for logs, needs --allow-write set on Deno startup
utils.initLog("logs");

// Start up the Discord Bot
startBot({
	token: LOCALMODE ? config.localtoken : config.token,
	intents: [Intents.GUILD_MESSAGES, Intents.DIRECT_MESSAGES, Intents.GUILDS],
	eventHandlers: {
		ready: () => {
			utils.log(LT.INFO, `${config.name} Logged in!`);
			editBotsStatus(StatusTypes.Online, "Booting up . . .", ActivityType.Game);

			// Interval to rotate the status text every 30 seconds to show off more commands
			setInterval(() => {
				utils.log(LT.LOG, "Changing bot status");
				try {
					// Wrapped in try-catch due to hard crash possible
					editBotsStatus(StatusTypes.Online, intervals.getRandomStatus(cache), ActivityType.Game);
				} catch (e) {
					utils.log(LT.ERROR, `Failed to update status: ${JSON.stringify(e)}`);
				}
			}, 30000);

			// Interval to update bot list stats every 24 hours
			LOCALMODE ? utils.log(LT.INFO, "updateListStatistics not running") : setInterval(() => {
				utils.log(LT.LOG, "Updating all bot lists statistics");
				intervals.updateListStatistics(botID, cache.guilds.size);
			}, 86400000);

			// setTimeout added to make sure the startup message does not error out
			setTimeout(() => {
				LOCALMODE ? utils.log(LT.INFO, "updateListStatistics not running") : intervals.updateListStatistics(botID, cache.guilds.size);
				editBotsStatus(StatusTypes.Online, `Boot Complete`, ActivityType.Game);
				sendMessage(config.logChannel, `${config.name} has started, running version ${config.version}.`).catch(e => {
					utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(e)}`);
				});
			}, 1000);
		},
		guildCreate: (guild: Guild) => {
			utils.log(LT.LOG, `Handling joining guild ${JSON.stringify(guild)}`);
			sendMessage(config.logChannel, `New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`).catch(e => {
				utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(e)}`);
			});
		},
		guildDelete: (guild: Guild) => {
			utils.log(LT.LOG, `Handling leaving guild ${JSON.stringify(guild)}`);
			sendMessage(config.logChannel, `I have been removed from: ${guild.name} (id: ${guild.id}).`).catch(e => {
				utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(e)}`);
			});
		},
		debug: dmsg => utils.log(LT.LOG, `${JSON.stringify(dmsg)}`),
		messageCreate: async (message: Message) => {
			// Ignore all other bots
			if (message.author.bot) return;
			
			// Ignore all messages that are not commands
			if (message.content.indexOf(config.prefix) !== 0) return;
			
			utils.log(LT.LOG, `Handling message ${JSON.stringify(message)}`);

			// Split into standard command + args format
			const args = message.content.slice(config.prefix.length).trim().split(/[ \n]+/g);
			const command = args.shift()?.toLowerCase();

			// All commands below here

			// [[ping
			// Its a ping test, what else do you want.
			if (command === "ping") {
				// Light telemetry to see how many times a command is being run
				dbClient.execute(`CALL INC_CNT("ping");`).catch(e => {
					utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
				});

				// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
				try {
					const m = await utils.sendIndirectMessage(message, "Ping?", sendMessage, sendDirectMessage);
					m.edit(`Pong! Latency is ${m.timestamp - message.timestamp}ms.`);
				} catch (e) {
					utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				}
			}

			// [[rip [[memory
			// Displays a short message I wanted to include
			else if (command === "rip" || command === "memory") {
				// Light telemetry to see how many times a command is being run
				dbClient.execute(`CALL INC_CNT("rip");`).catch(e => {
					utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
				});

				utils.sendIndirectMessage(message, "The Artificer was built in memory of my Grandmother, Babka\nWith much love, Ean\n\nDecember 21, 2020", sendMessage, sendDirectMessage).catch(e => {
					utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
			}

			// [[rollhelp or [[rh or [[hr or [[??
			// Help command specifically for the roll command
			else if (command === "rollhelp" || command === "rh" || command === "hr" || command === "??" || command?.startsWith("xdy")) {
				// Light telemetry to see how many times a command is being run
				dbClient.execute(`CALL INC_CNT("rollhelp");`).catch(e => {
					utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
				});

				utils.sendIndirectMessage(message, longStrs.rollhelp.join("\n"), sendMessage, sendDirectMessage).catch(e => {
					utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
			}

			// [[help or [[h or [[?
			// Help command, prints from help file
			else if (command === "help" || command === "h" || command === "?") {
				// Light telemetry to see how many times a command is being run
				dbClient.execute(`CALL INC_CNT("help");`).catch(e => {
					utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
				});

				utils.sendIndirectMessage(message, longStrs.help.join("\n"), sendMessage, sendDirectMessage).catch(e => {
					utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
			}

			// [[info or [[i
			// Info command, prints short desc on bot and some links
			else if (command === "info" || command === "i") {
				// Light telemetry to see how many times a command is being run
				dbClient.execute(`CALL INC_CNT("info");`).catch(e => {
					utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
				});

				utils.sendIndirectMessage(message, longStrs.info.join("\n"), sendMessage, sendDirectMessage).catch(e => {
					utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
			}

			// [[privacy
			// Privacy command, prints short desc on bot's privacy policy
			else if (command === "privacy") {
				// Light telemetry to see how many times a command is being run
				dbClient.execute(`CALL INC_CNT("privacy");`).catch(e => {
					utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
				});

				utils.sendIndirectMessage(message, longStrs.privacy.join("\n"), sendMessage, sendDirectMessage).catch(e => {
					utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
			}

			// [[version or [[v
			// Returns version of the bot
			else if (command === "version" || command === "v") {
				// Light telemetry to see how many times a command is being run
				dbClient.execute(`CALL INC_CNT("version");`).catch(e => {
					utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
				});

				utils.sendIndirectMessage(message, `My current version is ${config.version}.`, sendMessage, sendDirectMessage).catch(e => {
					utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
			}

			// [[report or [[r (command that failed)
			// Manually report a failed roll
			else if (command === "report" || command === "r") {
				// Light telemetry to see how many times a command is being run
				dbClient.execute(`CALL INC_CNT("report");`).catch(e => {
					utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
				});

				sendMessage(config.reportChannel, ("USER REPORT:\n" + args.join(" "))).catch(e => {
					utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
				utils.sendIndirectMessage(message, "Failed command has been reported to my developer.\n\nFor more in depth support, and information about planned maintenance, please join the support server here: https://discord.gg/peHASXMZYv", sendMessage, sendDirectMessage).catch(e => {
					utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
			}

			// [[stats or [[s
			// Displays stats on the bot
			else if (command === "stats" || command === "s") {
				// Light telemetry to see how many times a command is being run
				dbClient.execute(`CALL INC_CNT("stats");`).catch(e => {
					utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
				});

				// Calculate how many times commands have been run
				const rollQuery = await dbClient.query(`SELECT count FROM command_cnt WHERE command = "roll";`).catch(e => {
					utils.log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e)}`);
				});
				const totalQuery = await dbClient.query(`SELECT SUM(count) as count FROM command_cnt;`).catch(e => {
					utils.log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e)}`);
				});
				const rolls = BigInt(rollQuery[0].count);
				const total = BigInt(totalQuery[0].count);

				utils.sendIndirectMessage(message, `${config.name} is rolling dice for ${cache.members.size} active users, in ${cache.channels.size} channels of ${cache.guilds.size} servers.\n\nSo far, ${rolls} dice have been rolled and ${total - rolls} utility commands have been run.`, sendMessage, sendDirectMessage).catch(e => {
					utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
			}

			// [[api arg
			// API sub commands
			else if (command === "api" && args.length > 0) {
				// Light telemetry to see how many times a command is being run
				dbClient.execute(`CALL INC_CNT("api");`).catch(e => {
					utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
				});

				// Local apiArg in lowercase
				const apiArg = args[0].toLowerCase();

				// Alert users who DM the bot that this command is for guilds only
				if (message.guildID === "") {
					utils.sendIndirectMessage(message, `API commands are only available in guilds.`, sendMessage, sendDirectMessage).catch(e => {
						utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
					});
					return;
				}

				// Makes sure the user is authenticated to run the API command
				if (await memberIDHasPermission(message.author.id, message.guildID, ["ADMINISTRATOR"])) {
					// [[api help
					// Shows API help details
					if (apiArg === "help") {
						utils.sendIndirectMessage(message, longStrs.apihelp.join("\n"), sendMessage, sendDirectMessage).catch(e => {
							utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
						});
					}

					// [[api allow/block
					// Lets a guild admin allow or ban API rolls from happening in said guild
					else if (apiArg === "allow" || apiArg === "block" || apiArg === "enable" || apiArg === "disable") {
						const guildQuery = await dbClient.query(`SELECT guildid FROM allowed_guilds WHERE guildid = ?`, [message.guildID]).catch(e0 => {
							utils.log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e0)}`);
							utils.sendIndirectMessage(message, `Failed to ${apiArg} API rolls for this guild.  If this issue persists, please report this to the developers.`, sendMessage, sendDirectMessage).catch(e1 => {
								utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
							});
							return;
						});

						if (guildQuery.length === 0) {
							// Since guild is not in our DB, add it in
							await dbClient.execute(`INSERT INTO allowed_guilds(guildid,active) values(?,?)`, [BigInt(message.guildID), ((apiArg === "allow" || apiArg === "enable") ? 1 : 0)]).catch(e0 => {
								utils.log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e0)}`);
								utils.sendIndirectMessage(message, `Failed to ${apiArg} API rolls for this guild.  If this issue persists, please report this to the developers.`, sendMessage, sendDirectMessage).catch(e1 => {
									utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
								});
								return;
							});
						} else {
							// Since guild is in our DB, update it
							await dbClient.execute(`UPDATE allowed_guilds SET active = ? WHERE guildid = ?`, [((apiArg === "allow" || apiArg === "enable") ? 1 : 0), BigInt(message.guildID)]).catch(e0 => {
								utils.log(LT.ERROR, `Failed to update DB: ${JSON.stringify(e0)}`);
								utils.sendIndirectMessage(message, `Failed to ${apiArg} API rolls for this guild.  If this issue persists, please report this to the developers.`, sendMessage, sendDirectMessage).catch(e1 => {
									utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
								});
								return;
							});
						}
						// We won't get here if there's any errors, so we know it has bee successful, so report as such
						utils.sendIndirectMessage(message, `API rolls have successfully been ${apiArg}ed for this guild.`, sendMessage, sendDirectMessage).catch(e => {
							utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
						});
					}

					// [[api delete
					// Lets a guild admin delete their server from the database
					else if (apiArg === "delete") {
						await dbClient.execute(`DELETE FROM allowed_guilds WHERE guildid = ?`, [message.guildID]).catch(e0 => {
							utils.log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e0)}`);
							utils.sendIndirectMessage(message, `Failed to delete this guild from the database.  If this issue persists, please report this to the developers.`, sendMessage, sendDirectMessage).catch(e1 => {
								utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
							});
							return;
						});

						// We won't get here if there's any errors, so we know it has bee successful, so report as such
						utils.sendIndirectMessage(message, `This guild's API setting has been removed from The Artifier's Database.`, sendMessage, sendDirectMessage).catch(e => {
							utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
						});
					}

					// [[api status
					// Lets a guild admin check the status of API rolling in said guild
					else if (apiArg === "status") {
						// Get status of guild from the db
						const guildQuery = await dbClient.query(`SELECT active, banned FROM allowed_guilds WHERE guildid = ?`, [message.guildID]).catch(e0 => {
							utils.log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e0)}`);
							utils.sendIndirectMessage(message, `Failed to check API rolls status for this guild.  If this issue persists, please report this to the developers.`, sendMessage, sendDirectMessage).catch(e1 => {
								utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e1)}`);
							});
							return;
						});

						// Check if we got an item back or not
						if (guildQuery.length > 0) {
							// Check if guild is banned from using API and return appropriate message
							if (guildQuery[0].banned) {
								utils.sendIndirectMessage(message, `The Artificer's API is ${config.api.enable ? "currently enabled" : "currently disabled"}.\n\nAPI rolls are banned from being used in this guild.  This will not be reversed.`, sendMessage, sendDirectMessage).catch(e => {
									utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
								});
							} else {
								utils.sendIndirectMessage(message, `The Artificer's API is ${config.api.enable ? "currently enabled" : "currently disabled"}.\n\nAPI rolls are ${guildQuery[0].active ? "allowed" : "blocked from being used"} in this guild.`, sendMessage, sendDirectMessage).catch(e => {
									utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
								});
							}
						} else {
							// Guild is not in DB, therefore they are blocked
							utils.sendIndirectMessage(message, `The Artificer's API is ${config.api.enable ? "currently enabled" : "currently disabled"}.\n\nAPI rolls are blocked from being used in this guild.`, sendMessage, sendDirectMessage).catch(e => {
								utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
							});
						}
					}
				} else {
					utils.sendIndirectMessage(message, `API commands are powerful and can only be used by guild Owners and Admins.\n\nFor information on how to use the API, please check the GitHub README for more information: <https://github.com/Burn-E99/TheArtificer>`, sendMessage, sendDirectMessage).catch(e => {
						utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
					});
				}
			}

			// [[roll]]
			// Dice rolling commence!
			else if ((command + args.join("")).indexOf(config.postfix) > -1) {
				// Light telemetry to see how many times a command is being run
				dbClient.execute(`CALL INC_CNT("roll");`).catch(e => {
					utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
				});

				// If DEVMODE is on, only allow this command to be used in the devServer
				if (DEVMODE && message.guildID !== config.devServer) {
					utils.sendIndirectMessage(message, "Command is in development, please try again later.", sendMessage, sendDirectMessage).catch(e => {
						utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
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
						utils.log(LT.LOG, `Checking ${command + args.join(" ")} for command modifiers ${i}`);
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
									utils.log(LT.LOG, `Finding all GMs, checking args ${JSON.stringify(args)}`);
									// Keep looping thru the rest of the args until one does not start with the discord mention code
									modifiers.gms.push(args[i + 1].replace(/[!]/g, ""));
									args.splice((i + 1), 1);
								}
								if (modifiers.gms.length < 1) {
									// If -gm is on and none were found, throw an error
									m.edit("Error: Must specifiy at least one GM by mentioning them");

									if (DEVMODE && config.logRolls) {
										// If enabled, log rolls so we can verify the bots math
										dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,0,1)", [originalCommand, "NoGMsFound", m.id]).catch(e => {
											utils.log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e)}`);
										});
									}
									return;
								}

								args.splice(i, 1);
								i--;
								break;
							case "-o":
								args.splice(i, 1);

								if (args[i].toLowerCase()[0] !== "d" && args[i].toLowerCase()[0] !== "a") {
									// If -o is on and asc or desc was not specified, error out
									m.edit("Error: Must specifiy a or d to order the rolls ascending or descending");

									if (DEVMODE && config.logRolls) {
										// If enabled, log rolls so we can verify the bots math
										dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,0,1)", [originalCommand, "NoOrderFound", m.id]).catch(e => {
											utils.log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e)}`);
										});
									}
									return;
								}

								modifiers.order = args[i].toLowerCase()[0];

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

						if (DEVMODE && config.logRolls) {
							// If enabled, log rolls so we can verify the bots math
							dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,0,1)", [originalCommand, "MaxAndNominal", m.id]).catch(e => {
								utils.log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e)}`);
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

						if (DEVMODE && config.logRolls) {
							// If enabled, log rolls so we can verify the bots math
							dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,0,1)", [originalCommand, returnmsg.errorCode, m.id]).catch(e => {
								utils.log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e)}`);
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
							utils.log(LT.LOG, `Messaging GM ${e}`);
							// If its too big, collapse it into a .txt file and send that instead.
							const b = await new Blob([returnText as BlobPart], { "type": "text" });

							if (b.size > 8388290) {
								// Update return text
								returnText = "<@" + message.author.id + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nFull details could not be attached to this messaged as a `.txt` file as the file would be too large for Discord to handle.  If you would like to see the details of rolls, please send the rolls in multiple messages instead of bundled into one.";

								// Attempt to DM the GMs and send a warning if it could not DM a GM
								await sendDirectMessage(e.substr(2, (e.length - 3)), returnText).catch(() => {
									utils.sendIndirectMessage(message, "WARNING: " + e + " could not be messaged.  If this issue persists, make sure direct messages are allowed from this server.", sendMessage, sendDirectMessage);
								});
							} else {
								// Update return text
								returnText = "<@" + message.author.id + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nFull details have been attached to this messaged as a `.txt` file for verification purposes.";

								// Attempt to DM the GMs and send a warning if it could not DM a GM
								await sendDirectMessage(e.substr(2, (e.length - 3)), { "content": returnText, "file": { "blob": b, "name": "rollDetails.txt" } }).catch(() => {
									utils.sendIndirectMessage(message, "WARNING: " + e + " could not be messaged.  If this issue persists, make sure direct messages are allowed from this server.", sendMessage, sendDirectMessage);
								});
							}
						});

						// Finally send the text
						m.edit(normalText);

						if (DEVMODE && config.logRolls) {
							// If enabled, log rolls so we can verify the bots math
							dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,0,0)", [originalCommand, returnText, m.id]).catch(e => {
								utils.log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e)}`);
							});
						}
					} else {
						// When not a GM roll, make sure the message is not too big
						if (returnText.length > 2000) {
							// If its too big, collapse it into a .txt file and send that instead.
							const b = await new Blob([returnText as BlobPart], { "type": "text" });

							if (b.size > 8388290) {
								// Update return text
								returnText = "<@" + message.author.id + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nDetails have been ommitted from this message for being over 2000 characters.  Full details could not be attached to this messaged as a `.txt` file as the file would be too large for Discord to handle.  If you would like to see the details of rolls, please send the rolls in multiple messages instead of bundled into one.";

								// Send the results
								m.edit(returnText);
							} else {
								// Update return text
								returnText = "<@" + message.author.id + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nDetails have been ommitted from this message for being over 2000 characters.  Full details have been attached to this messaged as a `.txt` file for verification purposes.";
	
								// Remove the original message to send new one with attachment
								m.delete();
	
								await utils.sendIndirectMessage(message, { "content": returnText, "file": { "blob": b, "name": "rollDetails.txt" } }, sendMessage, sendDirectMessage);
							}
						} else {
							// Finally send the text
							m.edit(returnText);
						}

						if (DEVMODE && config.logRolls) {
							// If enabled, log rolls so we can verify the bots math
							dbClient.execute("INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,0,0)", [originalCommand, returnText, m.id]).catch(e => {
								utils.log(LT.ERROR, `Failed to insert into DB: ${JSON.stringify(e)}`);
							});
						}
					}
				} catch (e) {
					utils.log(LT.ERROR, `Undandled Error: ${JSON.stringify(e)}`);
				}
			}

			// [[emoji or [[emojialias
			// Check if the unhandled command is an emoji request
			else {
				// Start looping thru the possible emojis
				config.emojis.some((emoji: EmojiConf) => {
					utils.log(LT.LOG, `Checking if command was emoji ${emoji}`);
					// If a match gets found
					if (emoji.aliases.indexOf(command || "") > -1) {
						// Light telemetry to see how many times a command is being run
						dbClient.execute(`CALL INC_CNT("emoji");`).catch(e => {
							utils.log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
						});

						// Send the needed emoji1
						utils.sendIndirectMessage(message, `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`, sendMessage, sendDirectMessage).catch(e => {
							utils.log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
						});
						// And attempt to delete if needed
						if (emoji.deleteSender) {
							message.delete().catch(e => {
								utils.log(LT.WARN, `Failed to delete message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
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
	api.start(dbClient, cache, sendMessage, sendDirectMessage);
}
