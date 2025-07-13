import { DiscordenoMessage } from '@discordeno';

import config from '~config';

import { getModifiers } from 'artigen/dice/getModifiers.ts';

import { sendRollRequest } from 'artigen/managers/queueManager.ts';

import { generateRollError, rollingEmbed } from 'artigen/utils/embeds.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { generateAliasError } from 'embeds/alias.ts';
import { failColor } from 'embeds/colors.ts';

import utils from 'utils/utils.ts';

interface QueryShape {
  aliasName: string;
  yVarCnt: number;
  rollStr: string;
}

export const run = async (message: DiscordenoMessage, guildMode: boolean, command: string, argSpaces: string[]) => {
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
      guildMode ? [message.guildId, 0n, aliasName] : [0n, message.authorId, aliasName],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('run.ts:30', 'query', e0);
      message
        .send(generateAliasError('DB Query Failed.', `run-q0-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? message.guildId : message.authorId}`))
        .catch((e: Error) => utils.commonLoggers.messageSendError('run.ts:33', message, e));
      errorOut = true;
    });
  if (errorOut) return;

  if (!guildMode && !query.length) {
    // Didn't find an alias for the user, maybe their doing an implicit guild mode?
    query = await dbClient
      .query(`SELECT aliasName, yVarCnt, rollStr FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?`, [message.guildId, 0n, aliasName])
      .catch((e0) => {
        utils.commonLoggers.dbError('run.ts:43', 'query', e0);
        message
          .send(generateAliasError('DB Query Failed.', `run-q1-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? message.guildId : message.authorId}`))
          .catch((e: Error) => utils.commonLoggers.messageSendError('run.ts:46', message, e));
        errorOut = true;
      });
    if (errorOut) return;
  }

  const details = query.shift();
  if (!query.length || !details) {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: `No alias named \`${aliasName}\` found${guildMode ? ' ' : ' on your account or '}in this guild`,
            description: `Please run \`${config.prefix}ra ${guildMode ? 'guild ' : ''}list\` to view the available aliases.`,
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('run.ts:63', message, e));
    return;
  }

  if (yVars.size < details.yVarCnt) {
    message
      .send({
        embeds: [
          {
            color: failColor,
            title: 'Not enough yVars provided',
            description: `The alias \`${aliasName}\` requires \`${details.yVarCnt}\` yVars, but only \`${yVars.size}\` were provided.  The roll string for this alias is:
\`${details.rollStr}\``.slice(0, 3_000),
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageSendError('run.ts:81', message, e));
    return;
  }

  const m = await message.reply(rollingEmbed);

  const rollStrArgSpaces = details.rollStr.split(/([ \n]+)/g);
  const [modifiers, remainingArgs] = getModifiers(rollStrArgSpaces);

  if (!modifiers.valid) {
    m.edit(generateRollError('Modifiers invalid:', modifiers.error.name, modifiers.error.message)).catch((e) => utils.commonLoggers.messageEditError('run.ts:96', m, e));
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
    dd: { myResponse: m, originalMessage: message },
    rollCmd: remainingArgs.join(''),
    modifiers,
    originalCommand: details.rollStr,
  });
};
