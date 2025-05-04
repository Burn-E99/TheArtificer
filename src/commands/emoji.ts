import { DiscordenoMessage } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import utils from 'src/utils.ts';

interface EmojiConf {
  name: string;
  aliases: string[];
  id: string;
  animated: boolean;
  deleteSender: boolean;
}

const allEmojiAliases: string[] = [];

config.emojis.forEach((curEmoji: EmojiConf) => {
  allEmojiAliases.push(...curEmoji.aliases);
});

export const emoji = (message: DiscordenoMessage, command: string) => {
  if (allEmojiAliases.includes(command)) {
    // Start looping thru the possible emojis
    config.emojis.some((curEmoji: EmojiConf) => {
      log(LT.LOG, `Checking if command was emoji ${JSON.stringify(curEmoji)}`);
      // If a match gets found
      if (curEmoji.aliases.includes(command || '')) {
        // Light telemetry to see how many times a command is being run
        dbClient.execute(queries.callIncCnt('emojis')).catch((e) => utils.commonLoggers.dbError('emojis.ts:28', 'call sproc INC_CNT on', e));

        // Send the needed emoji
        message
          .send(`<${curEmoji.animated ? 'a' : ''}:${curEmoji.name}:${curEmoji.id}>`)
          .catch((e: Error) => utils.commonLoggers.messageSendError('emoji.ts:33', message, e));
        // And attempt to delete if needed
        if (curEmoji.deleteSender) {
          message.delete().catch((e: Error) => utils.commonLoggers.messageDeleteError('emoji.ts:36', message, e));
        }
        return true;
      }
    });
  }
};
