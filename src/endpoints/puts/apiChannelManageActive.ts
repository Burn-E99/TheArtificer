import { dbClient } from '../../db.ts';
import {
	// Log4Deno deps
	log,
	LT,
	// httpd deps
	Status,
	STATUS_TEXT,
} from '../../../deps.ts';

export const apiChannelManageActive = async (requestEvent: Deno.RequestEvent, query: Map<string, string>, apiUserid: BigInt, path: string) => {
	if ((query.has('channel') && ((query.get('channel') || '').length > 0)) && (query.has('user') && ((query.get('user') || '').length > 0))) {
		if (apiUserid === BigInt(query.get('user') || '0')) {
			// Flag to see if there is an error inside the catch
			let value, erroredOut = false;

			// Determine value to set
			if (path.toLowerCase().indexOf('de') > 0) {
				value = 0;
			} else {
				value = 1;
			}

			// Update the requested entry
			await dbClient.execute('UPDATE allowed_channels SET active = ? WHERE userid = ? AND channelid = ?', [value, apiUserid, BigInt(query.get('channel') || '0')]).catch((e) => {
				log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
				requestEvent.respondWith(new Response(`${STATUS_TEXT.get(Status.InternalServerError)}-5`, { status: Status.InternalServerError }));
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
