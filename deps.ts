// All external dependancies are to be loaded here to make updating dependancy versions much easier
export {
  botId,
  cache,
  cacheHandlers,
  DiscordActivityTypes,
  editBotNickname,
  editBotStatus,
  getMessage,
  hasGuildPermissions,
  Intents,
  sendDirectMessage,
  sendMessage,
  startBot,
} from 'https://deno.land/x/discordeno@12.0.1/mod.ts';

export type { CreateMessage, DiscordenoGuild, DiscordenoMessage, EmbedField } from 'https://deno.land/x/discordeno@12.0.1/mod.ts';

export { Client } from 'https://deno.land/x/mysql@v2.12.1/mod.ts';

export { STATUS_CODE, STATUS_TEXT } from 'jsr:@std/http@1.0.15';

export type { StatusCode } from 'jsr:@std/http@1.0.15';

export { nanoid } from 'https://deno.land/x/nanoid@v3.0.0/mod.ts';

export { closeLog, initLog, log, LogTypes as LT } from 'https://raw.githubusercontent.com/Burn-E99/Log4Deno/V2.1.1/mod.ts';

export * as is from 'https://deno.land/x/imagescript@1.3.0/mod.ts';
