import config from '../config.ts';
import { CountDetails, SolvedRoll } from './solver/solver.d.ts';
import { RollModifiers } from './mod.d.ts';

const failColor = 0xe71212;
const warnColor = 0xe38f28;
const successColor = 0x0f8108;
const infoColor1 = 0x313bf9;
const infoColor2 = 0x6805e9;

export const constantCmds = {
	apiDeleteFail: {
		embeds: [{
			color: failColor,
			title: 'Failed to delete this guild from the database.',
			description: 'If this issue persists, please report this to the developers.',
		}],
	},
	apiGuildOnly: {
		embeds: [{
			color: failColor,
			title: 'API commands are only available in guilds.',
		}],
	},
	apiHelp: {
		embeds: [
			{
				color: infoColor2,
				title: 'The Artificer\'s API Details:',
				description:
					`The Artificer has a built in API that allows user to roll dice into Discord using third party programs.  By default, API rolls are blocked from being sent in your guild.  The API warning is also enabled by default.  These commands may only be used by the Owner or Admins of your guild.

For information on how to use the API, please check the GitHub README for more information [here](https://github.com/Burn-E99/TheArtificer).

You may enable and disable the API rolls for your guild as needed.`,
			},
			{
				color: infoColor1,
				title: 'Available API Commands:',
				fields: [
					{
						name: `\`${config.prefix}api help\``,
						value: 'This command',
						inline: true,
					},
					{
						name: `\`${config.prefix}api status\``,
						value: 'Shows the current status of the API for the channel this was run in',
						inline: true,
					},
					{
						name: `\`${config.prefix}api allow/enable\``,
						value: 'Allows API Rolls to be sent to the channel this was run in',
						inline: true,
					},
					{
						name: `\`${config.prefix}api block/disable\``,
						value: 'Blocks API Rolls from being sent to the channel this was run in',
						inline: true,
					},
					{
						name: `\`${config.prefix}api delete\``,
						value: 'Deletes this channel\'s settings from The Artificer\'s database',
						inline: true,
					},
					{
						name: `\`${config.prefix}api show-warn\``,
						value: 'Shows the API warning on all rolls sent to the channel this was run in',
						inline: true,
					},
					{
						name: `\`${config.prefix}api hide-warn\``,
						value: 'Hides the API warning on all rolls sent to the channel this was run in',
						inline: true,
					},
				],
			},
		],
	},
	apiPermError: {
		embeds: [{
			color: failColor,
			title: 'API commands are powerful and can only be used by guild Owners and Admins.',
			description: 'For information on how to use the API, please check the GitHub README for more information [here](https://github.com/Burn-E99/TheArtificer).',
		}],
	},
	apiRemoveGuild: {
		embeds: [{
			color: successColor,
			title: 'This guild\'s API setting has been removed from The Artifier\'s Database.',
		}],
	},
	apiStatusFail: {
		embeds: [{
			color: failColor,
			title: 'Failed to check API rolls status for this guild.',
			description: 'If this issue persists, please report this to the developers.',
		}],
	},
	help: {
		embeds: [{
			color: infoColor2,
			title: 'The Artificer\'s Available Commands:',
			fields: [
				{
					name: `\`${config.prefix}?\``,
					value: 'This command',
					inline: true,
				},
				{
					name: `\`${config.prefix}rollhelp\` or \`${config.prefix}??\``,
					value: `Details on how to use the roll command, listed as \`${config.prefix}xdy...${config.postfix}\` below`,
					inline: true,
				},
				{
					name: `\`${config.prefix}api [subcommand]\``,
					value: `Administrative tools for the bots's API, run \`${config.prefix}api help\` for more details`,
					inline: true,
				},
				{
					name: `\`${config.prefix}ping\``,
					value: 'Pings the bot to check connectivity',
					inline: true,
				},
				{
					name: `\`${config.prefix}info\``,
					value: 'Prints some information and links relating to the bot',
					inline: true,
				},
				{
					name: `\`${config.prefix}privacy\``,
					value: 'Prints some information about the Privacy Policy',
					inline: true,
				},
				{
					name: `\`${config.prefix}version\``,
					value: 'Prints the bots version',
					inline: true,
				},
				{
					name: `\`${config.prefix}popcat\``,
					value: 'Popcat',
					inline: true,
				},
				{
					name: `\`${config.prefix}report [text]\``,
					value: 'Report a command that failed to run',
					inline: true,
				},
				{
					name: `\`${config.prefix}stats\``,
					value: 'Statistics on the bot',
					inline: true,
				},
				{
					name: `\`${config.prefix}xdydzracsq!${config.postfix}\` ...`,
					value:
						`Rolls all configs requested, you may repeat the command multiple times in the same message (just ensure you close each roll with \`${config.postfix}\`), run \`${config.prefix}??\` for more details`,
					inline: true,
				},
			],
		}],
	},
	indev: {
		embeds: [{
			color: warnColor,
			title: 'Command is in development, please try again later.',
		}],
	},
	info: {
		embeds: [{
			color: infoColor2,
			title: 'The Artificer, a Discord bot that specializing in rolling dice and calculating math',
			description: `The Artificer is developed by Ean AKA Burn_E99.
Additional information can be found on my website [here](https://discord.burne99.com/TheArtificer/).
Want to check out my source code?  Check it out [here](https://github.com/Burn-E99/TheArtificer).
Need help with this bot?  Join my support server [here](https://discord.gg/peHASXMZYv).`,
		}],
	},
	loadingStats: {
		embeds: [{
			color: warnColor,
			title: 'Compiling latest statistics . . .',
		}],
	},
	mention: {
		embeds: [{
			color: infoColor1,
			title: `Hello!  I am ${config.name}!`,
			fields: [{
				name: 'I am a bot that specializes in rolling dice and doing basic algebra',
				value: `To learn about my available commands, please run \`${config.prefix}help\``,
			}],
		}],
	},
	privacy: {
		embeds: [{
			color: infoColor1,
			title: 'Privacy Policy',
			fields: [{
				name: 'The Artificer does not track or collect user information via Discord.',
				value:
					`The only user submitted information that is stored is submitted via the \`${config.prefix}report\` command.  This information is only stored for a short period of time in a location that only the Developer of The Artificer can see.

For more details, please check out the Privacy Policy on the GitHub [here](https://github.com/Burn-E99/TheArtificer/blob/master/PRIVACY.md).

Terms of Service can also be found on GitHub [here](https://github.com/Burn-E99/TheArtificer/blob/master/TERMS.md).`,
			}],
		}],
	},
	report: {
		embeds: [{
			color: successColor,
			title: 'Failed command has been reported to my developer.',
			description: `For more in depth support, and information about planned maintenance, please join the support server [here](https://discord.gg/peHASXMZYv).`,
		}],
	},
	reportFail: {
		embeds: [{
			color: failColor,
			title: 'Please provide a short description of what failed',
			description: 'Providing a short description helps my developer quickly diagnose what went wrong.',
		}],
	},
	rip: {
		embeds: [{
			color: infoColor2,
			title: 'The Artificer was built in memory of my Grandmother, Babka',
			description: `With much love, Ean
			
			December 21, 2020`,
		}],
	},
	rollHelp: {
		embeds: [
			{
				color: infoColor2,
				title: 'The Artificer\'s Roll Command Details:',
				description: `You can chain as many of these options as you want, as long as the option does not disallow it.

				This command also can fully solve math equations with parenthesis.
				
				The Artificer supports most of the [Roll20 formatting](https://artificer.eanm.dev/roll20).  More details and examples can be found [here](https://artificer.eanm.dev/roll20).`,
				fields: [
					{
						name: `\`${config.prefix}xdydzracsq!${config.postfix}\` ...`,
						value: `Rolls all configs requested, you may repeat the command multiple times in the same message (just ensure you close each roll with \`${config.postfix}\`)`,
					},
					{
						name: '`x` [Optional]',
						value: 'Number of dice to roll, if omitted, 1 is used',
						inline: true,
					},
					{
						name: '`dy` [Required]',
						value: 'Size of dice to roll, `d20` = 20 sided die',
						inline: true,
					},
					{
						name: '`dz` or `dlz` [Optional]',
						value: 'Drops the lowest `z` dice, cannot be used with `kz`',
						inline: true,
					},
					{
						name: '`kz` or `khz` [Optional]',
						value: 'Keeps the highest `z` dice, cannot be used with `dz`',
						inline: true,
					},
					{
						name: '`dhz` [Optional]',
						value: 'Drops the highest `z` dice, cannot be used with `kz`',
						inline: true,
					},
					{
						name: '`klz` [Optional]',
						value: 'Keeps the lowest `z` dice, cannot be used with `dz`',
						inline: true,
					},
					{
						name: '`ra` or `r=q` [Optional]',
						value: 'Rerolls any rolls that match `a`, `r3` will reroll every die that land on 3, throwing out old rolls, cannot be used with `ro`',
						inline: true,
					},
					{
						name: '`r<q` [Optional]',
						value: 'Rerolls any rolls that are less than or equal to `a`, `r3` will reroll every die that land on 3, 2, or 1, throwing out old rolls, cannot be used with `ro`',
						inline: true,
					},
					{
						name: '`r>q` [Optional]',
						value: 'Rerolls any rolls that are greater than or equal to `a`, `r3` will reroll every die that land on 3 or greater, throwing out old rolls, cannot be used with `ro`',
						inline: true,
					},
					{
						name: '`roa` or `ro=q` [Optional]',
						value: 'Rerolls any rolls that match `a`, `ro3` will reroll each die that lands on 3 ONLY ONE TIME, throwing out old rolls, cannot be used with `r`',
						inline: true,
					},
					{
						name: '`ro<q` [Optional]',
						value: 'Rerolls any rolls that are less than or equal to `a`, `ro3` will reroll each die that lands on 3, 2, or 1 ONLY ONE TIME, throwing out old rolls, cannot be used with `r`',
						inline: true,
					},
					{
						name: '`ro>q` [Optional]',
						value: 'Rerolls any rolls that are greater than or equal to `a`, `ro3` will reroll each die that lands on 3 or greater ONLY ONE TIME, throwing out old rolls, cannot be used with `r`',
						inline: true,
					},
					{
						name: '`csq` or `cs=q` [Optional]',
						value: 'Changes crit score to `q`',
						inline: true,
					},
					{
						name: '`cs<q` [Optional]',
						value: 'Changes crit score to be less than or equal to `q`',
						inline: true,
					},
					{
						name: '`cs>q` [Optional]',
						value: 'Changes crit score to be greater than or equal to `q`',
						inline: true,
					},
					{
						name: '`cfq` or `cf=q` [Optional]',
						value: 'Changes crit fail to `q`',
						inline: true,
					},
					{
						name: '`cf<q` [Optional]',
						value: 'Changes crit fail to be less than or equal to `q`',
						inline: true,
					},
					{
						name: '`cf>q` [Optional]',
						value: 'Changes crit fail to be greater than or equal to `q`',
						inline: true,
					},
					{
						name: '`!` [Optional]',
						value: 'Exploding, rolls another `dy` for every crit success',
						inline: true,
					},
					{
						name: '`!o` [Optional]',
						value: 'Exploding Once, rolls one `dy` for each original crit success',
						inline: true,
					},
					{
						name: '`!=u` [Optional]',
						value: 'Explode on `u`, rolls another `dy` for every die that lands on `u`',
						inline: true,
					},
					{
						name: '`!>u` [Optional]',
						value: 'Explode on `u` and greater, rolls another `dy` for every die that lands on `u` or greater',
						inline: true,
					},
					{
						name: '`!<u` [Optional]',
						value: 'Explode on `u` and under, rolls another `dy` for every die that lands on `u` or less',
						inline: true,
					},
					{
						name: '`!o=u` [Optional]',
						value: 'Explodes Once on `u`, rolls another `dy` for each original die that landed on `u`',
						inline: true,
					},
				],
			},
			{
				color: infoColor2,
				fields: [
					{
						name: '`!o>u` [Optional]',
						value: 'Explode Once on `u` and greater, rolls another `dy` for each original die that landed on `u` or greater',
						inline: true,
					},
					{
						name: '`!o<u` [Optional]',
						value: 'Explode Once on `u` and under, rolls another `dy` for each original die that landed on `u` or less',
						inline: true,
					},
				],
			},
			{
				color: infoColor1,
				title: 'Roll Command Decorators:',
				description: `This command also has some useful decorators that can used.  These decorators simply need to be placed after all rolls in the message.

Examples: \`${config.prefix}d20${config.postfix} -nd\`, \`${config.prefix}d20${config.postfix} -nd -s\`, \`${config.prefix}d20${config.postfix} ${config.prefix}d20${config.postfix} ${config.prefix}d20${config.postfix} -o a\``,
				fields: [
					{
						name: '`-nd` - No Details',
						value: 'Suppresses all details of the requested roll',
						inline: true,
					},
					{
						name: '`-snd` - Super No Details',
						value: 'Suppresses all details of the requested roll and hides no details message',
						inline: true,
					},
					{
						name: '`-s` - Spoiler',
						value: 'Spoilers all details of the requested roll',
						inline: true,
					},
					{
						name: '`-m` - Maximize Roll',
						value: 'Rolls the theoretical maximum roll, cannot be used with -n',
						inline: true,
					},
					{
						name: '`-n` - Nominal Roll',
						value: 'Rolls the theoretical nominal roll, cannot be used with -m',
						inline: true,
					},
					{
						name: '`-gm @user1 @user2 @usern` - GM Roll',
						value: 'Rolls the requested roll in GM mode, suppressing all publicly shown results and details and sending the results directly to the specified GMs',
						inline: true,
					},
					{
						name: '`-c` - Count Rolls',
						value: 'Shows the Count Embed, containing the count of successful rolls, failed rolls, rerolls, drops, and explosions',
						inline: true,
					},
					{
						name: '`-o [direction]` - Order Roll',
						value: `Rolls the requested roll and orders the results in the requested direction

Available directions:
\`a\` - Ascending (least to greatest)
\`d\` - Descending (greatest to least)`,
						inline: true,
					},
				],
			},
			{
				color: successColor,
				title: 'Results Formatting:',
				description: 'The results have some formatting applied on them to provide details on what happened during this roll.',
				fields: [
					{
						name: 'Bold',
						value: 'Critical successes will be **bolded**.',
						inline: true,
					},
					{
						name: 'Underline',
						value: 'Critical fails will be __underlined__.',
						inline: true,
					},
					{
						name: 'Strikethrough',
						value: 'Rolls that were dropped or rerolled ~~crossed out~~.',
						inline: true,
					},
				],
			},
		],
	},
	rolling: {
		embeds: [{
			color: infoColor1,
			title: 'Rolling . . .',
		}],
	},
	version: {
		embeds: [{
			color: infoColor1,
			title: `My current version is ${config.version}`,
		}],
	},
};

