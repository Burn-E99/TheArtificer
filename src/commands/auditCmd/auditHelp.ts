import { DiscordenoMessage } from '@discordeno';

import config from '~config';

import { infoColor1 } from 'embeds/colors.ts';

import utils from 'src/utils.ts';

export const auditHelp = (message: DiscordenoMessage) => {
  message
    .send({
      embeds: [
        {
          color: infoColor1,
          title: 'Audit Help',
          fields: [
            {
              name: `\`${config.prefix}audit help\``,
              value: 'This command',
              inline: true,
            },
            {
              name: `\`${config.prefix}audit db\``,
              value: 'Shows current DB table sizes',
              inline: true,
            },
            {
              name: `\`${config.prefix}audit guilds\``,
              value: 'Shows breakdown of guilds and details on them',
              inline: true,
            },
          ],
        },
      ],
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('auditHelp.ts:35', message, e));
};
