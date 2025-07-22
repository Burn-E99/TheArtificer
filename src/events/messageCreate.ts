import { botId, DiscordenoMessage } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { commands } from 'commands/_index.ts';

import { ignoreList, inlineList } from 'db/common.ts';
import { argSpacesSplitRegex } from 'artigen/utils/escape.ts';

export const messageCreateHandler = (message: DiscordenoMessage) => {
  // Ignore all other bots
  if (message.isBot) return;

  // Ignore users who requested to be ignored
  if (ignoreList.includes(message.authorId) && (!message.content.startsWith(`${config.prefix}opt-in`) || message.guildId !== 0n)) return;

  // Ignore all messages that are not commands
  if (message.content.indexOf(config.prefix) !== 0) {
    // Handle @bot messages
    if (message.mentionedUserIds[0] === botId && (message.content.trim().startsWith(`<@${botId}>`) || message.content.trim().startsWith(`<@!${botId}>`))) {
      commands.handleMentions(message);
    }

    // Handle inline guilds if allowed
    if (inlineList.includes(message.guildId) && message.content.includes(config.prefix) && message.content.includes(config.prefix)) {
      commands.roll(
        message,
        message.content
          .trim()
          .split(argSpacesSplitRegex)
          .filter((x) => x),
        '',
      );
    }
    // return as we are done handling this message
    return;
  }

  log(LT.LOG, `Handling ${config.prefix}command message: ${JSON.stringify(message)}`);

  const sliceLength = message.content.startsWith(config.prefix) ? config.prefix.length : 0;
  // Split into standard command + args format
  const args = message.content
    .slice(sliceLength)
    .trim()
    .split(/[ \n]+/g);
  const argSpaces = message.content
    .slice(sliceLength)
    .trim()
    .split(argSpacesSplitRegex)
    .filter((x) => x);
  const command = args.shift()?.toLowerCase();
  argSpaces.shift();

  // All commands below here
  switch (command) {
    case 'opt-out':
    case 'ignore-me':
      // [[opt-out or [[ignore-me
      // Tells the bot to add you to the ignore list.
      commands.optOut(message);
      break;
    case 'opt-in':
      // [[opt-in
      // Tells the bot to remove you from the ignore list.
      commands.optIn(message);
      break;
    case 'ping':
      // [[ping
      // Its a ping test, what else do you want.
      commands.ping(message);
      break;
    case 'rip':
    case 'memory':
      // [[rip [[memory
      // Displays a short message I wanted to include
      commands.rip(message);
      break;
    case 'rolldecorators':
    case 'rd':
    case 'dr':
    case '???':
      // [[rollDecorators or [[rd or [[dr or [[???
      // Opens help library specifically to decorators page for legacy command support
      commands.rollHelp(message, 'decorators');
      break;
    case 'rollhelp':
    case 'rh':
    case 'hr':
    case '??':
      // [[rollhelp or [[rh or [[hr or [[??
      // Help command specifically for the roll command
      commands.rollHelp(message);
      break;
    case 'help':
    case 'h':
    case '?':
      // [[help or [[h or [[?
      // Help command, prints from help file
      commands.help(message);
      break;
    case 'info':
    case 'i':
      // [[info or [[i
      // Info command, prints short desc on bot and some links
      commands.info(message);
      break;
    case 'privacy':
    case 'tos':
      // [[privacy
      // Privacy command, prints short desc on bot's privacy policy
      commands.privacy(message);
      break;
    case 'version':
    case 'v':
      // [[version or [[v
      // Returns version of the bot
      commands.version(message);
      break;
    case 'report':
    case 're':
      // [[report or [[re (command that failed)
      // Manually report a failed roll
      commands.report(message, args);
      break;
    case 'stats':
    case 's':
      // [[stats or [[s
      // Displays stats on the bot
      commands.stats(message);
      break;
    case 'api':
      // [[api arg
      // API sub commands
      commands.api(message, args);
      break;
    case 'audit':
      // [[audit arg
      // Audit sub commands
      commands.audit(message, args);
      break;
    case 'heatmap':
    case 'hm':
      // [[heatmap or [[hm
      // Audit sub commands
      commands.heatmap(message);
      break;
    case 'inline':
      // [[inline arg
      // Enable or Disable inline rolling
      commands.toggleInline(message, args);
      break;
    case 'rollalias':
    case 'ralias':
    case 'alias':
    case 'rolla':
    case 'ra':
      // [[rollalias, [[ralias, [[rolla, or [[ra args
      // Manage and roll using aliases
      commands.alias(message, argSpaces);
      break;
    case 'roll':
    case 'r':
      // [[roll or [[r
      // Dice rolling commence!
      commands.roll(message, argSpaces, '');
      break;
    default:
      // Non-standard commands
      if (command?.startsWith('xdy')) {
        // [[xdydz (aka someone copy pasted the template as a roll)
        // Help command specifically for the roll command
        commands.rollHelp(message);
      } else if (command && `${command}${args.join('')}`.includes(config.postfix)) {
        // [[roll]]
        // Dice rolling commence!
        commands.roll(message, argSpaces, command);
      } else if (command) {
        // [[emoji or [[emoji-alias
        // Check if the unhandled command is an emoji request
        commands.emoji(message, command);
      }
      break;
  }
};
