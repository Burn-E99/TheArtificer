import {
  ApplicationCommandInteractionDataOptionString,
  ApplicationCommandInteractionDataOptionSubCommand,
  ApplicationCommandInteractionDataOptionSubCommandGroup,
  DiscordenoMessage,
  DiscordMessageComponentTypes,
  editMessage,
  getMessage,
  Interaction,
  InteractionResponseTypes,
  InteractionTypes,
  MessageFlags,
  sendInteractionResponse,
  structures,
} from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import { Modifiers } from 'artigen/dice/getModifiers.ts';

import { repeatRollCustomId } from 'artigen/managers/handler/workerComplete.ts';

import { toggleWebView, webViewCustomId } from 'artigen/utils/embeds.ts';
import { argSpacesSplitRegex, withYVarsDash } from 'artigen/utils/escape.ts';

import { commands, slashCommandDetails } from 'commands/_index.ts';

import { generateHelpMessage, helpCustomId } from 'commands/helpLibrary/generateHelpMessage.ts';

import { failColor } from 'embeds/colors.ts';

import { messageCreateHandler } from 'events/messageCreate.ts';

import { SlashCommandInteractionWithGuildId } from 'src/mod.d.ts';

import utils from 'utils/utils.ts';

export const InteractionValueSeparator = '\u205a';

const ackInteraction = (interaction: Interaction) =>
  sendInteractionResponse(interaction.id, interaction.token, {
    type: InteractionResponseTypes.DeferredUpdateMessage,
  }).catch((e: Error) => utils.commonLoggers.messageSendError('interactionCreate.ts:26', interaction, e));

