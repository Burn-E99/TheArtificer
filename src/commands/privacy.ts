import { DiscordenoMessage } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor1 } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const privacy = (message: DiscordenoMessage) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('privacy')).catch((e) => utils.commonLoggers.dbError('privacy.ts:15', 'call sproc INC_CNT on', e));

  message
    .send({
      embeds: [
        {
          color: infoColor1,
          title: 'Privacy Policy',
          fields: [
            {
              name: `${config.name} does not track or collect user information via Discord.`,
              value:
                `The only user submitted information that is stored is submitted via the \`${config.prefix}report\` command.  This information is only stored for a short period of time in a location that only the Developer of ${config.name} can see.

For more details, please check out the Privacy Policy on the GitHub [here](${config.links.privacyPolicy}).

Terms of Service can also be found on GitHub [here](${config.links.termsOfService}).

Want me to ignore you?  Simply run \`${config.prefix}opt-out\` and ${config.name} will no longer read your messages or respond to you.`,
            },
          ],
        },
      ],
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('privacy.ts:33', message, e));
};
