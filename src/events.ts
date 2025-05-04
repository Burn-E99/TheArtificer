import { EventHandlers } from '@discordeno';

import { DEVMODE } from '~flags';

import { debugHandler } from 'events/debug.ts';
import { guildCreateHandler } from 'events/guildCreate.ts';
import { guildDeleteHandler } from 'events/guildDelete.ts';
import { messageCreateHandler } from 'events/messageCreate.ts';
import { readyHandler } from 'events/ready.ts';
import { rawHandler } from 'events/raw.ts';

const eventHandlers: Partial<EventHandlers> = {};

eventHandlers.guildCreate = guildCreateHandler;
eventHandlers.guildDelete = guildDeleteHandler;
eventHandlers.messageCreate = messageCreateHandler;
eventHandlers.ready = readyHandler;

if (DEVMODE) {
  eventHandlers.debug = debugHandler;
  eventHandlers.raw = rawHandler;
}

export default eventHandlers;
