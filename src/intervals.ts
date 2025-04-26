/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

import {
  // Discordeno deps
  cache,
  cacheHandlers,
  // imagescript dep
  is,
  // Log4Deno deps
  log,
  LT,
} from '../deps.ts';
import { PastCommandCount } from './mod.d.ts';
import dbClient from './db/client.ts';
import { weekDays } from './db/common.ts';
import utils from './utils.ts';
import config from '../config.ts';

// getRandomStatus() returns status as string
// Gets a new random status for the bot
const getRandomStatus = async (): Promise<string> => {
  let status = '';
  switch (Math.floor(Math.random() * 4 + 1)) {
    case 1:
      status = `${config.prefix}help for commands`;
      break;
    case 2:
      status = `Running V${config.version}`;
      break;
    case 3:
      status = `${config.prefix}info to learn more`;
      break;
    default: {
      const cachedCount = await cacheHandlers.size('guilds');
      status = `Rolling dice for ${cachedCount + cache.dispatchedGuildIds.size} servers`;
      break;
    }
  }

  return status;
};

// updateListStatistics(bot ID, current guild count) returns nothing, posts to botlists
// Sends the current server count to all bot list sites we are listed on
const updateListStatistics = (botID: bigint, serverCount: number): void => {
  config.botLists.forEach(async (e) => {
    try {
      log(LT.LOG, `Updating statistics for ${JSON.stringify(e)}`);
      if (e.enabled) {
        const tempHeaders = new Headers();
        tempHeaders.append(e.headers[0].header, e.headers[0].value);
        tempHeaders.append('Content-Type', 'application/json');
        // ?{} is a template used in config, just need to replace it with the real value
        const response = await fetch(e.apiUrl.replace('?{bot_id}', botID.toString()), {
          method: 'POST',
          headers: tempHeaders,
          body: JSON.stringify(e.body).replace('"?{server_count}"', serverCount.toString()), // ?{server_count} needs the "" removed from around it aswell to make sure its sent as a number
        });
        log(LT.INFO, `Posted server count to ${e.name}.  Results: ${JSON.stringify(response)}`);
      }
    } catch (err) {
      log(LT.ERROR, `Failed to update statistics for ${e.name} | Error: ${err.name} - ${err.message}`);
    }
  });
};

// Keep one week of data
const hoursToKeep = 7 * 24;
const previousHours: Array<Array<PastCommandCount>> = [];
// updateHourlyRates() returns nothing, updates DB directly
// Updates the hourlyRate for command usage
const updateHourlyRates = async () => {
  try {
    const newestHour = await dbClient
      .query('SELECT command, count FROM command_cnt ORDER BY command;')
      .catch((e) => utils.commonLoggers.dbError('intervals.ts:71', 'query', e));
    previousHours.push(newestHour);
    if (previousHours.length > 1) {
      const oldestHour = previousHours[0];

      const computedDiff: Array<PastCommandCount> = [];
      for (let i = 0; i < newestHour.length; i++) {
        computedDiff.push({
          command: newestHour[i].command,
          count: newestHour[i].count - oldestHour[i].count,
        });
        log(LT.LOG, `Updating hourlyRate | Computing diffs: ${JSON.stringify(computedDiff)}`);
      }

      // Update DB
      computedDiff.forEach(async (cmd) => {
        log(LT.LOG, `Updating hourlyRate | Storing to DB: ${JSON.stringify(cmd)}`);
        await dbClient
          .execute(`UPDATE command_cnt SET hourlyRate = ? WHERE command = ?`, [cmd.count / previousHours.length, cmd.command])
          .catch((e) => utils.commonLoggers.dbError('intervals.ts:88', 'update', e));
      });
    }

    if (previousHours.length > hoursToKeep) {
      previousHours.unshift();
    }
  } catch (e) {
    log(LT.ERROR, `Something went wrong in previousHours interval | Error: ${e.name} - ${e.message}`);
  }
};

// getPercentOfRange(min, max, val) returns number
// Gets a percent value of where val lies in the min-max range
const getPercentOfRange = (minVal: number, maxVal: number, val: number): number => {
  const localMax = maxVal - minVal;
  const localVal = val - minVal;

  return localVal / localMax;
};

// Pixel locations in heatmap-base.png, pixel locations are 0 based
// dayPixels holds the left and right (AKA X Coord) pixel locations for each col (ex: [leftPX, rightPX])
const dayPixels: Array<Array<number>> = [
  [72, 159],
  [163, 260],
  [264, 359],
  [363, 497],
  [501, 608],
  [612, 686],
  [690, 800],
];
// hourPixels holds the top and bottom (AKA Y Coord) pixel locations for each row (ex: [topPX, botPX])
const hourPixels: Array<Array<number>> = [
  [29, 49],
  [51, 72],
  [74, 95],
  [97, 118],
  [120, 141],
  [143, 164],
  [166, 187],
  [189, 209],
  [211, 232],
  [234, 254],
  [256, 277],
  [279, 299],
  [301, 322],
  [324, 345],
  [347, 368],
  [370, 391],
  [393, 413],
  [415, 436],
  [438, 459],
  [461, 482],
  [484, 505],
  [507, 528],
  [530, 550],
  [552, 572],
];
// updateHeatmap() returns nothing, creates new heatmap.png
// Updates the heatmap image with latest data from the db
let minRollCnt: number;
let maxRollCnt: number;
const updateHeatmapPng = async () => {
  const baseHeatmap = Deno.readFileSync('./src/endpoints/gets/heatmap-base.png');
  const heatmap = await is.decode(baseHeatmap);
  if (!(heatmap instanceof is.Image)) {
    return;
  }
  // Get latest data from DB
  const heatmapData = await dbClient
    .query('SELECT * FROM roll_time_heatmap ORDER BY hour;')
    .catch((e) => utils.commonLoggers.dbError('intervals.ts:148', 'query', e));

  minRollCnt = Infinity;
  maxRollCnt = 0;
  // determine min and max values
  for (const hour of heatmapData) {
    for (const day of weekDays) {
      const rollCnt = hour[day];
      log(LT.LOG, `updateHeatmapPng | finding min/max | min: ${minRollCnt} max: ${maxRollCnt} curr: ${rollCnt}`);
      if (rollCnt > maxRollCnt) {
        maxRollCnt = rollCnt;
      }
      if (rollCnt < minRollCnt) {
        minRollCnt = rollCnt;
      }
    }
  }

  // Apply values to image
  for (let hour = 0; hour < heatmapData.length; hour++) {
    for (let day = 0; day < weekDays.length; day++) {
      log(LT.LOG, `updateHeatmapPng | putting ${weekDays[day]} ${hour}:00 into image`);
      const percent = getPercentOfRange(minRollCnt, maxRollCnt, heatmapData[hour][weekDays[day]]);
      heatmap.drawBox(
        dayPixels[day][0] + 1,
        hourPixels[hour][0] + 1,
        dayPixels[day][1] - dayPixels[day][0] + 1,
        hourPixels[hour][1] - hourPixels[hour][0] + 1,
        is.Image.rgbToColor(255 * (1 - percent), 255 * percent, 0),
      );
    }
  }

  Deno.writeFileSync('./src/endpoints/gets/heatmap.png', await heatmap.encode());
};

export default {
  getRandomStatus,
  updateListStatistics,
  updateHourlyRates,
  updateHeatmapPng,
  getMinRollCnt: () => minRollCnt,
  getMaxRollCnt: () => maxRollCnt,
};
