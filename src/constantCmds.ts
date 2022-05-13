import config from "../config.ts";

export const constantCmds = {
	apiDeleteFail: {
		embeds: [{
			fields: [{
				name: "Failed to delete this guild from the database.",
				value: "If this issue persists, please report this to the developers."
			}]
		}]
	},
	apiGuildOnly: {
		embeds: [{
			title: "API commands are only available in guilds."
		}]
	},
	apiHelp: {
		embeds: [
			{
				fields: [
					{
						name: "The Artificer's API Details:",
						value: `The Artificer has a built in API that allows user to roll dice into Discord using third party programs.
						By default, API rolls are blocked from being sent in your guild.  The API warning is also enabled by default.
						These commands may only be used by the Owner or Admins of your guild.

						For information on how to use the API, please check the GitHub README for more information [here](https://github.com/Burn-E99/TheArtificer).

						You may enable and disable the API rolls for your guild as needed.`
					}
				]
			}, {
				title: "Available API Commands:",
				fields: [
					{
						name: `\`${config.prefix}api help\``,
						value: "This command",
						inline: true
					}, {
						name: `\`${config.prefix}api status\``,
						value: "Shows the current status of the API for the channel this was run in",
						inline: true
					}, {
						name: `\`${config.prefix}api allow/enable\``,
						value: "Allows API Rolls to be sent to the channel this was run in",
						inline: true
					}, {
						name: `\`${config.prefix}api block/disable\``,
						value: "Blocks API Rolls from being sent to the channel this was run in",
						inline: true
					}, {
						name: `\`${config.prefix}api delete\``,
						value: "Deletes this channel's settings from The Artificer's database",
						inline: true
					}, {
						name: `\`${config.prefix}api show-warn\``,
						value: "Shows the API warning on all rolls sent to the channel this was run in",
						inline: true
					}, {
						name: `\`${config.prefix}api hide-warn\``,
						value: "Hides the API warning on all rolls sent to the channel this was run in",
						inline: true
					}
				]
			}
		]
	},
	apiPermError: {
		embeds: [{
			fields: [{
				name: "API commands are powerful and can only be used by guild Owners and Admins.",
				value: "For information on how to use the API, please check the GitHub README for more information [here](https://github.com/Burn-E99/TheArtificer)."
			}]
		}]	
	},
	apiRemoveGuild: {
		embeds: [{
			title: "This guild's API setting has been removed from The Artifier's Database."
		}]
	},
	apiStatusFail: {
		embeds: [{
			fields: [{
				name: "Failed to check API rolls status for this guild.",
				value: "If this issue persists, please report this to the developers."
			}]
		}]
	},
	help: {
		embeds: [{
			title: "The Artificer's Available Commands:",
			fields: [
				{
					name: `\`${config.prefix}?\``,
					value: "This command",
					inline: true
				}, {
					name: `\`${config.prefix}rollhelp\` or \`${config.prefix}??\``,
					value: `Details on how to use the roll command, listed as \`${config.prefix}xdy...${config.postfix}\` below`,
					inline: true
				}, {
					name: `\`${config.prefix}api [subcommand]\``,
					value: `Administrative tools for the bots's API, run \`${config.prefix}api help\` for more details`,
					inline: true
				}, {
					name: `\`${config.prefix}ping\``,
					value: "Pings the bot to check connectivity",
					inline: true
				}, {
					name: `\`${config.prefix}info\``,
					value: "Prints some information and links relating to the bot",
					inline: true
				}, {
					name: `\`${config.prefix}privacy\``,
					value: "Prints some information about the Privacy Policy",
					inline: true
				}, {
					name: `\`${config.prefix}version\``,
					value: "Prints the bots version",
					inline: true
				}, {
					name: `\`${config.prefix}popcat\``,
					value: "Popcat",
					inline: true
				}, {
					name: `\`${config.prefix}report [text]\``,
					value: "Report a command that failed to run",
					inline: true
				}, {
					name: `\`${config.prefix}stats\``,
					value: "Statistics on the bot",
					inline: true
				}, {
					name: `\`${config.prefix}xdydzracsq!${config.postfix}\` ...`,
					value: `Rolls all configs requested, you may repeat the command multiple times in the same message (just ensure you close each roll with \`${config.postfix}\`), run \`${config.prefix}??\` for more details`,
					inline: true
				}
			]
		}]
	},
	indev: {
		embeds: [{
			title: "Command is in development, please try again later."
		}]
	},
	info: {
		embeds: [{
			fields: [{
				name: "The Artificer, a Discord bot that specializing in rolling dice and calculating math",
				value: `The Artificer is developed by Ean AKA Burn_E99.
				Additional information can be found on my website [here](https://discord.burne99.com/TheArtificer/).
				Want to check out my source code?  Check it out [here](https://github.com/Burn-E99/TheArtificer).
				Need help with this bot?  Join my support server [here](https://discord.gg/peHASXMZYv).`
			}]
		}]
	},
	loadingStats: {
		embeds: [{
			title: "Compiling latest statistics . . ."
		}]
	},
	mention: {
		embeds: [{
			title: `Hello!  I am ${config.name}!`,
			fields: [{
				name: "I am a bot that specializes in rolling dice and doing basic algebra",
				value: `To learn about my available commands, please run \`${config.prefix}help\``
			}]
		}]
	},
	privacy: {
		embeds: [{
			title: "Privacy Policy",
			fields: [{
				name: "The Artificer does not track or collect user information via Discord.",
				value: `The only user submitted information that is stored is submitted via the \`${config.prefix}report\` command.  This information is only stored for a short period of time in a location that only the Developer of The Artificer can see.

				For more details, please check out the Privacy Policy on the GitHub [here](https://github.com/Burn-E99/TheArtificer/blob/master/PRIVACY.md).
				
				Terms of Service can also be found on GitHub [here](https://github.com/Burn-E99/TheArtificer/blob/master/TERMS.md).`
			}]
		}]
	},
	report: {
		embeds: [{
			fields: [{
				name: "Failed command has been reported to my developer.",
				value: `For more in depth support, and information about planned maintenance, please join the support server [here](https://discord.gg/peHASXMZYv).`
			}]
		}]
	},
	reportFail: {
		embeds: [{
			fields: [{
				name: "Please provide a short description of what failed",
				value: "Providing a short description helps my developer quickly diagnose what went wrong."
			}]
		}]
	},
	rip: {
		embeds: [{
			fields: [{
				name: "The Artificer was built in memory of my Grandmother, Babka",
				value: `With much love, Ean
				
				December 21, 2020`
			}]
		}]
	},
	rollHelp: {
		embeds: [
			{
				title: "The Artificer's Roll Command Details:",
				fields: [
					{
						name: "Details:",
						value: `You can chain as many of these options as you want, as long as the option does not disallow it.

						This command also can fully solve math equations with parenthesis.`
					}, {
						name: `\`${config.prefix}xdydzracsq!${config.postfix}\` ...`,
						value: `Rolls all configs requested, you may repeat the command multiple times in the same message (just ensure you close each roll with \`${config.postfix}\`)`,
						inline: true
					}, {
						name: "`x` [Optional]",
						value: "Number of dice to roll, if omitted, 1 is used",
						inline: true
					}, {
						name: "`dy` [Required]",
						value: "Size of dice to roll, `d20` = 20 sided die",
						inline: true
					}, {
						name: "`dz` or `dlz` [Optional]",
						value: "Drops the lowest `z` dice, cannot be used with `kz`",
						inline: true
					}, {
						name: "`kz` or `khz` [Optional]",
						value: "Keeps the highest `z` dice, cannot be used with `dz`",
						inline: true
					}, {
						name: "`dhz` [Optional]",
						value: "Drops the highest `z` dice, cannot be used with `kz`",
						inline: true
					}, {
						name: "`klz` [Optional]",
						value: "Keeps the lowest `z` dice, cannot be used with `dz`",
						inline: true
					}, {
						name: "`ra` or `r=q` [Optional]",
						value: "Rerolls any rolls that match `a`, `r3` will reroll any dice that land on 3, throwing out old rolls",
						inline: true
					}, {
						name: "`r<q` [Optional]",
						value: "Rerolls any rolls that are less than or equal to  `a`, `r3` will reroll any dice that land on 3, 2, or 1, throwing out old rolls",
						inline: true
					}, {
						name: "`r>q` [Optional]",
						value: "Rerolls any rolls that are greater than or equal to `a`, `r3` will reroll any dice that land on 3 or greater, throwing out old rolls",
						inline: true
					}, {
						name: "`csq` or `cs=q` [Optional]",
						value: "Changes crit score to `q`",
						inline: true
					}, {
						name: "`cs<q` [Optional]",
						value: "Changes crit score to be less than or equal to `q`",
						inline: true
					}, {
						name: "`cs>q` [Optional]",
						value: "Changes crit score to be greater than or equal to `q`",
						inline: true
					}, {
						name: "`cfq` or `cf=q` [Optional]",
						value: "Changes crit fail to `q`",
						inline: true
					}, {
						name: "`cf<q` [Optional]",
						value: "Changes crit fail to be less than or equal to `q`",
						inline: true
					}, {
						name: "`cf>q` [Optional]",
						value: "Changes crit fail to be greater than or equal to `q`",
						inline: true
					}, {
						name: "`!` [Optional]",
						value: "Exploding, rolls another dy for every crit roll",
						inline: true
					}
				]
			}, {
				title: "Roll Command Decorators:",
				fields: [
					{
						name: "Details",
						value: `This command also has some useful decorators that can used.  These decorators simply need to be placed after all rolls in the message.
						
						Examples: \`${config.prefix}d20${config.postfix} -nd\`, \`${config.prefix}d20${config.postfix} -nd -s\``
					}, {
						name: "`-nd`",
						value: "No Details - Suppresses all details of the requested roll",
						inline: true
					}, {
						name: "`-snd`",
						value: "Super No Details - Suppresses all details of the requested roll and hides no details message",
						inline: true
					}, {
						name: "`-s`",
						value: "Spoiler - Spoilers all details of the requested roll",
						inline: true
					}, {
						name: "`-m`",
						value: "Maximize Roll - Rolls the theoretical maximum roll, cannot be used with -n",
						inline: true
					}, {
						name: "`-n`",
						value: "Nominal Roll - Rolls the theoretical nominal roll, cannot be used with -m",
						inline: true
					}, {
						name: "`-gm @user1 @user2 @usern`",
						value: "GM Roll - Rolls the requested roll in GM mode, suppressing all publicly shown results and details and sending the results directly to the specified GMs",
						inline: true
					}, {
						name: "`-o a` or `-o d`",
						value: "Order Roll - Rolls the requested roll and orders the results in the requested direction",
						inline: true
					}
				]
			}
		]
	},
	rolling: {
		embeds: [{
			title: "Rolling . . ."
		}]
	},
	version: {
		embeds: [{
			title: `My current version is ${config.version}`
		}]
	}
};

