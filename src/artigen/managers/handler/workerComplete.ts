import { botId, ButtonStyles, DiscordenoMessage, Embed, FileContent, MessageComponentTypes, sendDirectMessage, sendMessage } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { SolvedRoll } from 'artigen/artigen.d.ts';

import { RollModifiers } from 'artigen/dice/dice.d.ts';

import { removeWorker } from 'artigen/managers/countManager.ts';
import { QueuedRoll } from 'artigen/managers/manager.d.ts';
import { ApiResolveMap, TestResolveMap } from 'artigen/managers/resolveManager.ts';

import { generateCountDetailsEmbed, generateDMFailed, generateRollDistsEmbed, generateRollEmbed, toggleWebView } from 'artigen/utils/embeds.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';
import { basicReducer } from 'artigen/utils/reducers.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { infoColor1 } from 'embeds/colors.ts';

import stdResp from 'endpoints/stdResponses.ts';

import { InteractionValueSeparator } from 'events/interactionCreate.ts';

import utils from 'utils/utils.ts';
import { STATUS_CODE, STATUS_TEXT } from '@std/http/status';

const getUserIdForEmbed = (rollRequest: QueuedRoll): bigint => {
  if (rollRequest.apiRoll) return rollRequest.api.userId;
  if (rollRequest.ddRoll) {
    if (rollRequest.dd.overrideAuthorId === 0n) return rollRequest.dd.authorId;
    return rollRequest.dd.overrideAuthorId;
  }
  return 0n;
};

const getAuthorIdForButton = (rollRequest: QueuedRoll): bigint => {
  if (rollRequest.apiRoll) return rollRequest.api.userId;
  if (rollRequest.ddRoll) return rollRequest.dd.authorId;
  return 0n;
};

export const repeatRollCustomId = 'repeatRoll';

