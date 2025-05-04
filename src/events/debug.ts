import { DebugArg } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

export const debugHandler = (dMsg: string | DebugArg) => log(LT.LOG, `Debug Message | ${JSON.stringify(dMsg)}`);