export const generatePing = (time: number) => ({
	embeds: [{
		title: time === -1 ? "Ping?" : `Pong! Latency is ${time}ms.`
	}]
});

export const generateReport = (msg: string) => ({
	embeds: [{
		fields: [{
			name: "USER REPORT:",
			value: msg || "No message"
		}]
	}]
});

export const generateStats = (guildCount: number, channelCount: number, memberCount: number, rollCount: bigint, utilityCount: bigint) => ({
	embeds: [{
		title: "The Artificer's Statistics:",
		fields: [
			{
				name: "Guilds:",
				value: `${guildCount}`,
				inline: true
			}, {
				name: "Channels:",
				value: `${channelCount}`,
				inline: true
			}, {
				name: "Active Members:",
				value: `${memberCount}`,
				inline: true
			}, {
				name: "Roll Commands:",
				value: `${rollCount}`,
				inline: true
			}, {
				name: "Utility Commands:",
				value: `${utilityCount}`,
				inline: true
			}
		]
	}]
});

export const generateApiFailed = (args: string) => ({
	embeds: [{
		fields: [{
			name: `Failed to ${args} API rolls for this guild.`,
			value: "If this issue persists, please report this to the developers."
		}]
	}]
});

export const generateApiStatus = (banned: boolean, active: boolean) => ({
	embeds: [{
		fields: [{
			name: `The Artificer's API is ${config.api.enable ? "currently enabled" : "currently disabled"}.`,
			value: banned ? "API rolls are banned from being used in this guild.\n\nThis will not be reversed." : `API rolls are ${active ? "allowed" : "blocked from being used"} in this guild.`
		}]
	}]
});

