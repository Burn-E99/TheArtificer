import { CreateGlobalApplicationCommand, DiscordenoMessage, Interaction } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor1 } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const privacySC: CreateGlobalApplicationCommand = {
  name: 'privacy',
  description: 'Shows a summary of the Privacy Policy and Terms of Service, along with links to them.',
};

export const privacy = (msgOrInt: DiscordenoMessage | Interaction) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('privacy')).catch((e) => utils.commonLoggers.dbError('privacy.ts:15', 'call sproc INC_CNT on', e));

  utils.sendOrInteract(msgOrInt, 'privacy.ts:21', {
    embeds: [
      {
        color: infoColor1,
        title: 'Privacy Policy',
        fields: [
          {
            name: `${config.name} does not track or collect user information via Discord.`,
            value: `The only user submitted information that is stored is submitted via the \`${config.prefix}report\` command or the \`${config.prefix}rollalias\`/\`/alias\` commands.

For more details, please check out the Privacy Policy on the GitHub [here](${config.links.privacyPolicy}).

Terms of Service can also be found on GitHub [here](${config.links.termsOfService}).

Want me to ignore you?  Simply run \`${config.prefix}opt-out\` and ${config.name} will no longer read your messages or respond to you.`,
          },
        ],
      },
    ],
  });
};
