import dbClient from 'db/client.ts';

interface UserIdObj {
  userid: bigint;
}
interface GuildIdObj {
  guildid: bigint;
}

// List of userIds who have requested that the bot ignore them
export const ignoreList: Array<bigint> = [];
const dbIgnoreList = await dbClient.query('SELECT * FROM ignore_list');
dbIgnoreList.forEach((userIdObj: UserIdObj) => {
  ignoreList.push(userIdObj.userid);
});

// List of guilds who have allowed inline rolls
export const inlineList: Array<bigint> = [];
const dbInlineList = await dbClient.query('SELECT * FROM allow_inline');
dbInlineList.forEach((guildIdObj: GuildIdObj) => {
  inlineList.push(guildIdObj.guildid);
});

export const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const queries = {
  insertRollLogCmd: (api: number, error: number) => `INSERT INTO roll_log(input,result,resultid,api,error) values(?,?,?,${api},${error})`,
  callIncCnt: (cmdName: string) => `CALL INC_CNT("${cmdName}");`,
  callIncHeatmap: (dateObj: Date) => `CALL INC_HEATMAP("${weekDays[dateObj.getDay()]}", ${dateObj.getHours()});`,
};
