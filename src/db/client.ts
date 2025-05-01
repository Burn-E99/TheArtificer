import { Client } from '@mysql';

import config from '/config.ts';
import { LOCALMODE } from '/flags.ts';

const dbClient = await new Client().connect({
  hostname: LOCALMODE ? config.db.localhost : config.db.host,
  port: config.db.port,
  db: config.db.name,
  username: config.db.username,
  password: config.db.password,
  debug: true,
});

export default dbClient;
