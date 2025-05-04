import { GatewayPayload } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

export const rawHandler = (dMsg: GatewayPayload) => log(LT.LOG, `Raw Debug Message | ${JSON.stringify(dMsg)}`);
