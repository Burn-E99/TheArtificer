import config from '~config';

import { failColor, infoColor1, successColor } from 'embeds/colors.ts';

export const generateApiFailed = (args: string) => ({
  embeds: [
    {
      color: failColor,
      title: `Failed to ${args} API rolls for this guild.`,
      description: 'If this issue persists, please report this to the developers.',
    },
  ],
});

export const generateApiStatus = (banned: boolean, active: boolean) => {
  const apiStatus = active ? 'allowed' : 'blocked from being used';
  return {
    embeds: [
      {
        color: infoColor1,
        title: `${config.name}'s API is ${config.api.enable ? 'currently enabled' : 'currently disabled'}.`,
        description: banned ? 'API rolls are banned from being used in this guild.\n\nThis will not be reversed.' : `API rolls are ${apiStatus} in this guild.`,
      },
    ],
  };
};

export const generateApiSuccess = (args: string) => ({
  embeds: [
    {
      color: successColor,
      title: `API rolls have successfully been ${args} for this guild.`,
    },
  ],
});

export const generateApiKeyEmail = (email: string, key: string) => ({
  content: `<@${config.api.admin}> A USER HAS REQUESTED AN API KEY`,
  embeds: [
    {
      color: infoColor1,
      fields: [
        {
          name: 'Send to:',
          value: email,
        },
        {
          name: 'Subject:',
          value: `${config.name} API Key`,
        },
        {
          name: 'Body:',
          value: `Hello ${config.name} API User,

Welcome aboard ${config.name}'s API.  You can find full details about the API on the GitHub: ${config.links.sourceCode}

Your API Key is: ${key}

Guard this well, as there is zero tolerance for API abuse.

Welcome aboard,
${config.name} Developer - Ean Milligan`,
        },
      ],
    },
  ],
});

export const generateApiDeleteEmail = (email: string, deleteCode: string) => ({
  content: `<@${config.api.admin}> A USER HAS REQUESTED A DELETE CODE`,
  embeds: [
    {
      color: infoColor1,
      fields: [
        {
          name: 'Send to:',
          value: email,
        },
        {
          name: 'Subject:',
          value: `${config.name} API Delete Code`,
        },
        {
          name: 'Body:',
          value: `Hello ${config.name} API User,

I am sorry to see you go.  If you would like, please respond to this email detailing what I could have done better.

As requested, here is your delete code: ${deleteCode}

Sorry to see you go,
${config.name} Developer - Ean Milligan`,
        },
      ],
    },
  ],
});
