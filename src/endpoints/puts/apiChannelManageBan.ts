import config from '../../../config.ts';
import { dbClient } from '../../db.ts';
import {
	// Log4Deno deps
	log,
	LT,
	// httpd deps
	Status,
	STATUS_TEXT,
} from '../../../deps.ts';

export const apiChannelManageBan = async (requestEvent: Deno.RequestEvent, query: Map<string, string>, apiUserid: BigInt, path: string) => {
	if (
		(query.has('a') && ((query.get('a') || '').length > 0)) && (query.has('channel') && ((query.get('channel') || '').length > 0)) &&
		(query.has('user') && ((query.get('user') || '').length > 0))
	) {
		if (apiUserid === config.api.admin && apiUserid === BigInt(query.get('a') || '0')) {
			// Flag to see if there is an error inside the catch
			let value, erroredOut = false;

			// Determine value to set
			if (path.toLowerCase().indexOf('un') > 0) {
				value = 0;
			} else {
				value = 1;
			}

			// Execute the DB modification
			await dbClient.execute('UPDATE allowed_channels SET banned = ? WHERE userid = ? AND channelid = ?', [value, apiUserid, BigInt(query.get('channel') || '0')]).catch((e) => {
				log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
				requestEvent.respondWith(new Response(`${STATUS_TEXT.get(Status.InternalServerError)}-4`, { status: Status.InternalServerError }));
				erroredOut = true;
			});

			// Exit this case now if catch errored
			if (erroredOut) {
				return;
			} else {
				// Send API key as response
				requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.OK), { status: Status.OK }));
				return;
			}
		} else {
			// Alert API user that they shouldn't be doing this
			requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden }));
		}
	} else {
		// Alert API user that they messed up
		requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));
	}
};
