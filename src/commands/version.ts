import { CreateGlobalApplicationCommand, DiscordenoMessage, Interaction } from '@discordeno';

import config from '~config';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor1 } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

export const versionSC: CreateGlobalApplicationCommand = {
  name: 'version',
  description: `Gets ${config.name}'s current version`,
};

export const version = (msgOrInt: DiscordenoMessage | Interaction) => {
  // Light telemetry to see how many times a command is being run
  dbClient.execute(queries.callIncCnt('version')).catch((e) => utils.commonLoggers.dbError('version.ts:14', 'call sproc INC_CNT on', e));

  utils.sendOrInteract(msgOrInt, 'version.ts:16', {
    embeds: [
      {
        color: infoColor1,
        title: `My current version is ${config.version}`,
      },
    ],
  });
};
