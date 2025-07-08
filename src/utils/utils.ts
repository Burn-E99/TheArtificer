/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */
import { log, LogTypes as LT } from '@Log4Deno';
import { DiscordenoMessage, Interaction } from '@discordeno';

const genericLogger = (level: LT, message: string) => log(level, message);
const messageEditError = (location: string, message: DiscordenoMessage | Interaction | string, err: Error) =>
  genericLogger(LT.ERROR, `${location} | Failed to edit message: ${JSON.stringify(message)} | Error: ${err.name} - ${err.message}`);
const messageSendError = (location: string, message: DiscordenoMessage | string, err: Error) =>
  genericLogger(LT.ERROR, `${location} | Failed to send message: ${JSON.stringify(message)} | Error: ${err.name} - ${err.message}`);
const messageDeleteError = (location: string, message: DiscordenoMessage | string, err: Error) =>
  genericLogger(LT.ERROR, `${location} | Failed to delete message: ${JSON.stringify(message)} | Error: ${err.name} - ${err.message}`);
const dbError = (location: string, type: string, err: Error) => genericLogger(LT.ERROR, `${location} | Failed to ${type} database | Error: ${err.name} - ${err.message}`);

export default {
  commonLoggers: {
    dbError,
    messageEditError,
    messageSendError,
    messageDeleteError,
  },
};