export const generatePing = (time: number) => ({
	embeds: [{
		color: infoColor1,
		title: time === -1 ? 'Ping?' : `Pong! Latency is ${time}ms.`,
	}],
});

export const generateReport = (msg: string) => ({
	embeds: [{
		color: infoColor2,
		title: 'USER REPORT:',
		description: msg || 'No message',
	}],
});

export const generateStats = (guildCount: number, channelCount: number, memberCount: number, rollCount: bigint, utilityCount: bigint) => ({
	embeds: [{
		color: infoColor2,
		title: 'The Artificer\'s Statistics:',
		fields: [
			{
				name: 'Guilds:',
				value: `${guildCount}`,
				inline: true,
			},
			{
				name: 'Channels:',
				value: `${channelCount}`,
				inline: true,
			},
			{
				name: 'Active Members:',
				value: `${memberCount}`,
				inline: true,
			},
			{
				name: 'Roll Commands:',
				value: `${rollCount}`,
				inline: true,
			},
			{
				name: 'Utility Commands:',
				value: `${utilityCount}`,
				inline: true,
			},
		],
	}],
});

export const generateApiFailed = (args: string) => ({
	embeds: [{
		color: failColor,
		title: `Failed to ${args} API rolls for this guild.`,
		description: 'If this issue persists, please report this to the developers.',
	}],
});

