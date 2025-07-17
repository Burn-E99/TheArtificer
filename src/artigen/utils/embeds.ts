import { ButtonStyles, CreateMessage, DiscordenoMessage, EmbedField, MessageComponentTypes } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { ArtigenEmbedNoAttachment, ArtigenEmbedWithAttachment, SolvedRoll } from 'artigen/artigen.d.ts';

import { CountDetails, RollDistributionMap, RollModifiers } from 'artigen/dice/dice.d.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { basicReducer } from 'artigen/utils/reducers.ts';

import { failColor, infoColor1, infoColor2 } from 'embeds/colors.ts';

import { InteractionValueSeparator } from 'events/interactionCreate.ts';

import utils from 'utils/utils.ts';

export const rollingEmbed: CreateMessage = {
  embeds: [
    {
      color: infoColor1,
      title: 'Rolling . . .',
    },
  ],
};

export const generateDMFailed = (user: bigint): CreateMessage => ({
  embeds: [
    {
      color: failColor,
      title: `WARNING: <@${user}> could not be messaged.`,
      description: 'If this issue persists, make sure direct messages are allowed from this server.',
    },
  ],
});

export const generateRollError = (errorType: string, errorName: string, errorMsg: string): CreateMessage => ({
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

export const generateCountDetailsEmbed = (counts: CountDetails): ArtigenEmbedNoAttachment => {
  const title = 'Roll Count Details:';
  const fields: EmbedField[] = [
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
  ];

  return {
    charCount: title.length + fields.map((field) => field.name.length + field.value.length).reduce(basicReducer, 0),
    embed: {
      color: infoColor1,
      title,
      fields,
    },
    hasAttachment: false,
  };
};

const getDistName = (key: string) => {
  const [type, size] = key.split('-');
  switch (type) {
    case 'fate':
      return 'Fate dice';
    case 'cwod':
      return `CWOD d${size}`;
    case 'ova':
      return `OVA d${size}`;
    case 'custom':
      return `Custom d${size}`;
    default:
      return `d${size}`;
  }
};

export const generateRollDistsEmbed = (rollDists: RollDistributionMap): ArtigenEmbedNoAttachment | ArtigenEmbedWithAttachment => {
  const fields = rollDists
    .entries()
    .toArray()
    .map(([key, distArr]) => {
      const total = distArr.reduce(basicReducer, 0);
      return {
        name: `${getDistName(key)} (Total rolls: ${total}):`,
        value: distArr
          .map((cnt, dieIdx) => key.startsWith('custom') && cnt === 0 ? '' : `${key.startsWith('fate') ? dieIdx - 1 : dieIdx + 1}: ${cnt} (${((cnt / total) * 100).toFixed(1)}%)`)
          .filter((x) => x)
          .join('\n'),
        inline: true,
      };
    });
  const rollDistTitle = 'Roll Distributions:';

  const totalSize = fields.map((field) => field.name.length + field.value.length).reduce(basicReducer, 0);
  if (totalSize > 4_000 || fields.length > 25 || fields.some((field) => field.name.length > 256 || field.value.length > 1024)) {
    const rollDistBlob = new Blob([fields.map((field) => `# ${field.name}\n${field.value}`).join('\n\n') as BlobPart], { type: 'text' });
    let rollDistErrDesc = 'The roll distribution was omitted from this message as it was over 4,000 characters, ';
    if (rollDistBlob.size > config.maxFileSize) {
      rollDistErrDesc +=
        'and was too large to be attached as the file would be too large for Discord to handle.  If you would like to see the roll distribution details, please simplify or send the rolls in multiple messages.';
      return {
        charCount: rollDistTitle.length + rollDistErrDesc.length,
        embed: {
          color: failColor,
          title: rollDistTitle,
          description: rollDistErrDesc,
        },
        hasAttachment: false,
      };
    } else {
      rollDistErrDesc += 'and has been attached to a followup message as a formatted `.md` file.';
      return {
        charCount: rollDistTitle.length + rollDistErrDesc.length,
        embed: {
          color: failColor,
          title: rollDistTitle,
          description: rollDistErrDesc,
        },
        hasAttachment: true,
        attachment: {
          name: 'rollDistributions.md',
          blob: rollDistBlob,
        },
      };
    }
  }

  return {
    charCount: rollDistTitle.length + totalSize,
    embed: {
      color: infoColor1,
      title: rollDistTitle,
      fields,
    },
    hasAttachment: false,
  };
};

export const generateRollEmbed = (
  authorId: bigint,
  returnDetails: SolvedRoll,
  modifiers: RollModifiers,
): ArtigenEmbedNoAttachment | ArtigenEmbedWithAttachment => {
  if (returnDetails.error) {
    // Roll had an error, send error embed
    const errTitle = 'Roll failed:';
    const errDesc = `${returnDetails.errorMsg}`;
    const errCode = `Code: ${returnDetails.errorCode}`;

    return {
      charCount: errTitle.length + errDesc.length + errCode.length,
      embed: {
        color: failColor,
        title: errTitle,
        description: errDesc,
        footer: {
          text: errCode,
        },
      },
      hasAttachment: false,
    };
  }

  const line1Details = modifiers.hideRaw ? '' : `<@${authorId}>${returnDetails.line1}\n\n`;
  if (modifiers.gmRoll) {
    // Roll is a GM Roll, send this in the pub channel (this funciton will be ran again to get details for the GMs)
    const desc = `${line1Details}${line1Details ? '\n' : ''}Results have been messaged to the following GMs: ${
      modifiers.gms
        .map((gm) => (gm.startsWith('<') ? gm : `<@${gm}>`))
        .join(' ')
    }`;

    return {
      charCount: desc.length,
      embed: {
        color: infoColor2,
        description: desc,
      },
      hasAttachment: false,
    };
  }

  // Roll is normal, make normal embed
  const line2Details = returnDetails.line2.split(': ');
  let details = '';

  if (!modifiers.superNoDetails) {
    details = `**Details:**\n${modifiers.spoiler}${returnDetails.line3}${modifiers.spoiler}`;
    loggingEnabled && log(LT.LOG, `${returnDetails.line3} |&| ${details}`);
  }

  const baseDesc = `${line1Details}**${line2Details.shift()}:**\n${line2Details.join(': ')}`;
  const fullDesc = `${baseDesc}\n\n${details}`;

  const formattingCount = (fullDesc.match(/(\*\*)|(__)|(~~)|(`)/g) ?? []).length / 2 + (fullDesc.match(/(<@)|(<#)/g) ?? []).length;

  // Embed desc limit is 4096
  // Discord only formats 200 items per message
  if (fullDesc.length < 4_000 && formattingCount <= 200) {
    // Response is valid size
    return {
      charCount: fullDesc.length,
      embed: {
        color: infoColor2,
        description: fullDesc,
      },
      hasAttachment: false,
    };
  }

  // Response is too big, collapse it into a .md file and send that instead.
  const b = new Blob([fullDesc as BlobPart], { type: 'text' });
  details = `${baseDesc}\n\nDetails have been omitted from this message for ${fullDesc.length < 4_000 ? 'being over 4,000 characters' : 'having over 200 formatted items'}.`;
  if (b.size > config.maxFileSize) {
    // blob is too big, don't attach it
    details +=
      '\n\nFull details could not be attached as the file would be too large for Discord to handle.  If you would like to see the details of rolls, please simplify or send the rolls in multiple messages.';
    return {
      charCount: details.length,
      embed: {
        color: infoColor2,
        description: details,
      },
      hasAttachment: false,
    };
  }

  // blob is small enough, attach it
  details += '\n\nFull details have been attached to a followup message as a formatted `.md` file for verification purposes.';
  return {
    charCount: details.length,
    embed: {
      color: infoColor2,
      description: details,
    },
    hasAttachment: true,
    attachment: {
      blob: b,
      name: 'rollDetails.md',
    },
  };
};

export const webViewCustomId = 'webview';
export const disabledStr = 'disabled';
export const toggleWebView = (attachmentMessage: DiscordenoMessage, ownerId: string, enableWebView: boolean) => {
  attachmentMessage
    .edit({
      embeds: [
        {
          ...attachmentMessage.embeds[0],
          fields: [
            {
              name: 'Web View:',
              value: enableWebView ? `[Open Web View](${config.api.publicDomain}api/webview?c=${attachmentMessage.channelId}&m=${attachmentMessage.id})` : `Web View is ${disabledStr}.`,
            },
          ],
        },
      ],
      components: [
        {
          type: MessageComponentTypes.ActionRow,
          components: [
            {
              type: MessageComponentTypes.Button,
              label: enableWebView ? 'Disable Web View' : 'Enable Web View',
              customId: `${webViewCustomId}${InteractionValueSeparator}${ownerId}${InteractionValueSeparator}${enableWebView ? 'disable' : 'enable'}`,
              style: ButtonStyles.Secondary,
            },
          ],
        },
      ],
    })
    .catch((e) => utils.commonLoggers.messageEditError('embeds.ts:304', attachmentMessage, e));
};
