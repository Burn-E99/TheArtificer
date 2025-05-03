import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { SolvedRoll } from 'artigen/artigen.d.ts';

import { CountDetails, RollModifiers } from 'artigen/dice/dice.d.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';

export const failColor = 0xe71212;
export const warnColor = 0xe38f28;
export const successColor = 0x0f8108;
export const infoColor1 = 0x313bf9;
export const infoColor2 = 0x6805e9;

export const rollingEmbed = {
  embeds: [
    {
      color: infoColor1,
      title: 'Rolling . . .',
    },
  ],
};

export const generatePing = (time: number) => ({
  embeds: [
    {
      color: infoColor1,
      title: time === -1 ? 'Ping?' : `Pong! Latency is ${time}ms.`,
    },
  ],
});

export const generateReport = (msg: string) => ({
  embeds: [
    {
      color: infoColor2,
      title: 'USER REPORT:',
      description: msg || 'No message',
    },
  ],
});

export const generateStats = (
  guildCount: number,
  channelCount: number,
  memberCount: number,
  rollCount: bigint,
  utilityCount: bigint,
  rollRate: number,
  utilityRate: number,
  queryTimeMs: number,
) => ({
  embeds: [
    {
      color: infoColor2,
      title: `${config.name}'s Statistics:`,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: 'Guilds:',
          value: `${guildCount.toLocaleString()}`,
          inline: true,
        },
        {
          name: 'Channels:',
          value: `${channelCount.toLocaleString()}`,
          inline: true,
        },
        {
          name: 'Active Members:',
          value: `${memberCount.toLocaleString()}`,
          inline: true,
        },
        {
          name: 'Roll Commands:',
          value: `${rollCount.toLocaleString()}\n(${Math.abs(rollRate).toFixed(2)} per hour)`,
          inline: true,
        },
        {
          name: 'Utility Commands:',
          value: `${utilityCount.toLocaleString()}\n(${Math.abs(utilityRate).toFixed(2)} per hour)`,
          inline: true,
        },
      ],
      footer: {
        text: `Total query time: ${queryTimeMs}ms`,
      },
    },
  ],
});

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

export const generateDMFailed = (user: bigint) => ({
  embeds: [
    {
      color: failColor,
      title: `WARNING: <@${user}> could not be messaged.`,
      description: 'If this issue persists, make sure direct messages are allowed from this server.',
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

export const generateRollError = (errorType: string, errorName: string, errorMsg: string) => ({
  embeds: [
    {
      color: failColor,
      title: 'Roll command encountered the following error:',
      fields: [
        {
          name: errorType,
          value: `${errorMsg}\n\nPlease try again.  If the error is repeated, please report the issue using the \`${config.prefix}report\` command.`,
        },
      ],
      footer: {
        text: errorName,
      },
    },
  ],
});

export const generateCountDetailsEmbed = (counts: CountDetails) => ({
  color: infoColor1,
  title: 'Roll Count Details:',
  fields: [
    {
      name: 'Total Rolls:',
      value: `${counts.total}`,
      inline: true,
    },
    {
      name: 'Successful Rolls:',
      value: `${counts.successful}`,
      inline: true,
    },
    {
      name: 'Failed Rolls:',
      value: `${counts.failed}`,
      inline: true,
    },
    {
      name: 'Rerolled Dice:',
      value: `${counts.rerolled}`,
      inline: true,
    },
    {
      name: 'Dropped Dice:',
      value: `${counts.dropped}`,
      inline: true,
    },
    {
      name: 'Exploded Dice:',
      value: `${counts.exploded}`,
      inline: true,
    },
  ],
});

export const generateRollEmbed = async (authorId: bigint, returnDetails: SolvedRoll, modifiers: RollModifiers) => {
  if (returnDetails.error) {
    // Roll had an error, send error embed
    return {
      embed: {
        color: failColor,
        title: 'Roll failed:',
        description: `${returnDetails.errorMsg}`,
        footer: {
          text: `Code: ${returnDetails.errorCode}`,
        },
      },
      hasAttachment: false,
      attachment: {
        blob: await new Blob(['' as BlobPart], { type: 'text' }),
        name: 'rollDetails.txt',
      },
    };
  } else {
    if (modifiers.gmRoll) {
      // Roll is a GM Roll, send this in the pub channel (this funciton will be ran again to get details for the GMs)
      return {
        embed: {
          color: infoColor2,
          description: `<@${authorId}>${returnDetails.line1}\n\nResults have been messaged to the following GMs: ${
            modifiers.gms
              .map((gm) => (gm.startsWith('<') ? gm : `<@${gm}>`))
              .join(' ')
          }`,
        },
        hasAttachment: false,
        attachment: {
          blob: await new Blob(['' as BlobPart], { type: 'text' }),
          name: 'rollDetails.txt',
        },
      };
    } else {
      // Roll is normal, make normal embed
      const line2Details = returnDetails.line2.split(': ');
      let details = '';

      if (!modifiers.superNoDetails) {
        if (modifiers.noDetails) {
          details = `**Details:**\nSuppressed by -nd flag`;
        } else {
          details = `**Details:**\n${modifiers.spoiler}${returnDetails.line3}${modifiers.spoiler}`;
          loggingEnabled && log(LT.LOG, `${returnDetails.line3} |&| ${details}`);
        }
      }

      const baseDesc = `<@${authorId}>${returnDetails.line1}\n**${line2Details.shift()}:**\n${line2Details.join(': ')}`;

      // Embed desc limit is 4096
      if (baseDesc.length + details.length < 4090) {
        return {
          embed: {
            color: infoColor2,
            description: `${baseDesc}\n\n${details}`,
          },
          hasAttachment: false,
          attachment: {
            blob: await new Blob(['' as BlobPart], { type: 'text' }),
            name: 'rollDetails.txt',
          },
        };
      } else {
        // If its too big, collapse it into a .txt file and send that instead.
        const b = await new Blob([`${baseDesc}\n\n${details}` as BlobPart], { type: 'text' });
        details = 'Details have been omitted from this message for being over 4000 characters.';
        if (b.size > 8388290) {
          details +=
            '\n\nFull details could not be attached to this messaged as a `.txt` file as the file would be too large for Discord to handle.  If you would like to see the details of rolls, please send the rolls in multiple messages instead of bundled into one.';
          return {
            embed: {
              color: infoColor2,
              description: `${baseDesc}\n\n${details}`,
            },
            hasAttachment: false,
            attachment: {
              blob: await new Blob(['' as BlobPart], { type: 'text' }),
              name: 'rollDetails.txt',
            },
          };
        } else {
          details += '\n\nFull details have been attached to this messaged as a `.txt` file for verification purposes.';
          return {
            embed: {
              color: infoColor2,
              description: `${baseDesc}\n\n${details}`,
            },
            hasAttachment: true,
            attachment: {
              blob: b,
              name: 'rollDetails.txt',
            },
          };
        }
      }
    }
  }
};
