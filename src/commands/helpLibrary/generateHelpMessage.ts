import { ActionRow, botId, CreateMessage, Embed, MessageComponentTypes, SelectOption } from '@discordeno';

import config from '~config';

import { HelpContents, HelpDict, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

import { RootHelpPages } from 'commands/helpLibrary/_rootHelp.ts';

import { infoColor1 } from 'embeds/colors.ts';

import { InteractionValueSeparator } from 'events/interactionCreate.ts';

export const helpCustomId = 'help';
const homeId = 'home';

const generateActionRowWithSelectMenu = (selected: string, helpDict: HelpDict, parent?: string): ActionRow => ({
  type: MessageComponentTypes.ActionRow,
  components: [
    {
      type: MessageComponentTypes.SelectMenu,
      customId: `${helpCustomId}${InteractionValueSeparator}${selected}`,
      options: [
        {
          label: 'Home',
          value: parent ? `${parent}${InteractionValueSeparator}${homeId}` : homeId,
          default: selected === '',
        },
        ...helpDict
          .entries()
          .toArray()
          .map(
            (page): SelectOption => ({
              label: page[1].name,
              value: parent ? `${parent}${InteractionValueSeparator}${page[0]}` : page[0],
              default: page[0] === selected,
            }),
          ),
      ],
    },
  ],
});

const makeHelpEmbed = (helpDict: HelpContents | HelpPage, parentTitle?: string): Embed => ({
  color: infoColor1,
  author: {
    name: parentTitle ? `Help > ${parentTitle}` : 'Help',
  },
  title: helpDict.name,
  description: helpDict.description.replaceAll('@$', `<@${botId}>`).replaceAll('[[', config.prefix).replaceAll(']]', config.postfix),
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
  if (!helpPath) return defaultHelpMessage();

  const path = helpPath
    .replaceAll(homeId, '')
    .split(InteractionValueSeparator)
    .filter((x) => x);
  const page = path.shift();
  const item = path.shift();
  const subItem = path.shift();

  if (!page) return defaultHelpMessage();

  // Get the first layer dictionary
  const rootHelpDict = RootHelpPages.dict.get(page);
  if (!rootHelpDict) return defaultHelpMessage('1');

  if (!rootHelpDict.isPage) {
    return {
      embeds: [makeHelpEmbed(rootHelpDict)],
      components: [generateActionRowWithSelectMenu(page, RootHelpPages.dict)],
    };
  }

  if (!item) {
    return {
      embeds: [makeHelpEmbed(rootHelpDict)],
      components: [generateActionRowWithSelectMenu(page, RootHelpPages.dict), generateActionRowWithSelectMenu('', rootHelpDict.dict, page)],
    };
  }

  // Get second layer dictionary
  const helpDict = rootHelpDict.dict.get(item);
  if (!helpDict) return defaultHelpMessage('2');

  if (!helpDict.isPage) {
    return {
      embeds: [makeHelpEmbed(helpDict, rootHelpDict.name)],
      components: [generateActionRowWithSelectMenu(page, RootHelpPages.dict), generateActionRowWithSelectMenu(item, rootHelpDict.dict, page)],
    };
  }

  if (!subItem) {
    return {
      embeds: [makeHelpEmbed(helpDict, rootHelpDict.name)],
      components: [
        generateActionRowWithSelectMenu(page, RootHelpPages.dict),
        generateActionRowWithSelectMenu(item, rootHelpDict.dict, page),
        generateActionRowWithSelectMenu('', helpDict.dict, `${page}${InteractionValueSeparator}${item}`),
      ],
    };
  }

  // Get third layer dictionary
  const helpItem = helpDict.dict.get(subItem);
  if (!helpItem) return defaultHelpMessage('3');

  return {
    embeds: [makeHelpEmbed(helpItem, `${rootHelpDict.name} > ${helpItem.isPage ? '' : helpDict.name}`)],
    components: [
      generateActionRowWithSelectMenu(page, RootHelpPages.dict),
      generateActionRowWithSelectMenu(item, rootHelpDict.dict, page),
      generateActionRowWithSelectMenu(subItem, helpDict.dict, `${page}${InteractionValueSeparator}${item}`),
    ],
  };
};
