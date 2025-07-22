import { DiscordenoMessage, hasOwnProperty } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { getModifiers } from 'artigen/dice/getModifiers.ts';

import { sendRollRequest } from 'artigen/managers/queueManager.ts';

import { rollingEmbed } from 'artigen/utils/embeds.ts';
import { argSpacesSplitRegex } from 'artigen/utils/escape.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { generateAliasError } from 'embeds/alias.ts';
import { failColor } from 'embeds/colors.ts';

import { SlashCommandInteractionWithGuildId } from 'src/mod.d.ts';

import utils from 'utils/utils.ts';

interface QueryShape {
  aliasName: string;
  yVarCnt: number;
  rollStr: string;
}

export const run = async (msgOrInt: DiscordenoMessage | SlashCommandInteractionWithGuildId, guildMode: boolean, command: string, argSpaces: string[]) => {
  let errorOut = false;
  const aliasName = (command === 'run' || command === 'execute' ? argSpaces.shift() || '' : command)?.trim().toLowerCase();
  const yVars = new Map<string, number>();
  argSpaces
    .join('')
    .trim()
    .replaceAll('\n', ' ')
    .split(' ')
    .filter((x) => x)
    .forEach((yVar, idx) => yVars.set(`y${idx}`, parseFloat(yVar)));

  let query: QueryShape[] = await dbClient
    .query(
      `SELECT aliasName, yVarCnt, rollStr FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?`,
      guildMode ? [BigInt(msgOrInt.guildId), 0n, aliasName] : [0n, utils.getAuthorIdFromMessageOrInteraction(msgOrInt), aliasName],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('run.ts:30', 'query', e0);
      utils.sendOrInteract(
        msgOrInt,
        'run.ts:47',
        generateAliasError(
          'DB Query Failed.',
          `run-q0-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
        ),
      );
      errorOut = true;
    });
  if (errorOut) return;

  if (!guildMode && !query.length) {
    // Didn't find an alias for the user, maybe their doing an implicit guild mode?
    query = await dbClient
      .query(`SELECT aliasName, yVarCnt, rollStr FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?`, [BigInt(msgOrInt.guildId), 0n, aliasName])
      .catch((e0) => {
        utils.commonLoggers.dbError('run.ts:43', 'query', e0);
        utils.sendOrInteract(
          msgOrInt,
          'run.ts:64',
          generateAliasError(
            'DB Query Failed.',
            `run-q1-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
          ),
        );
        errorOut = true;
      });
    if (errorOut) return;
  }

  const details = query.shift();
  if (!details) {
    utils.sendOrInteract(msgOrInt, 'run.ts:78', {
      embeds: [
        {
          color: failColor,
          title: `No alias named \`${aliasName}\` found${guildMode ? ' ' : ' on your account or '}in this guild`,
          description: `Please run \`${config.prefix}ra ${guildMode ? 'guild ' : ''}list\` to view the available aliases.`,
        },
      ],
    });
    return;
  }

  if (yVars.size < details.yVarCnt) {
    utils.sendOrInteract(msgOrInt, 'run.ts:92', {
      embeds: [
        {
          color: failColor,
          title: 'Not enough yVars provided',
          description: `The alias \`${aliasName}\` requires \`${details.yVarCnt}\` yVars, but only \`${yVars.size}\` were provided.  The roll string for this alias is:
\`${details.rollStr}\``.slice(0, 3_000),
        },
      ],
    });
    return;
  }

  const m = await utils.sendOrInteract(msgOrInt, 'run.ts:115', rollingEmbed, true);
  if (!m) {
    log(LT.ERROR, `My message didn't send! ${msgOrInt}`);
    return;
  }

  const rollStrArgSpaces = details.rollStr.split(argSpacesSplitRegex).filter((x) => x);
  const [modifiers, remainingArgs] = getModifiers(rollStrArgSpaces);

  if (!modifiers.valid) {
    // m.edit(generateRollError('Modifiers invalid:', modifiers.error.name, modifiers.error.message)).catch((e) =>
    //   utils.commonLoggers.messageEditError('run.ts:96', m, e)
    // );
    return;
  }

  const currDateTime = new Date();
  dbClient.execute(queries.callIncCnt('roll')).catch((e) => utils.commonLoggers.dbError('run.ts:104', 'call sproc INC_CNT on', e));
  dbClient.execute(queries.callIncHeatmap(currDateTime)).catch((e) => utils.commonLoggers.dbError('run.ts:105', 'update', e));

  modifiers.yVars = yVars;
  sendRollRequest({
    apiRoll: false,
    ddRoll: true,
    testRoll: false,
    dd: {
      myResponse: m,
      originalMessage: hasOwnProperty(msgOrInt, 'token') ? m : msgOrInt,
      authorId: utils.getAuthorIdFromMessageOrInteraction(msgOrInt),
    },
    rollCmd: remainingArgs.join(''),
    modifiers,
    originalCommand: details.rollStr,
  });
};
