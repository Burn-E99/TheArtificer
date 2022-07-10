import config from '../config.ts';
import { Client } from '../deps.ts';
import { LOCALMODE } from '../flags.ts';

type UserIdObj = {
	userid: bigint;
};

export const dbClient = await new Client().connect({
	hostname: LOCALMODE ? config.db.localhost : config.db.host,
	port: config.db.port,
	db: config.db.name,
	username: config.db.username,
	password: config.db.password,
});

// List of userIds who have requested that the bot ignore them
export const ignoreList: Array<bigint> = [];
const dbIgnoreList = await dbClient.query('SELECT * FROM ignore_list');
dbIgnoreList.forEach((userIdObj: UserIdObj) => {
	ignoreList.push(userIdObj.userid);
});

export const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const queries = {
	insertRollLogCmd: (api: number, error: number) => `INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,${api},${error})`,
	callIncCnt: (cmdName: string) => `CALL INC_CNT("${cmdName}");`,
	callIncHeatmap: (dateObj: Date) => `CALL INC_HEATMAP("${weekDays[dateObj.getDay()]}", ${dateObj.getHours()});`,
};
