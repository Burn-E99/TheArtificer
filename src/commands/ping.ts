import { DiscordenoMessage } from '@discordeno';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor1 } from 'embeds/colors.ts';

import utils from 'src/utils.ts';

const generatePing = (time: number) => ({
  embeds: [
    {
      color: infoColor1,
      title: time === -1 ? 'Ping?' : `Pong! Latency is ${time}ms.`,
    },
  ],
});

export const ping = async (message: DiscordenoMessage) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('ping')).catch((e) => utils.commonLoggers.dbError('ping.ts:14', 'call sproc INC_CNT on', e));

  // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
  try {
    const m = await message.send(generatePing(-1));
    m.edit(generatePing(m.timestamp - message.timestamp));
  } catch (e) {
    utils.commonLoggers.messageSendError('ping.ts:23', message, e as Error);
  }
};
