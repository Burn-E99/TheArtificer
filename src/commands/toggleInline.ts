import { DiscordenoMessage, hasGuildPermissions } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { inlineList, queries } from 'db/common.ts';

import { failColor, infoColor1, successColor } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const toggleInline = async (message: DiscordenoMessage, args: string[]) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('inline')).catch((e) => utils.commonLoggers.dbError('toggleInline.ts:16', 'call sproc INC_CNT on', e));

  // Local apiArg in lowercase
  const apiArg = (args[0] || '').toLowerCase();

  // Alert users who DM the bot that this command is for guilds only
  if (message.guildId === 0n) {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: 'Toggle Inline commands are only available in guilds.',
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('toggleInline.ts:30', message, e));
    return;
  }

  let errorOut = false;
  const guildQuery = await dbClient.query(`SELECT guildid FROM allow_inline WHERE guildid = ?`, [message.guildId]).catch((e0) => {
    utils.commonLoggers.dbError('toggleInline.ts:36', 'query', e0);
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: 'Failed to check Inline roll status for this guild.',
            description: 'If this issue persists, please report this to the developers.',
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('toggleInline.ts:47', message, e));
    errorOut = true;
  });
  if (errorOut) return;

  // Makes sure the user is authenticated to run the API command
  if (await hasGuildPermissions(message.authorId, message.guildId, ['ADMINISTRATOR'])) {
    let enable = false;
    switch (apiArg) {
      case 'allow':
      case 'enable':
        enable = true;
        await dbClient.execute('INSERT INTO allow_inline(guildid) values(?)', [message.guildId]).catch((e) => {
          utils.commonLoggers.dbError('toggleInline.ts:58', 'insert into allow_inline', e);
          errorOut = true;
        });
        if (!errorOut) {
          inlineList.push(message.guildId);
        }
        break;
      case 'block':
      case 'disable':
        await dbClient.execute('DELETE FROM allow_inline WHERE guildid = ?', [message.guildId]).catch((e) => {
          utils.commonLoggers.dbError('toggleInline.ts:65', 'delete from allow_inline', e);
          errorOut = true;
        });
        if (!errorOut && inlineList.indexOf(message.guildId) !== -1) {
          inlineList.splice(inlineList.indexOf(message.guildId), 1);
        }
        break;
      case 'status':
      default:
        message.send({
          embeds: [
            {
              color: infoColor1,
              title: `Inline Rolls are ${guildQuery.length ? 'Enabled' : 'Disabled'} for this guild`,
              description: `To ${guildQuery.length ? 'disable' : 'enable'} them, run the following command:\n\`${config.prefix}inline ${guildQuery.length ? 'disable' : 'enable'}\``,
            },
          ],
        });
        return;
    }
    if (errorOut) {
      message.send({
        embeds: [
          {
            color: failColor,
            title: `Failed to ${enable ? 'Enable' : 'Disable'} Inline Rolls for this guild`,
            description: 'Please try the command again.  If this issue persists, please report this to the developers.',
          },
        ],
      });
      return;
    }
    message.send({
      embeds: [
        {
          color: successColor,
          title: `Successfully ${enable ? 'Enabled' : 'Disabled'} Inline Rolls for this guild`,
        },
      ],
    });
  } else {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: 'Toggle Inline commands are powerful and can only be used by guild Owners and Admins.',
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('toggleInline.ts:77', message, e));
  }
};
