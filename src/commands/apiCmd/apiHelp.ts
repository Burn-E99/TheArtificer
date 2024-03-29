import config from '../../../config.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
} from '../../../deps.ts';
import { infoColor1, infoColor2 } from '../../commandUtils.ts';
import utils from '../../utils.ts';

export const help = (message: DiscordenoMessage) => {
	message.send({
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
	}).catch((e: Error) => utils.commonLoggers.messageSendError('apiHelp.ts:67', message, e));
};
