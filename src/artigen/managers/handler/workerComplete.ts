import { DiscordenoMessage, sendDirectMessage, sendMessage } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';
import { DEVMODE } from '~flags';

import { SolvedRoll } from 'artigen/artigen.d.ts';

import { removeWorker } from 'artigen/managers/countManager.ts';
import { QueuedRoll } from 'artigen/managers/manager.d.ts';

import { loggingEnabled } from 'artigen/utils/logFlag.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import { generateCountDetailsEmbed, generateDMFailed, generateRollEmbed } from 'embeds/artigen.ts';

import stdResp from 'endpoints/stdResponses.ts';

import utils from 'utils/utils.ts';

export const onWorkerComplete = async (workerMessage: MessageEvent<SolvedRoll>, workerTimeout: number, rollRequest: QueuedRoll) => {
  let apiErroredOut = false;
  try {
    removeWorker();
    clearTimeout(workerTimeout);

    const returnMsg = workerMessage.data;
    loggingEnabled && log(LT.LOG, `Roll came back from worker: ${returnMsg.line1.length} |&| ${returnMsg.line2.length} |&| ${returnMsg.line3.length} `);
    loggingEnabled && log(LT.LOG, `Roll came back from worker: ${returnMsg.line1} |&| ${returnMsg.line2} |&| ${returnMsg.line3} `);
    const pubEmbedDetails = await generateRollEmbed(
      rollRequest.apiRoll ? rollRequest.api.userId : rollRequest.dd.originalMessage.authorId,
      returnMsg,
      rollRequest.modifiers,
    );
    const gmEmbedDetails = await generateRollEmbed(rollRequest.apiRoll ? rollRequest.api.userId : rollRequest.dd.originalMessage.authorId, returnMsg, {
      ...rollRequest.modifiers,
      gmRoll: false,
    });
    const countEmbed = generateCountDetailsEmbed(returnMsg.counts);
    loggingEnabled && log(LT.LOG, `Embeds are generated: ${JSON.stringify(pubEmbedDetails)} |&| ${JSON.stringify(gmEmbedDetails)}`);

    // If there was an error, report it to the user in hopes that they can determine what they did wrong
    if (returnMsg.error) {
      if (rollRequest.apiRoll) {
        rollRequest.api.resolve(stdResp.InternalServerError(returnMsg.errorMsg));
      } else {
        rollRequest.dd.myResponse.edit({ embeds: [pubEmbedDetails.embed] });
      }

      if (rollRequest.apiRoll || (DEVMODE && config.logRolls)) {
        // If enabled, log rolls so we can see what went wrong
        dbClient
          .execute(queries.insertRollLogCmd(rollRequest.apiRoll ? 1 : 0, 1), [
            rollRequest.originalCommand,
            returnMsg.errorCode,
            rollRequest.apiRoll ? null : rollRequest.dd.myResponse.id,
          ])
          .catch((e) => utils.commonLoggers.dbError('rollQueue.ts:82', 'insert into', e));
      }
    } else {
      let newMsg: DiscordenoMessage | void = undefined;
      // Determine if we are to send a GM roll or a normal roll
      if (rollRequest.modifiers.gmRoll) {
        if (rollRequest.apiRoll) {
          newMsg = await sendMessage(rollRequest.api.channelId, {
            content: rollRequest.modifiers.apiWarn,
            embeds: [pubEmbedDetails.embed],
          }).catch(() => {
            apiErroredOut = true;
            rollRequest.api.resolve(stdResp.InternalServerError('Message failed to send - location 0.'));
          });
        } else {
          // Send the public embed to correct channel
          rollRequest.dd.myResponse.edit({ embeds: [pubEmbedDetails.embed] });
        }

        if (!apiErroredOut) {
          // And message the full details to each of the GMs, alerting roller of every GM that could not be messaged
          rollRequest.modifiers.gms.forEach(async (gm) => {
            const gmId: bigint = BigInt(gm.startsWith('<') ? gm.substring(2, gm.length - 1) : gm);
            log(LT.LOG, `Messaging GM ${gm} | ${gmId}`);
            // Attempt to DM the GM and send a warning if it could not DM a GM
            await sendDirectMessage(gmId, {
              content: `Original GM Roll Request: ${rollRequest.apiRoll ? newMsg && newMsg.link : rollRequest.dd.myResponse.link}`,
              embeds: rollRequest.modifiers.count ? [gmEmbedDetails.embed, countEmbed] : [gmEmbedDetails.embed],
            })
              .then(async () => {
                // Check if we need to attach a file and send it after the initial details sent
                if (gmEmbedDetails.hasAttachment) {
                  await sendDirectMessage(gmId, {
                    file: gmEmbedDetails.attachment,
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
            embeds: rollRequest.modifiers.count ? [pubEmbedDetails.embed, countEmbed] : [pubEmbedDetails.embed],
          }).catch(() => {
            apiErroredOut = true;
            rollRequest.api.resolve(stdResp.InternalServerError('Message failed to send - location 1.'));
          });
        } else {
          newMsg = await rollRequest.dd.myResponse.edit({
            embeds: rollRequest.modifiers.count ? [pubEmbedDetails.embed, countEmbed] : [pubEmbedDetails.embed],
          });
        }

        if (pubEmbedDetails.hasAttachment && newMsg) {
          // Attachment requires you to send a new message
          newMsg.reply({
            file: pubEmbedDetails.attachment,
          });
        }
      }

      if (rollRequest.apiRoll && !apiErroredOut) {
        dbClient
          .execute(queries.insertRollLogCmd(1, 0), [rollRequest.originalCommand, returnMsg.errorCode, newMsg ? newMsg.id : null])
          .catch((e) => utils.commonLoggers.dbError('rollQueue.ts:155', 'insert into', e));

        rollRequest.api.resolve(
          stdResp.OK(
            JSON.stringify(
              rollRequest.modifiers.count
                ? {
                  counts: countEmbed,
                  details: pubEmbedDetails,
                }
                : {
                  details: pubEmbedDetails,
                },
            ),
          ),
        );
      }
    }
  } catch (e) {
    log(LT.ERROR, `Unhandled rollRequest Error: ${JSON.stringify(e)}`);
    if (rollRequest.apiRoll && !apiErroredOut) {
      rollRequest.api.resolve(stdResp.InternalServerError(JSON.stringify(e)));
    }
  }
};