export const interactionCreateHandler = async (interaction: Interaction) => {
  try {
    if (interaction.type === InteractionTypes.MessageComponent && interaction.data) {
      if (interaction.data.customId.startsWith(helpCustomId) && interaction.data.componentType === DiscordMessageComponentTypes.SelectMenu) {
        // Acknowledge the request since we're editing the original message
        ackInteraction(interaction);

        // Edit original message
        editMessage(BigInt(interaction.channelId ?? '0'), BigInt(interaction.message?.id ?? '0'), generateHelpMessage(interaction.data.values[0])).catch((e) =>
          utils.commonLoggers.messageEditError('interactionCreate.ts:30', interaction, e)
        );
        return;
      }

      if (interaction.data.customId.startsWith(webViewCustomId) && interaction.message) {
        const ownerId = interaction.data.customId.split(InteractionValueSeparator)[1] ?? 'missingOwnerId';
        const userInteractingId = interaction.member?.user.id ?? interaction.user?.id ?? 'missingUserId';
        if (ownerId === userInteractingId) {
          ackInteraction(interaction);
          const enableWebView = interaction.data.customId.split(InteractionValueSeparator)[2] === 'enable';
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

      if (interaction.data.customId.startsWith(repeatRollCustomId) && interaction.message) {
        const ownerId = interaction.data.customId.split(InteractionValueSeparator)[1] ?? 'missingOwnerId';
        const userInteractingId = interaction.member?.user.id ?? interaction.user?.id ?? 'missingUserId';
        if (ownerId === userInteractingId) {
          const botMsg: DiscordenoMessage = await structures.createDiscordenoMessage(interaction.message);
          if (botMsg && botMsg.messageReference) {
            const rollMsg = await getMessage(BigInt(botMsg.messageReference.channelId ?? '0'), BigInt(botMsg.messageReference.messageId ?? '0')).catch((e) =>
              utils.commonLoggers.messageGetError(
                'interactionCreate.ts:92',
                botMsg.messageReference?.channelId ?? '0',
                botMsg.messageReference?.messageId ?? '0',
                e,
              )
            );
            if (rollMsg && !rollMsg.isBot) {
              ackInteraction(interaction);
              messageCreateHandler(rollMsg);
              return;
            }
          }

          if (botMsg && botMsg.embeds.length) {
            const rollEmbed = botMsg.embeds[0].description ?? '';
            const rollStrStartIdx = rollEmbed.indexOf('`') + 1;
            let rollStr = rollEmbed.substring(rollStrStartIdx, rollEmbed.indexOf('`', rollStrStartIdx));

            // Since we're dealing with a slash command, we can't get the original command (as far as I know), so rebuild the yVars for an alias using what is in the response message
            if (rollEmbed.includes(withYVarsDash)) {
              const yVarStartIdx = rollEmbed.indexOf(withYVarsDash) + 1;
              const yVarStr = rollEmbed.substring(rollEmbed.indexOf(':', yVarStartIdx) + 1, rollEmbed.indexOf('\n', yVarStartIdx)).trim();
              const yVars = yVarStr.split(' ').filter((x) => x);
              const yVarVals: string[] = [];
              for (const yVar of yVars) {
                const [_yVarName, yVarVal] = yVar.split('=');
                yVarVals.push(yVarVal);
              }
              rollStr += ` ${Modifiers.YVars} ${yVarVals.join(',')}`;
            }
            commands.roll(interaction, rollStr.split(argSpacesSplitRegex), '');
            return;
          }
        }

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
        return;
      }

      log(LT.WARN, `UNHANDLED COMPONENT!!! data: ${JSON.stringify(interaction.data)} | Full Interaction: ${JSON.stringify(interaction)}`);
    } else if (interaction.type === InteractionTypes.ApplicationCommand && interaction.data) {
      switch (interaction.data.name) {
        case slashCommandDetails.aliasSC.name: {
          // Per the config defined in aliasCmd.ts, there should always be 3 layers to the nesting, with the third's options being the values for the command
          // ex: alias => personal/guild => command => [...options]
          // Joining them back into one array with spaces between each to match the way the text command works, and since 'alias' will have been shifted out of the array, we start the array with a single spacer
          const argSpaces: string[] = [' '];
          const guildOrPersonalOpt = (interaction.data.options as ApplicationCommandInteractionDataOptionSubCommandGroup[])?.shift();
          if (!guildOrPersonalOpt) break;
          if (guildOrPersonalOpt.name === 'guild') {
            argSpaces.push('guild', ' ');
          }
          const commandOpt = (guildOrPersonalOpt.options as ApplicationCommandInteractionDataOptionSubCommand[])?.shift();
          if (!commandOpt) break;
          argSpaces.push(commandOpt.name);
          if (commandOpt.options?.length) {
            argSpaces.push(' ');
            for (const opt of commandOpt.options) {
              argSpaces.push(...opt.value.toString().trim().split(argSpacesSplitRegex));
              argSpaces.push(' ');
            }
          }
          const safeInteraction: SlashCommandInteractionWithGuildId = {
            guildId: '0',
            ...interaction,
          };
          commands.alias(safeInteraction, argSpaces);
          return;
        }
        case slashCommandDetails.heatmapSC.name:
          commands.heatmap(interaction);
          return;
        case slashCommandDetails.helpSC.name:
          commands.help(interaction);
          return;
        case slashCommandDetails.infoSC.name:
          commands.info(interaction);
          return;
        case slashCommandDetails.privacySC.name:
          commands.privacy(interaction);
          return;
        case slashCommandDetails.reportSC.name: {
          const option = (interaction.data.options as ApplicationCommandInteractionDataOptionString[])?.shift();
          const text = option ? option.value : '';
          commands.report(
            interaction,
            text
              .trim()
              .split(' ')
              .filter((x) => x),
          );
          return;
        }
        case slashCommandDetails.ripSC.name:
          commands.rip(interaction);
          return;
        case slashCommandDetails.rollSC.name: {
          const option = (interaction.data.options as ApplicationCommandInteractionDataOptionString[])?.shift();
          const text = option ? option.value : '';
          commands.roll(
            interaction,
            text
              .trim()
              .split(argSpacesSplitRegex)
              .filter((x) => x),
            '',
          );
          return;
        }
        case slashCommandDetails.statsSC.name:
          commands.stats(interaction);
          return;
        case slashCommandDetails.toggleInlineSC.name: {
          const option = (interaction.data.options as ApplicationCommandInteractionDataOptionSubCommand[])?.shift();
          const subCommand = option ? option.name : '';
          commands.toggleInline(interaction, [subCommand]);
          return;
        }
        case slashCommandDetails.versionSC.name:
          commands.version(interaction);
          return;
      }
      log(LT.WARN, `UNHANDLED APPLICATION COMMAND!!! data: ${JSON.stringify(interaction.data)} | Full Interaction: ${JSON.stringify(interaction)}`);
    } else {
      log(LT.WARN, `UNHANDLED INTERACTION!!! Missing data! ${JSON.stringify(interaction)} | Full Interaction: ${JSON.stringify(interaction)}`);
    }
  } catch (e) {
    log(LT.ERROR, `UNHANDLED INTERACTION!!! ERR! interaction: ${JSON.stringify(interaction)} error: ${JSON.stringify(e)}`);
  }
};
