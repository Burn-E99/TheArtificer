/* The Artificer was built in memory of Babka
 * With love, Ean
 *
 * December 21, 2020
 */

import config from '../config.ts';
import {
  // Log4Deno deps
  log,
  LT,
} from '../deps.ts';
import dbClient from './db/client.ts';
import endpoints from './endpoints/_index.ts';
import stdResp from './endpoints/stdResponses.ts';

// start() returns nothing
// start initializes and runs the entire API for the bot
const start = async (): Promise<void> => {
  log(LT.INFO, `HTTP api running at: http://localhost:${config.api.port}/`);

  // rateLimitTime holds all users with the last time they started a rate limit timer
  const rateLimitTime = new Map<string, number>();
  // rateLimitCnt holds the number of times the user has called the api in the current rate limit timer
  const rateLimitCnt = new Map<string, number>();

  // Catching every request made to the server
  Deno.serve({ port: config.api.port }, async (request) => {
    log(LT.LOG, `Handling request: ${JSON.stringify(request.headers)} | ${JSON.stringify(request.method)} | ${JSON.stringify(request.url)}`);
    // Check if user is authenticated to be using this API
    let authenticated = false;
    let rateLimited = false;
    let updateRateLimitTime = false;
    let apiUserid = 0n;
    let apiUseridStr = '';
    let apiUserEmail = '';
    let apiUserDelCode = '';

    // Check the requests API key
    if (request.headers.has('X-Api-Key')) {
      // Get the userid and flags for the specific key
      const dbApiQuery = await dbClient.query('SELECT userid, email, deleteCode FROM all_keys WHERE apiKey = ? AND active = 1 AND banned = 0', [
        request.headers.get('X-Api-Key'),
      ]);

      // If only one user returned, is not banned, and is currently active, mark as authenticated
      if (dbApiQuery.length === 1) {
        apiUserid = BigInt(dbApiQuery[0].userid);
        apiUserEmail = dbApiQuery[0].email;
        apiUserDelCode = dbApiQuery[0].deleteCode;
        authenticated = true;

        // Rate limiting inits
        apiUseridStr = apiUserid.toString();
        const apiTimeNow = new Date().getTime();

        // Check if user has sent a request recently
        if (rateLimitTime.has(apiUseridStr) && (rateLimitTime.get(apiUseridStr) || 0) + config.api.rateLimitTime > apiTimeNow) {
          // Get current count
          const currentCnt = rateLimitCnt.get(apiUseridStr) || 0;
          if (currentCnt < config.api.rateLimitCnt) {
            // Limit not yet exceeded, update count
            rateLimitCnt.set(apiUseridStr, currentCnt + 1);
          } else {
            // Limit exceeded, prevent API use
            rateLimited = true;
          }
        } else {
          // Update the maps
          updateRateLimitTime = true;
          rateLimitCnt.set(apiUseridStr, 1);
        }
      }
    }

    if (!rateLimited) {
      // Get path and query as a string
      const [urlPath, tempQ] = request.url.split('?');
      const path = urlPath.split('api')[1];

      // Turn the query into a map (if it exists)
      const query = new Map<string, string>();
      if (tempQ !== undefined) {
        tempQ.split('&').forEach((e: string) => {
          log(LT.LOG, `Parsing request query ${request} ${e}`);
          const [option, params] = e.split('=');
          query.set(option.toLowerCase(), params);
        });
      }

      if (path) {
        if (authenticated) {
          // Update rate limit details
          if (updateRateLimitTime) {
            const apiTimeNow = new Date().getTime();
            rateLimitTime.set(apiUseridStr, apiTimeNow);
          }

          // Handle the authenticated request
          switch (request.method) {
            case 'GET':
              switch (path.toLowerCase()) {
                case '/key':
                case '/key/':
                  return await endpoints.get.apiKeyAdmin(query, apiUserid);
                case '/channel':
                case '/channel/':
                  return await endpoints.get.apiChannel(query, apiUserid);
                case '/roll':
                case '/roll/':
                  return await endpoints.get.apiRoll(query, apiUserid, request);
                default:
                  // Alert API user that they messed up
                  return stdResp.NotFound('Auth Get');
              }
              break;
            case 'POST':
              switch (path.toLowerCase()) {
                case '/channel/add':
                case '/channel/add/':
                  return await endpoints.post.apiChannelAdd(query, apiUserid);
                default:
                  // Alert API user that they messed up
                  return stdResp.NotFound('Auth Post');
              }
              break;
            case 'PUT':
              switch (path.toLowerCase()) {
                case '/key/ban':
                case '/key/ban/':
                case '/key/unban':
                case '/key/unban/':
                case '/key/activate':
                case '/key/activate/':
                case '/key/deactivate':
                case '/key/deactivate/':
                  return await endpoints.put.apiKeyManage(query, apiUserid, path);
                case '/channel/ban':
                case '/channel/ban/':
                case '/channel/unban':
                case '/channel/unban/':
                  return await endpoints.put.apiChannelManageBan(query, apiUserid, path);
                case '/channel/activate':
                case '/channel/activate/':
                case '/channel/deactivate':
                case '/channel/deactivate/':
                  return await endpoints.put.apiChannelManageActive(query, apiUserid, path);
                default:
                  // Alert API user that they messed up
                  return stdResp.NotFound('Auth Put');
              }
              break;
            case 'DELETE':
              switch (path.toLowerCase()) {
                case '/key/delete':
                case '/key/delete/':
                  return await endpoints.delete.apiKeyDelete(query, apiUserid, apiUserEmail, apiUserDelCode);
                default:
                  // Alert API user that they messed up
                  return stdResp.NotFound('Auth Del');
              }
              break;
            default:
              // Alert API user that they messed up
              return stdResp.MethodNotAllowed('Auth');
          }
        } else if (!authenticated) {
          // Handle the unathenticated request
          switch (request.method) {
            case 'GET':
              switch (path.toLowerCase()) {
                case '/key':
                case '/key/':
                  return await endpoints.get.apiKey(query);
                case '/heatmap.png':
                  return endpoints.get.heatmapPng();
                default:
                  // Alert API user that they messed up
                  return stdResp.NotFound('NoAuth Get');
              }
              break;
            default:
              // Alert API user that they messed up
              return stdResp.MethodNotAllowed('NoAuth');
          }
        }
      } else {
        return stdResp.Forbidden('What are you trying to do?');
      }
    } else if (authenticated && rateLimited) {
      // Alert API user that they are doing this too often
      return stdResp.TooManyRequests('Slow down, servers are expensive and this bot is free to use.');
    } else {
      // Alert API user that they shouldn't be doing this
      return stdResp.Forbidden('Why are you here?');
    }
  });
};

export default { start };
