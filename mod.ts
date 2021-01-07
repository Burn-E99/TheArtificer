/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

const DEVMODE = false;

import {
	startBot, editBotsStatus,
	Intents, StatusTypes, ActivityType,
	Message, Guild, sendMessage, sendDirectMessage,
	cache
} from "https://deno.land/x/discordeno@10.0.0/mod.ts";

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
				// The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
				try {
					const m = await utils.sendIndirectMessage(message, "Ping?", sendMessage, sendDirectMessage);
					m.edit(`Pong! Latency is ${m.timestamp - message.timestamp}ms.`);
				} catch (err) {
					console.error("Failed to send message 10", message, err);
				}
			}

			// [[help or [[h or [[?
			// Help command, prints from help file
			else if (command === "help" || command === "h" || command === "?") {
				utils.sendIndirectMessage(message, config.help.join("\n"), sendMessage, sendDirectMessage).catch(err => {
					console.error("Failed to send message 20", message, err);
				});
			}

			// [[v or [[version
			// Returns version of the bot
			else if (command === "version" || command === "v") {
				utils.sendIndirectMessage(message, `My current version is ${config.version}.`, sendMessage, sendDirectMessage).catch(err => {
					console.error("Failed to send message 30", message, err);
				});
			}

			// [[popcat
			// popcat animated emoji
			else if (command === "popcat") {
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
				sendMessage(config.logChannel, ("USER REPORT:\n" + args.join(" "))).catch(err => {
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
				if (DEVMODE && message.guildID !== "317852981733097473") {
					utils.sendIndirectMessage(message, "Command is in development, please try again later.", sendMessage, sendDirectMessage).catch(err => {
						console.error("Failed to send message 70", message, err);
					});
					return;
				}

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
					for (let i = 0; i < args.length; i++) {
						switch (args[i]) {
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
								while (((i + 1) < args.length) && args[i + 1].startsWith("<@!")) {
									modifiers.gms.push(args[i + 1]);
									args.splice((i + 1), 1);
								}
								if (modifiers.gms.length < 1) {
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

					const rollCmd = command + " " + args.join(" ");

					const returnmsg = solver.parseRoll(rollCmd, config.prefix, config.postfix, modifiers.maxRoll, modifiers.nominalRoll) || { error: true, errorMsg: "Error: Empty message", line1: "", line2: "", line3: "" };
					let returnText = "";

					if (returnmsg.error) {
						returnText = returnmsg.errorMsg;
					} else {
						returnText = "<@" + message.author.id + ">" + returnmsg.line1 + "\n" + returnmsg.line2;

						if (modifiers.noDetails) {
							returnText += "\nDetails suppressed by -nd flag.";
						} else {
							returnText += "\nDetails:\n" + modifiers.spoiler + returnmsg.line3 + modifiers.spoiler;
						}
					}

					if (modifiers.gmRoll) {
						const normalText = "<@" + message.author.id + ">" + returnmsg.line1 + "\nResults have been messaged to the following GMs: " + modifiers.gms.join(" ");

						modifiers.gms.forEach(async e => {
							const msgs = utils.split2k(returnText);
							const failedDMs = <string[]>[];
							for (let i = 0; ((failedDMs.indexOf(e) === -1) && (i < msgs.length)); i++) {
								await sendDirectMessage(e.substr(3, (e.length - 4)), msgs[i]).catch(() => {
									failedDMs.push(e);
									utils.sendIndirectMessage(message, "WARNING: " + e + " could not be messaged.  If this issue persists, make sure direct messages are allowed from this server.", sendMessage, sendDirectMessage);
								});
							}
						});

						m.edit(normalText);
					} else {
						if (returnText.length > 2000) {
							const msgs = utils.split2k(returnText);
							let failed = false;
							for (let i = 0; (!failed && (i < msgs.length)); i++) {
								await sendDirectMessage(message.author.id, msgs[i]).catch(() => {
									failed = true;
								});
							}
							if (failed) {
								returnText = "<@" + message.author.id + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nDetails have been ommitted from this message for being over 2000 characters.  WARNING: <@" + message.author.id + "> could **NOT** be messaged full details for verification purposes.";
							} else {
								returnText = "<@" + message.author.id + ">" + returnmsg.line1 + "\n" + returnmsg.line2 + "\nDetails have been ommitted from this message for being over 2000 characters.  Full details have been messaged to <@" + message.author.id + "> for verification purposes.";
							}
						}

						m.edit(returnText);
					}
				} catch (err) {
					console.error("Something failed 71");
				}
			}
		}
	}
});

utils.cmdPrompt(config.logChannel, config.name, sendMessage);
