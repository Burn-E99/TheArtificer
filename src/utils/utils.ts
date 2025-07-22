/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */
import { log, LogTypes as LT } from '@Log4Deno';
import { CreateMessage, DiscordenoMessage, getOriginalInteractionResponse, hasOwnProperty, Interaction, InteractionResponseTypes, sendInteractionResponse } from '@discordeno';

const genericLogger = (level: LT, message: string) => log(level, message);
const messageGetError = (location: string, channelId: bigint | string, messageId: bigint | string, err: Error) =>
  genericLogger(LT.ERROR, `${location} | Failed to edit message: ${channelId}-${messageId} | Error: ${err.name} - ${err.message}`);
const messageEditError = (location: string, message: DiscordenoMessage | Interaction | string, err: Error) =>
  genericLogger(LT.ERROR, `${location} | Failed to edit message: ${JSON.stringify(message)} | Error: ${err.name} - ${err.message}`);
const messageSendError = (location: string, message: DiscordenoMessage | Interaction | string, err: Error) =>
  genericLogger(LT.ERROR, `${location} | Failed to send message: ${JSON.stringify(message)} | Error: ${err.name} - ${err.message}`);
const messageDeleteError = (location: string, message: DiscordenoMessage | string, err: Error) =>
  genericLogger(LT.ERROR, `${location} | Failed to delete message: ${JSON.stringify(message)} | Error: ${err.name} - ${err.message}`);
const dbError = (location: string, type: string, err: Error) => genericLogger(LT.ERROR, `${location} | Failed to ${type} database | Error: ${err.name} - ${err.message}`);

const sendOrInteract = async (
  msgOrInt: DiscordenoMessage | Interaction,
  callLocation: string,
  payload: CreateMessage,
  tryGetOriginal = false,
): Promise<void | DiscordenoMessage> => {
  let newMsg;
  if (hasOwnProperty(msgOrInt, 'token')) {
    const interaction = msgOrInt as Interaction;
    await sendInteractionResponse(interaction.id, interaction.token, {
      type: InteractionResponseTypes.ChannelMessageWithSource,
      data: payload,
    }).catch((e: Error) => messageSendError(callLocation, interaction, e));
    if (tryGetOriginal) newMsg = await getOriginalInteractionResponse(interaction.token);
  } else {
    newMsg = await msgOrInt.reply(payload).catch((e: Error) => messageSendError(callLocation, msgOrInt, e));
  }
  return newMsg;
};

const getAuthorIdFromMessageOrInteraction = (msgOrInt: DiscordenoMessage | Interaction): bigint => {
  if (hasOwnProperty(msgOrInt, 'token')) {
    const interaction = msgOrInt as Interaction;
    return BigInt(interaction.member?.user.id ?? interaction.user?.id ?? '0');
  } else {
    return msgOrInt.authorId;
  }
};

export default {
  commonLoggers: {
    dbError,
    messageDeleteError,
    messageEditError,
    messageGetError,
    messageSendError,
  },
  getAuthorIdFromMessageOrInteraction,
  sendOrInteract,
};
