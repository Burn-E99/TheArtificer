import { DiscordenoMessage } from '@discordeno';

import config from '~config';

import { ReservedWords } from 'commands/aliasCmd/reservedWords.ts';

import { infoColor1, infoColor2 } from 'embeds/colors.ts';

export const help = (message: DiscordenoMessage, guildMode: boolean) => {
  message.send({
    embeds: [
      {
        color: infoColor2,
        title: `${config.name}'s Roll Alias System Details:`,
        description: `This system allows you to save any roll string to a short, custom, memorable alias.

Currently, you may create up to \`${config.limits.alias.free.guild.toLocaleString()}\` per guild and \`${config.limits.alias.free.user.toLocaleString()}\` per user account.  This limit may increase or decrease in the future.

Aliases are case-insensitive (\`tEsT\` is stored as \`test\`, but can still be called as \`tEsT\`), have a max allowed length of \`${config.limits.alias.maxNameLength}\`, cannot include any spaces, and are not allowed to be named any of the following: \`${
          ReservedWords.join('`, `')
        }\``,
      },
      {
        color: infoColor1,
        title: 'Available Alias Commands:',
        description: `- If a command has an option listed like \`help/h/?\`, this means \`help\`, \`h\`, and \`?\` are all valid options for the command.
- \`[alias]\` indicates where you should put the desired alias to add, update, delete, or run.
- \`[rollstr...]\` indicates where you should put the roll string for add/ing/updating an alias.
- \`[yVars...?]\` indicates where you should put any numeric parameters needed for running the desired alias, separated by spaces.  If none are needed, omit this list.
        
All commands below are shown using the shorthand version of the Roll Alias command, but \`${config.prefix}rollalias\`, \`${config.prefix}ralias\`, \`${config.prefix}alias\`, and \`${config.prefix}rolla\` also work.

To view ${guildMode ? '' : 'non-'}guild mode commands, please run \`${config.prefix}ra ${guildMode ? '' : 'guild '}help\``,
        fields: [
          {
            name: `\`${config.prefix}ra ${guildMode ? 'guild ' : ''}help/h/?\``,
            value: 'This command.',
            inline: true,
          },
          {
            name: `\`${config.prefix}ra ${guildMode ? 'guild ' : ''}add/create/set [alias] [rollstr...]\``,
            value: `Creates a new alias with the specified roll string.  This is saved for use ${guildMode ? 'in only this guild' : 'by your account'}.`,
            inline: true,
          },
          {
            name: `\`${config.prefix}ra ${guildMode ? 'guild ' : ''}list/list-all\``,
            value: `Lists all aliases and their number of yVars created ${guildMode ? 'in this guild' : 'by you'}.`,
            inline: true,
          },
          {
            name: `\`${config.prefix}ra ${guildMode ? 'guild ' : ''}preview/view [alias]\``,
            value: `Shows the saved roll string for the specified ${guildMode ? 'guild ' : ''}alias.`,
            inline: true,
          },
          {
            name: `\`${config.prefix}ra ${guildMode ? 'guild ' : ''}update/replace [alias] [rollstr...]\``,
            value: `Updates the specified alias to the new roll string.  This overwrites the alias saved ${guildMode ? 'in this guild' : 'to your account'}.`,
            inline: true,
          },
          {
            name: `\`${config.prefix}ra ${guildMode ? 'guild ' : ''}delete/remove [alias]\``,
            value: `Deletes the specified alias from ${guildMode ? 'this guild' : 'your account'}.  This is a permanent deletion and cannot be undone.`,
            inline: true,
          },
          {
            name: `\`${config.prefix}ra ${guildMode ? 'guild ' : ''}delete-all/remove-all\``,
            value: `Deletes all aliases saved to ${guildMode ? 'this guild' : 'your account'}.  This is a permanent deletion and cannot be undone.`,
            inline: true,
          },
          {
            name: `\`${config.prefix}ra ${guildMode ? 'guild ' : ''}clone/copy [alias]`,
            value: `Copies the specified alias from ${guildMode ? 'this guild' : 'your account'} to ${guildMode ? 'your account' : 'this guild'}.`,
            inline: true,
          },
          {
            name: `\`${config.prefix}ra ${guildMode ? 'guild ' : ''}[alias] [yVars...?]\` or \`${config.prefix}ra ${guildMode ? 'guild ' : ''}run/execute [alias] [yVars...?]\``,
            value: `Runs the specified ${guildMode ? 'guild ' : ''}alias with the provided yVars.  yVars are only required if the alias specified requires them.`,
            inline: false,
          },
        ],
      },
    ],
  });
};