export const generateApiStatus = (banned: boolean, active: boolean) => {
	const apiStatus = active ? 'allowed' : 'blocked from being used';
	return {
		embeds: [{
			color: infoColor1,
			title: `The Artificer's API is ${config.api.enable ? 'currently enabled' : 'currently disabled'}.`,
			description: banned ? 'API rolls are banned from being used in this guild.\n\nThis will not be reversed.' : `API rolls are ${apiStatus} in this guild.`,
		}],
	};
};

export const generateApiSuccess = (args: string) => ({
	embeds: [{
		color: successColor,
		title: `API rolls have successfully been ${args} for this guild.`,
	}],
});

export const generateDMFailed = (user: string) => ({
	embeds: [{
		color: failColor,
		title: `WARNING: ${user} could not be messaged.`,
		description: 'If this issue persists, make sure direct messages are allowed from this server.',
	}],
});

export const generateApiKeyEmail = (email: string, key: string) => ({
	content: `<@${config.api.admin}> A USER HAS REQUESTED AN API KEY`,
	embeds: [{
		color: infoColor1,
		fields: [
			{
				name: 'Send to:',
				value: email,
			},
			{
				name: 'Subject:',
				value: 'Artificer API Key',
			},
			{
				name: 'Body:',
				value: `Hello Artificer API User,

Welcome aboard The Artificer's API.  You can find full details about the API on the GitHub: https://github.com/Burn-E99/TheArtificer

Your API Key is: ${key}

Guard this well, as there is zero tolerance for API abuse.

Welcome aboard,
The Artificer Developer - Ean Milligan`,
			},
		],
	}],
});

