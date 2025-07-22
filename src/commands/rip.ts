import { CreateGlobalApplicationCommand, DiscordenoMessage, Interaction } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor2 } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const ripSC: CreateGlobalApplicationCommand = {
  name: 'rest-in-peace',
  description: 'A short message I wanted to include.',
};

export const rip = (msgOrInt: DiscordenoMessage | Interaction) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('rip')).catch((e) => utils.commonLoggers.dbError('rip.ts:14', 'call sproc INC_CNT on', e));

  utils.sendOrInteract(msgOrInt, 'rip.ts:21', {
    embeds: [
      {
        color: infoColor2,
        title: `${config.name} was built in memory of my Grandmother, Babka`,
        description: 'With much love, Ean',
        footer: { text: 'December 21, 2020' },
      },
    ],
  });
};
