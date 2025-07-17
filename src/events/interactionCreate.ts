import {
  ButtonData,
  DiscordenoMessage,
  DiscordMessageComponentTypes,
  editMessage,
  getMessage,
  Interaction,
  InteractionResponseTypes,
  MessageFlags,
  SelectMenuData,
  sendInteractionResponse,
  structures,
} from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import { repeatRollCustomId } from 'artigen/managers/handler/workerComplete.ts';

import { toggleWebView, webViewCustomId } from 'artigen/utils/embeds.ts';

import { generateHelpMessage, helpCustomId } from 'commands/helpLibrary/generateHelpMessage.ts';

import { failColor } from 'embeds/colors.ts';

import { messageCreateHandler } from 'events/messageCreate.ts';

import utils from 'utils/utils.ts';

export const InteractionValueSeparator = '\u205a';

const ackInteraction = (interaction: Interaction) =>
  sendInteractionResponse(interaction.id, interaction.token, {
    type: InteractionResponseTypes.DeferredUpdateMessage,
  }).catch((e: Error) => utils.commonLoggers.messageSendError('interactionCreate.ts:26', interaction, e));

export const interactionCreateHandler = async (interaction: Interaction) => {
  try {
    if (interaction.data) {
      const parsedData = JSON.parse(JSON.stringify(interaction.data)) as SelectMenuData | ButtonData;

      if (parsedData.customId.startsWith(helpCustomId) && parsedData.componentType === DiscordMessageComponentTypes.SelectMenu) {
        // Acknowledge the request since we're editing the original message
        ackInteraction(interaction);

        // Edit original message
        editMessage(BigInt(interaction.channelId ?? '0'), BigInt(interaction.message?.id ?? '0'), generateHelpMessage(parsedData.values[0])).catch((e) =>
          utils.commonLoggers.messageEditError('interactionCreate.ts:30', interaction, e)
        );
        return;
      }

      if (parsedData.customId.startsWith(webViewCustomId) && interaction.message) {
        const ownerId = parsedData.customId.split(InteractionValueSeparator)[1] ?? 'missingOwnerId';
        const userInteractingId = interaction.member?.user.id ?? interaction.user?.id ?? 'missingUserId';
        if (ownerId === userInteractingId) {
          ackInteraction(interaction);
          const enableWebView = parsedData.customId.split(InteractionValueSeparator)[2] === 'enable';
          const ddMsg: DiscordenoMessage = await structures.createDiscordenoMessage(interaction.message);

          toggleWebView(ddMsg, ownerId, enableWebView);
        } else {
          sendInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseTypes.ChannelMessageWithSource,
            data: {
              flags: MessageFlags.Empheral,
              embeds: [
                {
                  color: failColor,
                  title: 'Not Allowed!',
                  description: 'Only the original user that requested this roll can disable/enable Web View.',
                },
              ],
            },
          }).catch((e) => utils.commonLoggers.messageSendError('interactionCreate.ts:57', interaction, e));
        }
        return;
      }

      if (parsedData.customId.startsWith(repeatRollCustomId) && interaction.message) {
        const ownerId = parsedData.customId.split(InteractionValueSeparator)[1] ?? 'missingOwnerId';
        const userInteractingId = interaction.member?.user.id ?? interaction.user?.id ?? 'missingUserId';
        if (ownerId === userInteractingId) {
          ackInteraction(interaction);
          const botMsg: DiscordenoMessage = await structures.createDiscordenoMessage(interaction.message);
          const rollMsg: DiscordenoMessage = await getMessage(
            BigInt(botMsg.messageReference?.channelId ?? '0'),
            BigInt(botMsg.messageReference?.messageId ?? '0'),
          );
          messageCreateHandler(rollMsg);
        } else {
          sendInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseTypes.ChannelMessageWithSource,
            data: {
              flags: MessageFlags.Empheral,
              embeds: [
                {
                  color: failColor,
                  title: 'Not Allowed!',
                  description: 'Only the original user that requested this roll can repeat it.',
                },
              ],
            },
          }).catch((e) => utils.commonLoggers.messageSendError('interactionCreate.ts:96', interaction, e));
        }
        return;
      }

      log(LT.WARN, `UNHANDLED INTERACTION!!! data: ${JSON.stringify(interaction.data)} | Full Interaction: ${JSON.stringify(interaction)}`);
    } else {
      log(LT.WARN, `UNHANDLED INTERACTION!!! Missing data! ${JSON.stringify(interaction)}`);
    }
  } catch (e) {
    log(LT.ERROR, `UNHANDLED INTERACTION!!! ERR! interaction: ${JSON.stringify(interaction)} error: ${JSON.stringify(e)}`);
  }
};