export const generateApiDeleteEmail = (email: string, deleteCode: string) => ({
	content: `<@${config.api.admin}> A USER HAS REQUESTED A DELETE CODE`,
	embeds: [{
		color: infoColor1,
		fields: [
			{
				name: 'Send to:',
				value: email,
			},
			{
				name: 'Subject:',
				value: 'Artificer API Delete Code',
			},
			{
				name: 'Body:',
				value: `Hello Artificer API User,

I am sorry to see you go.  If you would like, please respond to this email detailing what I could have done better.

As requested, here is your delete code: ${deleteCode}

Sorry to see you go,
The Artificer Developer - Ean Milligan`,
			},
		],
	}],
});

export const generateRollError = (errorType: string, errorMsg: string) => ({
	embeds: [{
		color: failColor,
		title: 'Roll command encountered the following error:',
		fields: [{
			name: errorType,
			value: `${errorMsg}\n\nPlease try again.  If the error is repeated, please report the issue using the \`${config.prefix}report\` command.`,
		}],
	}],
});

export const generateCountDetailsEmbed = (counts: CountDetails) => ({
	color: infoColor1,
	title: 'Roll Count Details:',
	fields: [
		{
			name: 'Total Rolls:',
			value: `${counts.total}`,
			inline: true,
		},
		{
			name: 'Successful Rolls:',
			value: `${counts.successful}`,
			inline: true,
		},
		{
			name: 'Failed Rolls:',
			value: `${counts.failed}`,
			inline: true,
		},
		{
			name: 'Rerolled Dice:',
			value: `${counts.rerolled}`,
			inline: true,
		},
		{
			name: 'Dropped Dice:',
			value: `${counts.dropped}`,
			inline: true,
		},
		{
			name: 'Exploded Dice:',
			value: `${counts.exploded}`,
			inline: true,
		},
	],
});

