import { DiscordenoMessage, EmbedField, hasGuildPermissions } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { getModifiers } from 'artigen/dice/getModifiers.ts';

import { TestResults } from 'artigen/managers/manager.d.ts';
import { sendRollRequest } from 'artigen/managers/queueManager.ts';

import { cmdSplitRegex } from 'artigen/utils/escape.ts';
import { assertPrePostBalance, getMatchingPostfixIdx } from 'artigen/utils/parenBalance.ts';

import { ReservedWords } from 'commands/aliasCmd/reservedWords.ts';

import dbClient from 'db/client.ts';

import { generateAliasError } from 'embeds/alias.ts';
import { failColor, infoColor1, successColor } from 'embeds/colors.ts';

import { SlashCommandInteractionWithGuildId } from 'src/mod.d.ts';

import utils from 'utils/utils.ts';

interface QueryShape {
  aliasName: string;
}

const sortYVars = (a: string, b: string) => {
  if (a.length < b.length) return -1;
  if (a.length > b.length) return 1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

const handleAddUpdate = async (
  msgOrInt: DiscordenoMessage | SlashCommandInteractionWithGuildId,
  guildMode: boolean,
  argSpaces: string[],
  replaceAlias: boolean,
) => {
  if (guildMode && !(await hasGuildPermissions(BigInt(msgOrInt.guildId), utils.getAuthorIdFromMessageOrInteraction(msgOrInt), ['ADMINISTRATOR']))) {
    utils.sendOrInteract(msgOrInt, 'aliasAddUpdate.ts:43', {
      embeds: [
        {
          color: failColor,
          title: `Error: Only Guild Owners and Admins can add/update guild aliases`,
        },
      ],
    });
    return;
  }

  const aliasName = (argSpaces.shift() || '').trim();
  argSpaces.shift();

  if (aliasName.length > config.limits.alias.maxNameLength) {
    utils.sendOrInteract(msgOrInt, 'aliasAddUpdate.ts:59', {
      embeds: [
        {
          color: failColor,
          title: 'Error: Alias Name is too long',
          description:
            `\`${aliasName}\` (\`${aliasName.length}\` characters) is longer than the allowed max length of \`${config.limits.alias.maxNameLength}\` characters.  Please choose a shorter alias name.`,
        },
      ],
    });
    return;
  }

  if (ReservedWords.includes(aliasName?.toLowerCase())) {
    utils.sendOrInteract(msgOrInt, 'aliasAddUpdate.ts:74', {
      embeds: [
        {
          color: failColor,
          title: `Error: \`${aliasName}\` is a reserved word`,
          description: `Please choose a different name for this alias.

You cannot use any of the following reserved words: \`${ReservedWords.join('`, `')}\`.`,
        },
      ],
    });
    return;
  }

  let errorOut = false;
  const query: QueryShape[] = await dbClient
    .query(
      `SELECT aliasName FROM aliases WHERE guildid = ? AND userid = ? AND aliasName = ?`,
      guildMode ? [BigInt(msgOrInt.guildId), 0n, aliasName.toLowerCase()] : [0n, utils.getAuthorIdFromMessageOrInteraction(msgOrInt), aliasName.toLowerCase()],
    )
    .catch((e0) => {
      utils.commonLoggers.dbError('add.ts:44', 'query', e0);
      utils.sendOrInteract(
        msgOrInt,
        'aliasAddUpdate.ts:97',
        generateAliasError(
          'DB Query Failed.',
          `add-q0-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
        ),
      );
      errorOut = true;
    });
  if (errorOut) return;

  if (!replaceAlias && query.length) {
    utils.sendOrInteract(msgOrInt, 'aliasAddUpdate.ts:109', {
      embeds: [
        {
          color: failColor,
          title: `Error: \`${aliasName}\` already exists as a ${guildMode ? 'guild' : 'personal'} alias`,
          description: 'Please choose a different name for this alias.',
        },
      ],
    });
    return;
  } else if (replaceAlias && !query.length) {
    utils.sendOrInteract(msgOrInt, 'aliasAddUpdate.ts:121', {
      embeds: [
        {
          color: failColor,
          title: `Error: \`${aliasName}\` does not exist as a ${guildMode ? 'guild' : 'personal'} alias`,
          description: `If you are trying to create a new ${guildMode ? 'guild' : 'personal'} alias, please run the following command:
\`${config.prefix}ra ${guildMode ? 'guild ' : ''}add\` followed by the desired alias name and roll string.

If you are trying to update an existing alias, but forgot the name, please run the following command to view all your ${guildMode ? 'guild ' : ''}aliases:
\`${config.prefix}ra ${guildMode ? 'guild ' : ''}list\``,
        },
      ],
    });
    return;
  }

  const rawRollStr = argSpaces.join('').trim();
  const newMsg: DiscordenoMessage | void = await utils.sendOrInteract(
    msgOrInt,
    'aliasAddUpdate.ts:139',
    {
      embeds: [
        {
          color: infoColor1,
          title: 'Please wait, testing your roll string . . .',
          description: `The following roll string is being tested.  Once the verdict of your roll has been determined, this message will be updated.

\`${rawRollStr}\``,
        },
      ],
    },
    true,
  );

  if (!newMsg) {
    log(LT.ERROR, `My message didn't send! ${msgOrInt}`);
    return;
  }

  const [modifiers, remainingArgs] = getModifiers(argSpaces);
  const failedRollMsg = `The provided roll string (listed below) encountered an error.  Please try this roll outside the roll alias system and resolve the error before trying again.

\`${rawRollStr}\`${rawRollStr.length > 1_700 ? ' (trimmed to 2,000 characters to fit in the error message)' : ''}`.slice(0, 2_000);

  if (!modifiers.valid) {
    newMsg
      .edit({
        embeds: [
          {
            color: failColor,
            title: 'Roll failed',
            description: failedRollMsg,
            fields: [
              {
                name: 'Error Details:',
                value: modifiers.error.message,
              },
            ],
            footer: {
              text: modifiers.error.name,
            },
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageEditError('add.ts:116', newMsg, e));
    return;
  }

  const rollCmd = remainingArgs.join('');
  const testCmdConf = rollCmd
    .toLowerCase()
    .split(cmdSplitRegex)
    .filter((x) => x);
  try {
    assertPrePostBalance(testCmdConf, false);
    let openIdx = testCmdConf.indexOf(config.prefix);
    while (openIdx !== -1) {
      const closeIdx = getMatchingPostfixIdx(testCmdConf, openIdx, false);
      const possibleYVars = testCmdConf
        .slice(openIdx + 1, closeIdx)
        .join('')
        .split(/(y\d+(\.\d*)?)/g)
        .filter((y) => y && y.startsWith('y'));
      for (const yVar of possibleYVars) {
        if (yVar.includes('.')) {
          newMsg
            .edit({
              embeds: [
                {
                  color: failColor,
                  title: 'Roll failed',
                  description: failedRollMsg,
                  fields: [
                    {
                      name: 'Error Details:',
                      value: `yVars cannot have decimals`,
                    },
                  ],
                  footer: {
                    text: 'yVarDecimal',
                  },
                },
              ],
            })
            .catch((e: Error) => utils.commonLoggers.messageEditError('add.ts:163', newMsg, e));
          return;
        }
        if (!modifiers.yVars.has(yVar)) {
          modifiers.yVars.set(yVar, Math.ceil(Math.random() * 20));
        }
      }
      openIdx = testCmdConf.indexOf(config.prefix, closeIdx);
    }
  } catch (e) {
    const err = e as Error;
    newMsg
      .edit({
        embeds: [
          {
            color: failColor,
            title: 'Roll failed',
            description: failedRollMsg,
            fields: [
              {
                name: 'Error Details:',
                value: `Failed to find yVars, requested rollStr likely has unbalanced \`${config.prefix}\`/\`${config.postfix}\``,
              },
              {
                name: 'Raw Error:',
                value: `${err.name}: ${err.message}`,
              },
            ],
            footer: {
              text: 'caughtErrYVarUnbalanced',
            },
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageEditError('add.ts:191', newMsg, e));
    return;
  }

  let i = 0;
  while (i < modifiers.yVars.size) {
    if (!modifiers.yVars.has(`y${i}`)) {
      modifiers.yVars.set(`y${i}`, 0);
    }
    i++;
  }

  const rollStrVerdict = await new Promise<TestResults>((resolve) => {
    sendRollRequest({
      apiRoll: false,
      ddRoll: false,
      testRoll: true,
      resolve,
      rollCmd,
      modifiers,
      originalCommand: rawRollStr,
    });
  });

  if (rollStrVerdict.error) {
    const errorFields: EmbedField[] = [
      {
        name: 'Error Details:',
        value: rollStrVerdict.errorMsg,
      },
    ];
    if (modifiers.yVars.size) {
      errorFields.push({
        name: 'The following YVars were used in testing:',
        value: modifiers.yVars
          .entries()
          .toArray()
          .sort((a, b) => sortYVars(a[0], b[0]))
          .map(([yVar, value]) => `\`${yVar}\`: \`${value}\``)
          .join('\n'),
      });
    }
    newMsg
      .edit({
        embeds: [
          {
            color: failColor,
            title: 'Roll failed',
            description: failedRollMsg,
            fields: errorFields,
            footer: {
              text: rollStrVerdict.errorCode,
            },
          },
        ],
      })
      .catch((e: Error) => utils.commonLoggers.messageEditError('add.ts:153', newMsg, e));
    return;
  }

  if (replaceAlias) {
    await dbClient
      .execute('UPDATE aliases SET rollStr = ?, yVarCnt = ? WHERE guildid = ? AND userid = ? AND aliasName = ?', [
        rawRollStr,
        modifiers.yVars.size,
        guildMode ? BigInt(msgOrInt.guildId) : 0n,
        guildMode ? 0n : utils.getAuthorIdFromMessageOrInteraction(msgOrInt),
        aliasName.toLowerCase(),
      ])
      .catch((e0) => {
        utils.commonLoggers.dbError('add.ts:169', 'update', e0);
        newMsg
          .edit(
            generateAliasError(
              'DB Update Failed.',
              `add-q1-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
            ),
          )
          .catch((e: Error) => utils.commonLoggers.messageSendError('add.ts:170', msgOrInt, e));
        errorOut = true;
      });
  } else {
    const currentAliases: QueryShape[] = await dbClient
      .query(
        'SELECT aliasName FROM aliases WHERE guildid = ? AND userid = ?',
        guildMode ? [BigInt(msgOrInt.guildId), 0n] : [0n, utils.getAuthorIdFromMessageOrInteraction(msgOrInt)],
      )
      .catch((e0) => {
        utils.commonLoggers.dbError('add.ts:266', 'get count', e0);
        newMsg
          .edit(
            generateAliasError(
              'DB Query Failed.',
              `add-q2-${guildMode ? 't' : 'f'}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
            ),
          )
          .catch((e: Error) => utils.commonLoggers.messageSendError('add.ts:269', msgOrInt, e));
        errorOut = true;
      });
    if (errorOut) return;

    if (currentAliases.length < (guildMode ? config.limits.alias.free.guild : config.limits.alias.free.user)) {
      await dbClient
        .execute('INSERT INTO aliases(guildid,userid,aliasName,rollStr,yVarCnt,premium) values(?,?,?,?,?,?)', [
          guildMode ? BigInt(msgOrInt.guildId) : 0n,
          guildMode ? 0n : utils.getAuthorIdFromMessageOrInteraction(msgOrInt),
          aliasName.toLowerCase(),
          rawRollStr,
          modifiers.yVars.size,
          0,
        ])
        .catch((e0) => {
          utils.commonLoggers.dbError('add.ts:169', 'insert into', e0);
          newMsg
            .edit(
              generateAliasError(
                'DB Insert Failed.',
                `add-q3-${guildMode ? 't' : 'f'}-${aliasName}-${guildMode ? BigInt(msgOrInt.guildId) : utils.getAuthorIdFromMessageOrInteraction(msgOrInt)}`,
              ),
            )
            .catch((e: Error) => utils.commonLoggers.messageSendError('add.ts:187', msgOrInt, e));
          errorOut = true;
        });
    } else {
      newMsg
        .edit({
          embeds: [
            {
              color: failColor,
              title: `Over ${guildMode ? 'guild' : 'personal'} Alias Limit`,
              description: `Cannot add another alias as this account already has \`${currentAliases.length}\` aliases saved.
              
The current limits imposed on the Alias System are \`${config.limits.alias.free.guild}\` guild aliases and \`${config.limits.alias.free.user}\` account aliases.

If you need this limit raised, please join the [support server](${config.links.supportServer})`,
            },
          ],
        })
        .catch((e: Error) => utils.commonLoggers.messageEditError('add.ts:302', newMsg, e));
      return;
    }
  }
  if (errorOut) return;

  const yVarString = ' ' + modifiers.yVars.keys().toArray().sort(sortYVars).join(' ');
  newMsg
    .edit({
      embeds: [
        {
          color: successColor,
          title: `Successfully ${replaceAlias ? 'replaced' : 'added'} the ${guildMode ? 'guild' : 'personal'} alias \`${aliasName}\`!`,
          description: `You can try it out now using the following command:
\`${config.prefix}ra ${guildMode ? 'guild ' : ''}${aliasName}${modifiers.yVars.size ? yVarString : ''}\``,
        },
      ],
    })
    .catch((e: Error) => utils.commonLoggers.messageSendError('add.ts:321', msgOrInt, e));
};

// Using wrappers to limit "magic" booleans
export const add = (msgOrInt: DiscordenoMessage | SlashCommandInteractionWithGuildId, guildMode: boolean, argSpaces: string[]) => handleAddUpdate(msgOrInt, guildMode, argSpaces, false);
export const update = (msgOrInt: DiscordenoMessage | SlashCommandInteractionWithGuildId, guildMode: boolean, argSpaces: string[]) => handleAddUpdate(msgOrInt, guildMode, argSpaces, true);
