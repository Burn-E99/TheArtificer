import { ActionRow, botId, CreateMessage, Embed, MessageComponentTypes, SelectOption } from '@discordeno';

import config from '~config';

import { RootHelpPages } from 'commands/helpLibrary/_rootHelp.ts';
import { HelpContents, HelpDict, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

import { infoColor1 } from 'embeds/colors.ts';

import { InteractionValueSeparator } from 'events/interactionCreate.ts';

export const helpCustomId = 'help';

const generateActionRowWithSelectMenu = (selected: string, helpDict: HelpDict, parent?: string): ActionRow => ({
  type: MessageComponentTypes.ActionRow,
  components: [
    {
      type: MessageComponentTypes.SelectMenu,
      customId: `${helpCustomId}${InteractionValueSeparator}${selected}`,
      options: helpDict
        .entries()
        .toArray()
        .map(
          (page): SelectOption => ({
            label: page[1].name,
            value: parent ? `${parent}${InteractionValueSeparator}${page[0]}` : page[0],
            default: page[0] === selected,
          }),
        ),
    },
  ],
});

const makeHelpEmbed = (helpDict: HelpContents | HelpPage, parentTitle?: string): Embed => ({
  color: infoColor1,
  author: {
    name: `Roll Command Help${parentTitle ? ' - ' : ''}${parentTitle}`,
  },
  title: helpDict.name,
  description: helpDict.description,
  fields: !helpDict.isPage && helpDict.example
    ? [
      {
        name: `Example${helpDict.example.length > 1 ? 's' : ''}:`,
        value: helpDict.example.join('\n').replaceAll('@$', `<@${botId}>`).replaceAll('[[', config.prefix).replaceAll(']]', config.postfix),
      },
    ]
    : [],
});

const defaultHelpMessage = (showError = ''): CreateMessage => ({
  embeds: [
    {
      ...makeHelpEmbed(RootHelpPages),
      footer: {
        text: showError ? `Error${showError}: Something went wrong, please try again.` : '',
      },
    },
  ],
  components: [generateActionRowWithSelectMenu('', RootHelpPages.dict)],
});

export const generateHelpMessage = (helpPath?: string): CreateMessage => {
  if (helpPath) {
    const [page, item] = helpPath.split(InteractionValueSeparator);

    // Get the first layer dictionary
    const rootHelpDict = RootHelpPages.dict.get(page);
    if (!rootHelpDict || !rootHelpDict.isPage) return defaultHelpMessage('1');

    // Get second layer dictionary
    const helpDict = item ? rootHelpDict.dict.get(item) : rootHelpDict;
    if (!helpDict) return defaultHelpMessage('2');
    return {
      embeds: [makeHelpEmbed(helpDict, helpDict.isPage ? '' : rootHelpDict.name)],
      components: [
        generateActionRowWithSelectMenu(page, RootHelpPages.dict),
        helpDict.isPage ? generateActionRowWithSelectMenu('', helpDict.dict, page) : generateActionRowWithSelectMenu(item, rootHelpDict.dict, page),
      ],
    };
  } else {
    return defaultHelpMessage();
  }
};
