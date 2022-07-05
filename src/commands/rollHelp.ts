import config from '../../config.ts';
import { dbClient, queries } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
} from '../../deps.ts';
import { infoColor1, infoColor2, successColor } from '../commandUtils.ts';
import utils from '../utils.ts';

export const rollHelp = (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(queries.callIncCnt('rollhelp')).catch((e) => utils.commonLoggers.dbError('rollHelp.ts:15', 'call sproc INC_CNT on', e));

	message.send({
		embeds: [
			{
				color: infoColor1,
				title: 'The Artificer\'s Roll Command Details:',
				description: `You can chain as many of these options as you want, as long as the option does not disallow it.

This command also can fully solve math equations with parenthesis.

The Artificer supports most of the [Roll20 formatting](https://artificer.eanm.dev/roll20).  More details and examples can be found [here](https://artificer.eanm.dev/roll20).`,
			},
			{
				color: infoColor2,
				title: 'Roll20 Dice Options:',
				fields: [
					{
						name: `\`${config.prefix}xdydzracsq!${config.postfix}\` ...`,
						value: `Rolls all configs requested, you may repeat the command multiple times in the same message (just ensure you close each roll with \`${config.postfix}\`)`,
					},
					{
						name: '`x` [Optional]',
						value: `Number of dice to roll, if omitted, 1 is used
Additionally, replace \`x\` with \`F\` to roll Fate dice`,
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
				title: 'Custom Dice Options',
				fields: [
					{
						name: 'CWOD Rolling',
						value: `\`${config.prefix}xcwody${config.postfix}\`
\`x\` - Number of CWOD dice to roll
\`y\` - Difficulty to roll at`,
						inline: true,
					},
					{
						name: 'OVA Rolling',
						value: `\`${config.prefix}xovady${config.postfix}\`
\`x\` - Number of OVA dice to roll
\`y\` - Size of the die to roll (defaults to 6 if omitted)`,
						inline: true,
					},
				],
			},
			{
				color: infoColor2,
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
	}).catch((e: Error) => utils.commonLoggers.messageSendError('rollHelp.ts:247', message, e));
};
