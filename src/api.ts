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
	// httpd deps
	Status,
	STATUS_TEXT,
} from '../deps.ts';
import { dbClient } from './db.ts';
import endpoints from './endpoints/_index.ts';

// start() returns nothing
// start initializes and runs the entire API for the bot
const start = async (): Promise<void> => {
	const server = Deno.listen({ port: config.api.port });
	log(LT.INFO, `HTTP api running at: http://localhost:${config.api.port}/`);

	// rateLimitTime holds all users with the last time they started a rate limit timer
	const rateLimitTime = new Map<string, number>();
	// rateLimitCnt holds the number of times the user has called the api in the current rate limit timer
	const rateLimitCnt = new Map<string, number>();

	// Catching every request made to the server
	for await (const conn of server) {
		(async () => {
			const httpConn = Deno.serveHttp(conn);
			for await (const requestEvent of httpConn) {
				const request = requestEvent.request;
				log(LT.LOG, `Handling request: ${JSON.stringify(request)}`);
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
					const dbApiQuery = await dbClient.query('SELECT userid, email, deleteCode FROM all_keys WHERE apiKey = ? AND active = 1 AND banned = 0', [request.headers.get('X-Api-Key')]);

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
						if (rateLimitTime.has(apiUseridStr) && (((rateLimitTime.get(apiUseridStr) || 0) + config.api.rateLimitTime) > apiTimeNow)) {
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
					const [path, tempQ] = request.url.split('?');

					// Turn the query into a map (if it exists)
					const query = new Map<string, string>();
					if (tempQ !== undefined) {
						tempQ.split('&').forEach((e: string) => {
							log(LT.LOG, `Parsing request query #2 ${request} ${e}`);
							const [option, params] = e.split('=');
							query.set(option.toLowerCase(), params);
						});
					}

					if (authenticated) {
						// Handle the authenticated request
						switch (request.method) {
							case 'GET':
								switch (path.toLowerCase()) {
									case '/api/key':
									case '/api/key/':
										endpoints.get.apiKeyAdmin(requestEvent, query, apiUserid);
										break;
									case '/api/channel':
									case '/api/channel/':
										endpoints.get.apiChannel(requestEvent, query, apiUserid);
										break;
									case '/api/roll':
									case '/api/roll/':
										endpoints.get.apiRoll(requestEvent, query, apiUserid);
										break;
									default:
										// Alert API user that they messed up
										requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.NotFound), { status: Status.NotFound }));
										break;
								}
								break;
							case 'POST':
								switch (path.toLowerCase()) {
									case '/api/channel/add':
									case '/api/channel/add/':
										endpoints.post.apiChannelAdd(requestEvent, query, apiUserid);
										break;
									default:
										// Alert API user that they messed up
										requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.NotFound), { status: Status.NotFound }));
										break;
								}
								break;
							case 'PUT':
								switch (path.toLowerCase()) {
									case '/api/key/ban':
									case '/api/key/ban/':
									case '/api/key/unban':
									case '/api/key/unban/':
									case '/api/key/activate':
									case '/api/key/activate/':
									case '/api/key/deactivate':
									case '/api/key/deactivate/':
										endpoints.put.apiKeyManage(requestEvent, query, apiUserid, path);
										break;
									case '/api/channel/ban':
									case '/api/channel/ban/':
									case '/api/channel/unban':
									case '/api/channel/unban/':
										endpoints.put.apiChannelManageBan(requestEvent, query, apiUserid, path);
										break;
									case '/api/channel/activate':
									case '/api/channel/activate/':
									case '/api/channel/deactivate':
									case '/api/channel/deactivate/':
										endpoints.put.apiChannelManageActive(requestEvent, query, apiUserid, path);
										break;
									default:
										// Alert API user that they messed up
										requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.NotFound), { status: Status.NotFound }));
										break;
								}
								break;
							case 'DELETE':
								switch (path.toLowerCase()) {
									case '/api/key/delete':
									case '/api/key/delete/':
										endpoints.delete.apiKeyDelete(requestEvent, query, apiUserid, apiUserEmail, apiUserDelCode);
										break;
									default:
										// Alert API user that they messed up
										requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.NotFound), { status: Status.NotFound }));
										break;
								}
								break;
							default:
								// Alert API user that they messed up
								requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.MethodNotAllowed), { status: Status.MethodNotAllowed }));
								break;
						}

						// Update rate limit details
						if (updateRateLimitTime) {
							const apiTimeNow = new Date().getTime();
							rateLimitTime.set(apiUseridStr, apiTimeNow);
						}
					} else if (!authenticated) {
						// Handle the unathenticated request
						switch (request.method) {
							case 'GET':
								switch (path.toLowerCase()) {
									case '/api/key':
									case '/api/key/':
										endpoints.get.apiKey(requestEvent, query);
										break;
									default:
										// Alert API user that they messed up
										requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.NotFound), { status: Status.NotFound }));
										break;
								}
								break;
							default:
								// Alert API user that they messed up
								requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.MethodNotAllowed), { status: Status.MethodNotAllowed }));
								break;
						}
					}
				} else if (authenticated && rateLimited) {
					// Alert API user that they are doing this too often
					requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.TooManyRequests), { status: Status.TooManyRequests }));
				} else {
					// Alert API user that they shouldn't be doing this
					requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden }));
				}
			}
		})();
	}
};

export default { start };
