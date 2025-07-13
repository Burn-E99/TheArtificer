import { botId, DiscordenoMessage, Embed, FileContent, sendDirectMessage, sendMessage } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { SolvedRoll } from 'artigen/artigen.d.ts';

import { RollModifiers } from 'artigen/dice/dice.d.ts';

import { removeWorker } from 'artigen/managers/countManager.ts';
import { QueuedRoll } from 'artigen/managers/manager.d.ts';
import { ApiResolveMap, TestResolveMap } from 'artigen/managers/resolveManager.ts';

import { generateCountDetailsEmbed, generateDMFailed, generateRollDistsEmbed, generateRollEmbed } from 'artigen/utils/embeds.ts';
import { loggingEnabled } from 'artigen/utils/logFlag.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import stdResp from 'endpoints/stdResponses.ts';

import utils from 'utils/utils.ts';
import { infoColor1 } from 'embeds/colors.ts';
import { basicReducer } from 'artigen/utils/reducers.ts';

const getUserIdForEmbed = (rollRequest: QueuedRoll): bigint => {
  if (rollRequest.apiRoll) return rollRequest.api.userId;
  if (rollRequest.ddRoll) return rollRequest.dd.originalMessage.authorId;
  return 0n;
};

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

    // Handle adding count embed to correct list
    if (rollRequest.modifiers.count) {
      const countEmbed = generateCountDetailsEmbed(returnMsg.counts);
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
      const rollDistEmbed = generateRollDistsEmbed(returnMsg.rollDistributions);
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
          embeds: pubEmbeds,
        });
      }

      if (pubAttachments.length && newMsg) {
        // Attachment requires you to send a new message
        const respMessage: Embed[] = [
          {
            color: infoColor1,
            description: `This message contains information for a previous roll.\nPlease click on "<@${botId}> *Click to see attachment*" above this message to see the previous roll.`,
          },
        ];

        if (pubAttachments.map((file) => file.blob.size).reduce(basicReducer, 0) < config.maxFileSize) {
          // All attachments will fit in one message
          newMsg.reply({
            embeds: respMessage,
            file: pubAttachments,
          });
        } else {
          pubAttachments.forEach((file) => {
            newMsg &&
              newMsg.reply({
                embeds: respMessage,
                file,
              });
          });
        }
      }
    }

    if (rollRequest.apiRoll && !apiErroredOut) {
      dbClient
        .execute(queries.insertRollLogCmd(1, 0), [rollRequest.originalCommand, returnMsg.errorCode, newMsg ? newMsg.id : null])
        .catch((e) => utils.commonLoggers.dbError('rollQueue.ts:155', 'insert into', e));

      apiResolve &&
        apiResolve(
          stdResp.OK(
            JSON.stringify(
              rollRequest.modifiers.count
                ? {
                  counts: returnMsg.counts,
                  details: pubEmbedDetails,
                }
                : {
                  details: pubEmbedDetails,
                },
            ),
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
              rollRequest.dd.originalMessage.authorId,
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
