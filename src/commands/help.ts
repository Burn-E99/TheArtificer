import config from '../../config.ts';
import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
} from '../../deps.ts';
import { infoColor2 } from '../commandUtils.ts';

export const help = (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("help");`).catch((e) => {
		log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	message.send({
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
	}).catch((e) => {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