export const generateApiSuccess = (args: string) => ({
	embeds: [{
		title: `API rolls have successfully been ${args} for this guild.`
	}]
});

export const generateDMFailed = (user: string) => ({
	embeds: [{
		fields: [{
			name: `WARNING: ${user} could not be messaged.`,
			value: "If this issue persists, make sure direct messages are allowed from this server."
		}]
	}]
});

export const generateApiKeyEmail = (email: string, key: string) => ({
	content: `<@${config.api.admin}> A USER HAS REQUESTED AN API KEY`,
	embeds: [{
		fields: [
			{
				name: "Send to:",
				value: email
			}, {
				name: "Subject:",
				value: "Artificer API Key"
			}, {
				name: "Body:",
				value: `Hello Artificer API User,

				Welcome aboard The Artificer's API.  You can find full details about the API on the GitHub: https://github.com/Burn-E99/TheArtificer

				Your API Key is: ${key}

				Guard this well, as there is zero tolerance for API abuse.

				Welcome aboard,
				The Artificer Developer - Ean Milligan`
			}
		]
	}]
});

export const generateApiDeleteEmail = (email: string, deleteCode: string) => ({
	content: `<@${config.api.admin}> A USER HAS REQUESTED A DELETE CODE`,
	embeds: [{
		fields: [
			{
				name: "Send to:",
				value: email
			}, {
				name: "Subject:",
				value: "Artificer API Delete Code"
			}, {
				name: "Body:",
				value: `Hello Artificer API User,

				I am sorry to see you go.  If you would like, please respond to this email detailing what I could have done better.

				As requested, here is your delete code: ${deleteCode}

				Sorry to see you go,
				The Artificer Developer - Ean Milligan`
			}
		]
	}]
});

export const generateRollError = (errorType: string, errorMsg: string) => ({
	embeds: [{
		title: "Roll command encountered the following error:",
		fields: [{
			name: errorType,
			value: `${errorMsg}\n\nPlease try again.  If the error is repeated, please report the issue using the \`${config.prefix}report\` command.`
		}]
	}]
});
