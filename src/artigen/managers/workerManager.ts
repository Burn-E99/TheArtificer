import config from '/config.ts';
import { generateCountDetailsEmbed, generateDMFailed, generateRollEmbed } from 'src/commandUtils.ts';
import { QueuedRoll, RollModifiers } from 'src/mod.d.ts';
import utils from 'src/utils.ts';
import { SolvedRoll } from 'src/artigen/solver.d.ts';
import { loggingEnabled } from 'src/artigen/rollUtils.ts';
import { log, LogTypes as LT } from '@Log4Deno';
import { DEVMODE } from '/flags.ts';
import dbClient from 'src/db/client.ts';
import stdResp from 'src/endpoints/stdResponses.ts';
import { DiscordenoMessage, sendDirectMessage, sendMessage } from '@discordeno';
import { queries } from 'src/db/common.ts';

export let currentWorkers = 0;

// Handle setting up and calling the rollWorker
export const handleRollWorker = (rq: QueuedRoll) => {
  currentWorkers++;

  // gmModifiers used to create gmEmbed (basically just turn off the gmRoll)
  const gmModifiers = JSON.parse(JSON.stringify(rq.modifiers));
  gmModifiers.gmRoll = false;

  const rollWorker = new Worker(new URL('../artigen/rollWorker.ts', import.meta.url).href, { type: 'module' });

  const workerTimeout = setTimeout(async () => {
    rollWorker.terminate();
    currentWorkers--;
    if (rq.apiRoll) {
      rq.api.resolve(stdResp.RequestTimeout('Roll took too long to process, try breaking roll down into simpler parts'));
    } else {
      rq.dd.m
        .edit({
          embeds: [
            (
              await generateRollEmbed(
                rq.dd.message.authorId,
                <SolvedRoll> {
                  error: true,
                  errorCode: 'TooComplex',
                  errorMsg: 'Error: Roll took too long to process, try breaking roll down into simpler parts',
                },
                <RollModifiers> {},
              )
            ).embed,
          ],
        })
        .catch((e) => utils.commonLoggers.messageEditError('rollQueue.ts:51', rq.dd.m, e));
    }
  }, config.limits.workerTimeout);

  rollWorker.addEventListener('message', async (workerMessage) => {
    if (workerMessage.data === 'ready') {
      loggingEnabled && log(LT.LOG, `Sending roll to worker: ${rq.rollCmd}, ${JSON.stringify(rq.modifiers)}`);
      rollWorker.postMessage({
        rollCmd: rq.rollCmd,
        modifiers: rq.modifiers,
      });
      return;
    }
    let apiErroredOut = false;
    try {
      currentWorkers--;
      clearTimeout(workerTimeout);
      const returnMsg = workerMessage.data;
      loggingEnabled && log(LT.LOG, `Roll came back from worker: ${returnMsg.line1.length} |&| ${returnMsg.line2.length} |&| ${returnMsg.line3.length} `);
      loggingEnabled && log(LT.LOG, `Roll came back from worker: ${returnMsg.line1} |&| ${returnMsg.line2} |&| ${returnMsg.line3} `);
      const pubEmbedDetails = await generateRollEmbed(rq.apiRoll ? rq.api.userId : rq.dd.message.authorId, returnMsg, rq.modifiers);
      const gmEmbedDetails = await generateRollEmbed(rq.apiRoll ? rq.api.userId : rq.dd.message.authorId, returnMsg, gmModifiers);
      const countEmbed = generateCountDetailsEmbed(returnMsg.counts);
      loggingEnabled && log(LT.LOG, `Embeds are generated: ${JSON.stringify(pubEmbedDetails)} |&| ${JSON.stringify(gmEmbedDetails)}`);

      // If there was an error, report it to the user in hopes that they can determine what they did wrong
      if (returnMsg.error) {
        if (rq.apiRoll) {
          rq.api.resolve(stdResp.InternalServerError(returnMsg.errorMsg));
        } else {
          rq.dd.m.edit({ embeds: [pubEmbedDetails.embed] });
        }

        if (rq.apiRoll || (DEVMODE && config.logRolls)) {
          // If enabled, log rolls so we can see what went wrong
          dbClient
            .execute(queries.insertRollLogCmd(rq.apiRoll ? 1 : 0, 1), [rq.originalCommand, returnMsg.errorCode, rq.apiRoll ? null : rq.dd.m.id])
            .catch((e) => utils.commonLoggers.dbError('rollQueue.ts:82', 'insert into', e));
        }
      } else {
        let n: DiscordenoMessage | void = undefined;
        // Determine if we are to send a GM roll or a normal roll
        if (rq.modifiers.gmRoll) {
          if (rq.apiRoll) {
            n = await sendMessage(rq.api.channelId, {
              content: rq.modifiers.apiWarn,
              embeds: [pubEmbedDetails.embed],
            }).catch(() => {
              apiErroredOut = true;
              rq.api.resolve(stdResp.InternalServerError('Message failed to send - location 0.'));
            });
          } else {
            // Send the public embed to correct channel
            rq.dd.m.edit({ embeds: [pubEmbedDetails.embed] });
          }

          if (!apiErroredOut) {
            // And message the full details to each of the GMs, alerting roller of every GM that could not be messaged
            rq.modifiers.gms.forEach(async (gm) => {
              log(LT.LOG, `Messaging GM ${gm}`);
              // Attempt to DM the GM and send a warning if it could not DM a GM
              await sendDirectMessage(BigInt(gm.substring(2, gm.length - 1)), {
                embeds: rq.modifiers.count ? [gmEmbedDetails.embed, countEmbed] : [gmEmbedDetails.embed],
              })
                .then(async () => {
                  // Check if we need to attach a file and send it after the initial details sent
                  if (gmEmbedDetails.hasAttachment) {
                    await sendDirectMessage(BigInt(gm.substring(2, gm.length - 1)), {
                      file: gmEmbedDetails.attachment,
                    }).catch(() => {
                      if (n && rq.apiRoll) {
                        n.reply(generateDMFailed(gm));
                      } else if (!rq.apiRoll) {
                        rq.dd.message.reply(generateDMFailed(gm));
                      }
                    });
                  }
                })
                .catch(() => {
                  if (rq.apiRoll && n) {
                    n.reply(generateDMFailed(gm));
                  } else if (!rq.apiRoll) {
                    rq.dd.message.reply(generateDMFailed(gm));
                  }
                });
            });
          }
        } else {
          // Not a gm roll, so just send normal embed to correct channel
          if (rq.apiRoll) {
            n = await sendMessage(rq.api.channelId, {
              content: rq.modifiers.apiWarn,
              embeds: rq.modifiers.count ? [pubEmbedDetails.embed, countEmbed] : [pubEmbedDetails.embed],
            }).catch(() => {
              apiErroredOut = true;
              rq.api.resolve(stdResp.InternalServerError('Message failed to send - location 1.'));
            });
          } else {
            n = await rq.dd.m.edit({
              embeds: rq.modifiers.count ? [pubEmbedDetails.embed, countEmbed] : [pubEmbedDetails.embed],
            });
          }

          if (pubEmbedDetails.hasAttachment && n) {
            // Attachment requires you to send a new message
            n.reply({
              file: pubEmbedDetails.attachment,
            });
          }
        }

        if (rq.apiRoll && !apiErroredOut) {
          dbClient
            .execute(queries.insertRollLogCmd(1, 0), [rq.originalCommand, returnMsg.errorCode, n ? n.id : null])
            .catch((e) => utils.commonLoggers.dbError('rollQueue.ts:155', 'insert into', e));

          rq.api.resolve(
            stdResp.OK(
              JSON.stringify(
                rq.modifiers.count
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
      log(LT.ERROR, `Unhandled RQ Error: ${JSON.stringify(e)}`);
      if (rq.apiRoll && !apiErroredOut) {
        rq.api.resolve(stdResp.InternalServerError(JSON.stringify(e)));
      }
    }
  });
};