export const generateRollEmbed = async (authorId: bigint, returnDetails: SolvedRoll, modifiers: RollModifiers) => {
	if (returnDetails.error) {
		// Roll had an error, send error embed
		return {
			embed: {
				color: failColor,
				title: 'Roll failed:',
				description: `${returnDetails.errorMsg}`,
			},
			hasAttachment: false,
			attachment: {
				'blob': await new Blob(['' as BlobPart], { 'type': 'text'}),
				'name': 'rollDetails.txt',
			},
		};
	} else {
		if (modifiers.gmRoll) {
			// Roll is a GM Roll, send this in the pub channel (this funciton will be ran again to get details for the GMs)
			return {
				embed: {
					color: infoColor2,
					description: `<@${authorId}>${returnDetails.line1}

Results have been messaged to the following GMs: ${modifiers.gms.join(' ')}`,
				},
				hasAttachment: false,
				attachment: {
					'blob': await new Blob(['' as BlobPart], { 'type': 'text'}),
					'name': 'rollDetails.txt',
				},
			};
		} else {
			// Roll is normal, make normal embed
			const line2Details = returnDetails.line2.split(': ');
			let details = '';

			if (!modifiers.superNoDetails) {
				if (modifiers.noDetails) {
					details = `**Details:**
Suppressed by -nd flag`;
				} else {
					details = `**Details:**
${modifiers.spoiler}${returnDetails.line3}${modifiers.spoiler}`;
				}
			}

			const baseDesc = `<@${authorId}>${returnDetails.line1}
**${line2Details.shift()}:**
${line2Details.join(': ')}`;

			if (baseDesc.length + details.length < 4090) {
				return {
					embed: {
						color: infoColor2,
						description: `${baseDesc}

${details}`,
					},
					hasAttachment: false,
					attachment: {
						'blob': await new Blob(['' as BlobPart], { 'type': 'text'}),
						'name': 'rollDetails.txt',
					},
				};
			} else {
				// If its too big, collapse it into a .txt file and send that instead.
				const b = await new Blob([`${baseDesc}\n\n${details}` as BlobPart], { 'type': 'text' });
				details = 'Details have been ommitted from this message for being over 2000 characters.';
				if (b.size > 8388290) {
					details +=
						'Full details could not be attached to this messaged as a \`.txt\` file as the file would be too large for Discord to handle.  If you would like to see the details of rolls, please send the rolls in multiple messages instead of bundled into one.';
					return {
						embed: {
							color: infoColor2,
							description: `${baseDesc}
	
	${details}`,
						},
						hasAttachment: false,
						attachment: {
							'blob': await new Blob(['' as BlobPart], { 'type': 'text'}),
							'name': 'rollDetails.txt',
						},
					};
				} else {
					details += 'Full details have been attached to this messaged as a \`.txt\` file for verification purposes.';
					return {
						embed: {
							color: infoColor2,
							description: `${baseDesc}

${details}`,
						},
						hasAttachment: true,
						attachment: {
							'blob': b,
							'name': 'rollDetails.txt',
						},
					};
				}
			}
		}
	}
};
