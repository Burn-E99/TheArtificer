import {
  ButtonData,
  DiscordMessageComponentTypes,
  editMessage,
  Interaction,
  InteractionResponseTypes,
  SelectMenuData,
  sendInteractionResponse,
} from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import { generateHelpMessage, helpCustomId } from 'commands/helpLibrary/generateHelpMessage.ts';

import utils from 'utils/utils.ts';

export const InteractionValueSeparator = '\u205a';

export const interactionCreateHandler = (interaction: Interaction) => {
  try {
    if (interaction.data) {
      const parsedData = JSON.parse(JSON.stringify(interaction.data)) as SelectMenuData | ButtonData;

      if (parsedData.customId.startsWith(helpCustomId) && parsedData.componentType === DiscordMessageComponentTypes.SelectMenu) {
        // Acknowledge the request since we're editing the original message
        sendInteractionResponse(interaction.id, interaction.token, {
          type: InteractionResponseTypes.DeferredUpdateMessage,
        }).catch((e: Error) => utils.commonLoggers.messageEditError('interactionCreate.ts:26', interaction, e));

        // Edit original message
        editMessage(BigInt(interaction.channelId ?? '0'), BigInt(interaction.message?.id ?? '0'), generateHelpMessage(parsedData.values[0])).catch((e: Error) =>
          utils.commonLoggers.messageEditError('interactionCreate.ts:30', interaction, e)
        );
        return;
      }

      log(LT.WARN, `UNHANDLED INTERACTION!!! data: ${JSON.stringify(interaction.data)}`);
    } else {
      log(LT.WARN, `UNHANDLED INTERACTION!!! Missing data! ${JSON.stringify(interaction)}`);
    }
  } catch (e) {
    log(LT.ERROR, `UNHANDLED INTERACTION!!! ERR! interaction: ${JSON.stringify(interaction)} error: ${JSON.stringify(e)}`);
  }
};
