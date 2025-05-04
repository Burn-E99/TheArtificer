/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */
import { botId, cache, DiscordActivityTypes, DiscordenoGuild, DiscordenoMessage, editBotNickname, editBotStatus, Intents, sendMessage, startBot } from '@discordeno';
import { initLog, log, LogTypes as LT } from '@Log4Deno';

import config from '~config';
import { DEBUG, DEVMODE, LOCALMODE } from '~flags';

import commands from 'commands/_index.ts';

import dbClient from 'db/client.ts';
import { ignoreList } from 'db/common.ts';

import { successColor, warnColor } from 'embeds/colors.ts';

import api from 'src/api.ts';

import intervals from 'utils/intervals.ts';
import utils from 'utils/utils.ts';

// Extend the BigInt prototype to support JSON.stringify
interface BigIntX extends BigInt {
  // Convert to BigInt to string form in JSON.stringify
  toJSON: () => string;
}
(BigInt.prototype as BigIntX).toJSON = function () {
  return this.toString();
};

// Initialize logging client with folder to use for logs, needs --allow-write set on Deno startup
initLog('logs', DEBUG);

// Start up the Discord Bot
startBot({
  token: LOCALMODE ? config.localtoken : config.token,
  intents: [Intents.GuildMessages, Intents.DirectMessages, Intents.Guilds],
  eventHandlers: {
    ready: () => {
      log(LT.INFO, `${config.name} Logged in!`);
      editBotStatus({
        activities: [
          {
            name: 'Booting up . . .',
            type: DiscordActivityTypes.Game,
            createdAt: new Date().getTime(),
          },
        ],
        status: 'online',
      });

      // Interval to rotate the status text every 30 seconds to show off more commands
      setInterval(async () => {
        log(LT.LOG, 'Changing bot status');
        try {
          // Wrapped in try-catch due to hard crash possible
          editBotStatus({
            activities: [
              {
                name: await intervals.getRandomStatus(),
                type: DiscordActivityTypes.Game,
                createdAt: new Date().getTime(),
              },
            ],
            status: 'online',
          });
        } catch (e) {
          log(LT.ERROR, `Failed to update status: ${JSON.stringify(e)}`);
        }
      }, 30000);

      // Interval to update bot list stats every 24 hours
      LOCALMODE ? log(LT.INFO, 'updateListStatistics not running') : setInterval(() => {
        log(LT.LOG, 'Updating all bot lists statistics');
        intervals.updateListStatistics(botId, cache.guilds.size + cache.dispatchedGuildIds.size);
      }, 86400000);

      // Interval to update hourlyRates every hour
      setInterval(() => {
        log(LT.LOG, 'Updating all command hourlyRates');
        intervals.updateHourlyRates();
      }, 3600000);

      // Interval to update heatmap.png every hour
      setInterval(() => {
        log(LT.LOG, 'Updating heatmap.png');
        intervals.updateHeatmapPng();
      }, 3600000);

      // setTimeout added to make sure the startup message does not error out
      setTimeout(() => {
        LOCALMODE && editBotNickname(config.devServer, `LOCAL - ${config.name}`);
        LOCALMODE ? log(LT.INFO, 'updateListStatistics not running') : intervals.updateListStatistics(botId, cache.guilds.size + cache.dispatchedGuildIds.size);
        intervals.updateHourlyRates();
        intervals.updateHeatmapPng();
        editBotStatus({
          activities: [
            {
              name: 'Booting Complete',
              type: DiscordActivityTypes.Game,
              createdAt: new Date().getTime(),
            },
          ],
          status: 'online',
        });
        sendMessage(config.logChannel, {
          embeds: [
            {
              title: `${config.name} is now Online`,
              color: successColor,
              fields: [
                {
                  name: 'Version:',
                  value: `${config.version}`,
                  inline: true,
                },
              ],
            },
          ],
        }).catch((e: Error) => utils.commonLoggers.messageSendError('mod.ts:88', 'Startup', e));
      }, 1000);
    },
    guildCreate: (guild: DiscordenoGuild) => {
      log(LT.LOG, `Handling joining guild ${JSON.stringify(guild)}`);
      sendMessage(config.logChannel, {
        embeds: [
          {
            title: 'New Guild Joined!',
            color: successColor,
            fields: [
              {
                name: 'Name:',
                value: `${guild.name}`,
                inline: true,
              },
              {
                name: 'Id:',
                value: `${guild.id}`,
                inline: true,
              },
              {
                name: 'Member Count:',
                value: `${guild.memberCount}`,
                inline: true,
              },
            ],
          },
        ],
      }).catch((e: Error) => utils.commonLoggers.messageSendError('mod.ts:95', 'Join Guild', e));
    },
    guildDelete: (guild: DiscordenoGuild) => {
      log(LT.LOG, `Handling leaving guild ${JSON.stringify(guild)}`);
      sendMessage(config.logChannel, {
        embeds: [
          {
            title: 'Removed from Guild',
            color: warnColor,
            fields: [
              {
                name: 'Name:',
                value: `${guild.name}`,
                inline: true,
              },
              {
                name: 'Id:',
                value: `${guild.id}`,
                inline: true,
              },
              {
                name: 'Member Count:',
                value: `${guild.memberCount}`,
                inline: true,
              },
            ],
          },
        ],
      }).catch((e: Error) => utils.commonLoggers.messageSendError('mod.ts:99', 'Leave Guild', e));
      dbClient
        .execute('DELETE FROM allowed_guilds WHERE guildid = ? AND banned = 0', [guild.id])
        .catch((e) => utils.commonLoggers.dbError('mod.ts:100', 'delete from', e));
    },
    debug: DEVMODE ? (dMsg) => log(LT.LOG, `Debug Message | ${JSON.stringify(dMsg)}`) : undefined,
    raw: DEVMODE ? (dMsg) => log(LT.LOG, `Raw Debug Message | ${JSON.stringify(dMsg)}`) : undefined,
    messageCreate: (message: DiscordenoMessage) => {
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

        // return as we are done handling this command
        return;
      }

      log(LT.LOG, `Handling ${config.prefix}command message: ${JSON.stringify(message)}`);

      // Split into standard command + args format
      const args = message.content
        .slice(config.prefix.length)
        .trim()
        .split(/[ \n]+/g);
      const command = args.shift()?.toLowerCase();

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
        case 'rollhelp':
        case 'rh':
        case 'hr':
        case '??':
          // [[rollhelp or [[rh or [[hr or [[??
          // Help command specifically for the roll command
          commands.rollHelp(message);
          break;
        case 'rolldecorators':
        case 'rd':
        case 'dr':
        case '???':
          // [[rollDecorators or [[rd or [[dr or [[???
          // Help command specifically for the roll command decorators
          commands.rollDecorators(message);
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
        case 'roll':
        case 'r':
          commands.roll(message, args, args.join(''));
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
            commands.roll(message, args, command);
          } else if (command) {
            // [[emoji or [[emoji-alias
            // Check if the unhandled command is an emoji request
            commands.emoji(message, command);
          }
          break;
      }
    },
  },
});

// Start up the command prompt for debug usage
if (DEBUG && DEVMODE) {
  utils.cmdPrompt(config.logChannel, config.name);
}

// Start up the API for rolling from third party apps (like excel macros)
if (config.api.enable) {
  api.start();
}
