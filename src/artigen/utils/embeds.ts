import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { SolvedRoll } from 'artigen/artigen.d.ts';

import { CountDetails, RollModifiers } from 'artigen/dice/dice.d.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { failColor, infoColor1, infoColor2 } from 'embeds/colors.ts';

export const rollingEmbed = {
  embeds: [
    {
      color: infoColor1,
      title: 'Rolling . . .',
    },
  ],
};

export const generateDMFailed = (user: bigint) => ({
  embeds: [
    {
      color: failColor,
      title: `WARNING: <@${user}> could not be messaged.`,
      description: 'If this issue persists, make sure direct messages are allowed from this server.',
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
