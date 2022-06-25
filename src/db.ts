import config from '../config.ts';
import { Client } from '../deps.ts';
import { LOCALMODE } from '../flags.ts';

export const dbClient = await new Client().connect({
	hostname: LOCALMODE ? config.db.localhost : config.db.host,
	port: config.db.port,
	db: config.db.name,
	username: config.db.username,
	password: config.db.password,
});

export const queries = {
	insertRollLogCmd: (api: number, error: number) => `INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,${api},${error})`,
	callIncCnt: (cmdName: string) => `CALL INC_CNT("${cmdName}");`,
};