export const onWorkerComplete = async (workerMessage: MessageEvent<SolvedRoll>, workerTimeout: number, rollRequest: QueuedRoll) => {
  const apiResolve = rollRequest.apiRoll ? ApiResolveMap.get(rollRequest.resolve as string) : undefined;
  const testResolve = rollRequest.testRoll ? TestResolveMap.get(rollRequest.resolve as string) : undefined;
  rollRequest.apiRoll && ApiResolveMap.delete(rollRequest.resolve as string);
  rollRequest.testRoll && TestResolveMap.delete(rollRequest.resolve as string);

  let apiErroredOut = false;
  try {
    removeWorker();
    clearTimeout(workerTimeout);

    const returnMsg = workerMessage.data;
    loggingEnabled && log(LT.LOG, `Roll came back from worker: ${returnMsg.line1.length} |&| ${returnMsg.line2.length} |&| ${returnMsg.line3.length} `);
    loggingEnabled && log(LT.LOG, `Roll came back from worker: ${returnMsg.line1} |&| ${returnMsg.line2} |&| ${returnMsg.line3} `);
    const pubEmbedDetails = generateRollEmbed(getUserIdForEmbed(rollRequest), returnMsg, rollRequest.modifiers);
    const gmEmbedDetails = generateRollEmbed(getUserIdForEmbed(rollRequest), returnMsg, {
      ...rollRequest.modifiers,
      gmRoll: false,
    });

    let pubRespCharCount = pubEmbedDetails.charCount;
    let gmRespCharCount = gmEmbedDetails.charCount;
    const pubEmbeds: Embed[] = [pubEmbedDetails.embed];
    const gmEmbeds: Embed[] = [gmEmbedDetails.embed];
    const pubAttachments: FileContent[] = pubEmbedDetails.hasAttachment ? [pubEmbedDetails.attachment] : [];
    const gmAttachments: FileContent[] = gmEmbedDetails.hasAttachment ? [gmEmbedDetails.attachment] : [];
    let countEmbed, rollDistEmbed;

    // Handle adding count embed to correct list
    if (rollRequest.modifiers.count) {
      countEmbed = generateCountDetailsEmbed(returnMsg.counts);
      if (rollRequest.modifiers.gmRoll) {
        gmEmbeds.push(countEmbed.embed);
        gmRespCharCount += countEmbed.charCount;
      } else {
        pubEmbeds.push(countEmbed.embed);
        pubRespCharCount += countEmbed.charCount;
      }
    }

    // Handle adding rollDist embed to correct list
    if (rollRequest.modifiers.rollDist) {
      rollDistEmbed = generateRollDistsEmbed(returnMsg.rollDistributions);
      if (rollRequest.modifiers.gmRoll) {
        gmEmbeds.push(rollDistEmbed.embed);
        rollDistEmbed.hasAttachment && gmAttachments.push(rollDistEmbed.attachment);
        gmRespCharCount += rollDistEmbed.charCount;
      } else {
        pubEmbeds.push(rollDistEmbed.embed);
        rollDistEmbed.hasAttachment && pubAttachments.push(rollDistEmbed.attachment);
        pubRespCharCount += rollDistEmbed.charCount;
      }
    }

    loggingEnabled && log(LT.LOG, `Embeds are generated: ${pubRespCharCount} ${JSON.stringify(pubEmbeds)} |&| ${gmRespCharCount} ${JSON.stringify(gmEmbeds)}`);

    // If there was an error, report it to the user in hopes that they can determine what they did wrong
    if (returnMsg.error) {
      if (rollRequest.apiRoll) {
        apiResolve && apiResolve(stdResp.InternalServerError(returnMsg.errorMsg));
      } else if (rollRequest.ddRoll) {
        rollRequest.dd.myResponse.edit({ embeds: pubEmbeds });
      } else if (rollRequest.testRoll) {
        testResolve &&
          testResolve({
            error: true,
            errorMsg: returnMsg.errorMsg,
            errorCode: returnMsg.errorCode,
          });
      }

      if (rollRequest.apiRoll) {
        // If enabled, log rolls so we can see what went wrong
        dbClient
          .execute(queries.insertRollLogCmd(rollRequest.apiRoll ? 1 : 0, 1), [rollRequest.originalCommand, returnMsg.errorCode, null])
          .catch((e) => utils.commonLoggers.dbError('rollQueue.ts:82', 'insert into', e));
      }

      return;
    }

    // Test roll will assume that messages send successfully
    if (rollRequest.testRoll) {
      testResolve &&
        testResolve({
          error: false,
        });
      return;
    }

    let newMsg: DiscordenoMessage | void = undefined;
    // Determine if we are to send a GM roll or a normal roll
    if (rollRequest.modifiers.gmRoll) {
      if (rollRequest.apiRoll) {
        newMsg = await sendMessage(rollRequest.api.channelId, {
          content: rollRequest.modifiers.apiWarn,
          embeds: pubEmbeds,
        }).catch(() => {
          apiErroredOut = true;
          apiResolve && apiResolve(stdResp.InternalServerError('Message failed to send - location 0.'));
        });
      } else {
        // Send the public embed to correct channel
        rollRequest.dd.myResponse.edit({ embeds: pubEmbeds });
      }

      // HOTFIX: makes discordeno actually be able to reply to any message (user or bot) while in dms
      if (newMsg && !newMsg.guildId) newMsg.guildId = -1n;

      if (!apiErroredOut) {
        // And message the full details to each of the GMs, alerting roller of every GM that could not be messaged
        rollRequest.modifiers.gms.forEach(async (gm) => {
          const gmId: bigint = BigInt(gm.startsWith('<') ? gm.substring(2, gm.length - 1) : gm);
          log(LT.LOG, `Messaging GM ${gm} | ${gmId}`);
          // Attempt to DM the GM and send a warning if it could not DM a GM
          await sendDirectMessage(gmId, {
            content: `Original GM Roll Request: ${rollRequest.apiRoll ? newMsg && newMsg.link : rollRequest.dd.myResponse.link}`,
            embeds: gmEmbeds,
          })
            .then(async () => {
              // Check if we need to attach a file and send it after the initial details sent
              if (gmAttachments.length) {
                await sendDirectMessage(gmId, {
                  file: gmAttachments,
                }).catch(() => {
                  if (newMsg && rollRequest.apiRoll) {
                    newMsg.reply(generateDMFailed(gmId));
                  } else if (!rollRequest.apiRoll) {
                    rollRequest.dd.originalMessage.reply(generateDMFailed(gmId));
                  }
                });
              }
            })
            .catch(() => {
              if (rollRequest.apiRoll && newMsg) {
                newMsg.reply(generateDMFailed(gmId));
              } else if (!rollRequest.apiRoll) {
                rollRequest.dd.originalMessage.reply(generateDMFailed(gmId));
              }
            });
        });
      }
    } else {
      // Not a gm roll, so just send normal embed to correct channel
      if (rollRequest.apiRoll) {
        newMsg = await sendMessage(rollRequest.api.channelId, {
          content: rollRequest.modifiers.apiWarn,
          embeds: pubEmbeds,
        }).catch(() => {
          apiErroredOut = true;
          apiResolve && apiResolve(stdResp.InternalServerError('Message failed to send - location 1.'));
        });
      } else {
        newMsg = await rollRequest.dd.myResponse.edit({
          content: rollRequest.dd.overrideAuthorId === 0n ? '' : `<@${rollRequest.dd.overrideAuthorId}> used the \`Repeat Roll\` button for the referenced message:`,
          embeds: pubEmbeds,
          components: [
            {
              type: MessageComponentTypes.ActionRow,
              components: [
                {
                  type: MessageComponentTypes.Button,
                  label: 'Repeat Roll',
                  customId: `${repeatRollCustomId}${InteractionValueSeparator}${getAuthorIdForButton(rollRequest).toString()}`,
                  style: ButtonStyles.Secondary,
                  emoji: '🎲',
                },
              ],
            },
          ],
        });
      }

      // HOTFIX: makes discordeno actually be able to reply to any message (user or bot) while in dms
      if (newMsg && !newMsg.guildId) newMsg.guildId = -1n;

      if (pubAttachments.length && newMsg) {
        // Attachment requires you to send a new message
        const respMessage: Embed[] = [
          {
            color: infoColor1,
            description: `**This message contains information for a previous roll.**
Please click on "<@${botId}> *Click to see attachment*" above this message to see the previous roll.`,
          },
        ];

        if (pubAttachments.map((file) => file.blob.size).reduce(basicReducer, 0) < config.maxFileSize) {
          // All attachments will fit in one message
          newMsg &&
            newMsg
              .reply({
                embeds: respMessage,
                file: pubAttachments,
              })
              .then((attachmentMsg) => toggleWebView(attachmentMsg, getUserIdForEmbed(rollRequest).toString(), false))
              .catch((e) => utils.commonLoggers.messageSendError('workerComplete.ts:230', newMsg as DiscordenoMessage, e));
        } else {
          pubAttachments.forEach((file) => {
            newMsg &&
              newMsg
                .reply({
                  embeds: respMessage,
                  file,
                })
                .then((attachmentMsg) => toggleWebView(attachmentMsg, getUserIdForEmbed(rollRequest).toString(), false))
                .catch((e) => utils.commonLoggers.messageSendError('workerComplete.ts:240', newMsg as DiscordenoMessage, e));
          });
        }
      }
    }

    if (rollRequest.apiRoll && !apiErroredOut) {
      dbClient
        .execute(queries.insertRollLogCmd(1, 0), [rollRequest.originalCommand, returnMsg.errorCode, newMsg ? newMsg.id : null])
        .catch((e) => utils.commonLoggers.dbError('rollQueue.ts:155', 'insert into', e));

      const headers = new Headers();
      headers.append('Content-Type', 'text/json');
      apiResolve &&
        apiResolve(
          new Response(
            JSON.stringify({
              discordEmbeds: {
                rollResponse: pubEmbedDetails,
                countsResponse: countEmbed ?? null,
                rollDistResponse: rollDistEmbed ?? null,
              },
              rawData: {
                roll: {
                  raw: returnMsg.line1,
                  results: returnMsg.line2,
                  details: returnMsg.line3,
                },
                counts: rollRequest.modifiers.count ? returnMsg.counts : null,
                rollDistributions: returnMsg.rollDistributions.entries().toArray(),
              },
            }),
            {
              status: STATUS_CODE.OK,
              statusText: STATUS_TEXT[STATUS_CODE.OK],
              headers,
            },
          ),
        );
    }
  } catch (e) {
    log(LT.ERROR, `Unhandled rollRequest Error: ${JSON.stringify(e)}`);
    if (rollRequest.ddRoll) {
      rollRequest.dd.myResponse.edit({
        embeds: [
          (
            await generateRollEmbed(
              0n,
              <SolvedRoll> {
                error: true,
                errorMsg:
                  `Something weird went wrong, likely the requested roll is too complex and caused the response to be too large for Discord.  Try breaking the request down into smaller messages and try again.\n\nIf this error continues to come up, please \`${config.prefix}report\` this to my developer.`,
                errorCode: 'UnhandledWorkerComplete',
              },
              <RollModifiers> {},
            )
          ).embed,
        ],
      });
    } else if (rollRequest.apiRoll && !apiErroredOut) {
      apiResolve && apiResolve(stdResp.InternalServerError(JSON.stringify(e)));
    } else if (rollRequest.testRoll) {
      testResolve &&
        testResolve({
          error: true,
          errorMsg: 'Something weird went wrong.',
          errorCode: 'UnhandledWorkerComplete',
        });
    }
  }
};
