import { DiscordenoMessage } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor1, infoColor2, successColor } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const rollHelp = (message: DiscordenoMessage) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('rollhelp')).catch((e) => utils.commonLoggers.dbError('rollHelp.ts:15', 'call sproc INC_CNT on', e));

  message
    .send({
      embeds: [
        {
          color: infoColor1,
          title: `${config.name}'s Roll Command Details:`,
          description: `You can chain as many of these options as you want, as long as the option does not disallow it.

This command also can fully solve math equations with parenthesis.

${config.name} supports most of the [Roll20 formatting](${config.links.roll20Formatting}).  More details and examples can be found [here](${config.links.roll20Formatting}).

Run \`[[???\` or \`[[rollDecorators\` for details on the roll decorators.`,
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
              name: '`rq` or `r=q` [Optional]',
              value: 'Rerolls any rolls that match `q`, `r3` will reroll every die that land on 3, throwing out old rolls, cannot be used with `ro`',
              inline: true,
            },
            {
              name: '`r<q` [Optional]',
              value: 'Rerolls any rolls that are less than or equal to `q`, `r3` will reroll every die that land on 3, 2, or 1, throwing out old rolls, cannot be used with `ro`',
              inline: true,
            },
            {
              name: '`r>q` [Optional]',
              value: 'Rerolls any rolls that are greater than or equal to `q`, `r3` will reroll every die that land on 3 or greater, throwing out old rolls, cannot be used with `ro`',
              inline: true,
            },
            {
              name: '`roq` or `ro=q` [Optional]',
              value: 'Rerolls any rolls that match `q`, `ro3` will reroll each die that lands on 3 ONLY ONE TIME, throwing out old rolls, cannot be used with `r`',
              inline: true,
            },
            {
              name: '`ro<q` [Optional]',
              value: 'Rerolls any rolls that are less than or equal to `q`, `ro3` will reroll each die that lands on 3, 2, or 1 ONLY ONE TIME, throwing out old rolls, cannot be used with `r`',
              inline: true,
            },
            {
              name: '`ro>q` [Optional]',
              value: 'Rerolls any rolls that are greater than or equal to `q`, `ro3` will reroll each die that lands on 3 or greater ONLY ONE TIME, throwing out old rolls, cannot be used with `r`',
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
              name: '`!p` [Optional]',
              value: 'Penetrating Explosion, rolls one `dy` for each crit success, but subtracts one from each resulting explosion',
              inline: true,
            },
            {
              name: '`!!` [Optional]',
              value: 'Compounding Explosion, rolls one `dy` for each crit success, but adds the resulting explosion to the die that caused this explosion',
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
          ],
        },
        {
          color: infoColor2,
          fields: [
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
            {
              name: '`!p=u` [Optional]',
              value: 'Penetrating Explosion on `u`, rolls one `dy` for each die that lands on `u`, but subtracts one from each resulting explosion',
              inline: true,
            },
            {
              name: '`!p>u` [Optional]',
              value: 'Penetrating Explosion on `u` and greater, rolls one `dy` for each die that lands on `u` or greater, but subtracts one from each resulting explosion',
              inline: true,
            },
            {
              name: '`!p<u` [Optional]',
              value: 'Penetrating Explosion on `u` and under, rolls one `dy` for each die that lands on `u` or under, but subtracts one from each resulting explosion',
              inline: true,
            },
            {
              name: '`!!=u` [Optional]',
              value: 'Compounding Explosion on `u`, rolls one `dy` for each die that lands on `u`, but adds the resulting explosion to the die that caused this explosion',
              inline: true,
            },
            {
              name: '`!!>u` [Optional]',
              value: 'Compounding Explosion on `u` and greater, rolls one `dy` for each die that lands on `u` or greater, but adds the resulting explosion to the die that caused this explosion',
              inline: true,
            },
            {
              name: '`!!<u` [Optional]',
              value: 'Compounding Explosion on `u` and under, rolls one `dy` for each die that lands on `u` or under, but adds the resulting explosion to the die that caused this explosion',
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
            {
              name: 'Exclamation mark (`!`)',
              value: 'Rolls that were caused by an explosion have an exclamation mark (`!`) after them.',
              inline: true,
            },
          ],
        },
      ],
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('rollHelp.ts:247', message, e));
};
