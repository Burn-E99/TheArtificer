import { DiscordenoMessage } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor2 } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const help = (message: DiscordenoMessage) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('help')).catch((e) => utils.commonLoggers.dbError('help.ts:15', 'call sproc INC_CNT on', e));

  message
    .send({
      embeds: [
        {
          color: infoColor2,
          title: `${config.name}'s Available Commands:`,
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
              name: `\`${config.prefix}heatmap\``,
              value: 'Heatmap of when the roll command is run the most',
              inline: true,
            },
            {
              name: `\`${config.prefix}opt-out\` or \`${config.prefix}ignore-me\``,
              value: 'Adds you to an ignore list so the bot will never respond to you',
              inline: true,
            },
            {
              name: `\`${config.prefix}opt-in\` **Available via DM ONLY**`,
              value: 'Removes you from the ignore list',
              inline: true,
            },
            {
              name: `\`${config.prefix}xdydzracsq!${config.postfix}\` ...`,
              value:
                `Rolls all configs requested, you may repeat the command multiple times in the same message (just ensure you close each roll with \`${config.postfix}\`), run \`${config.prefix}??\` for more details`,
              inline: true,
            },
          ],
        },
      ],
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('help.ts:82', message, e));
};
