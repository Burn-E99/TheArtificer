import { CreateMessage } from '@discordeno';

import config from '~config';

import { failColor } from 'embeds/colors.ts';

export const generateAliasError = (customMessage: string, customId: string): CreateMessage => ({
  embeds: [
    {
      color: failColor,
      title: 'Something went wrong!',
      description: `The Alias System has encountered an error:
- ${customMessage}

Please try again.  If this continues to happen, please \`${config.prefix}report\` the error code to the developer.`,
      footer: {
        text: `Error Code: ${customId}`,
      },
    },
  ],
});
