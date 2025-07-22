import { SlashCommandInteraction } from '@discordeno';

export interface SlashCommandInteractionWithGuildId extends SlashCommandInteraction {
  guildId: string;
}
