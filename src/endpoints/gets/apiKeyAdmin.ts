import config from '../../../config.ts';
import { dbClient } from '../../db.ts';
import {
	// Log4Deno deps
	log,
	LT,
	// nanoid deps
	nanoid,
	// httpd deps
	Status,
	STATUS_TEXT,
} from '../../../deps.ts';

export const apiKeyAdmin = async (requestEvent: Deno.RequestEvent, query: Map<string, string>, apiUserid: BigInt) => {
	if ((query.has('user') && ((query.get('user') || '').length > 0)) && (query.has('a') && ((query.get('a') || '').length > 0))) {
		if (apiUserid === config.api.admin && apiUserid === BigInt(query.get('a') || '0')) {
			// Generate new secure key
			const newKey = await nanoid(25);

			// Flag to see if there is an error inside the catch
			let erroredOut = false;

			// Insert new key/user pair into the db
			await dbClient.execute('INSERT INTO all_keys(userid,apiKey) values(?,?)', [apiUserid, newKey]).catch((e) => {
				log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
				requestEvent.respondWith(new Response(`${STATUS_TEXT.get(Status.InternalServerError)}-0`, { status: Status.InternalServerError }));
				erroredOut = true;
			});

			// Exit this case now if catch errored
			if (erroredOut) {
				return;
			} else {
				// Send API key as response
				requestEvent.respondWith(new Response(JSON.stringify({ 'key': newKey, 'userid': query.get('user') }), { status: Status.OK }));
				return;
			}
		} else {
			// Only allow the db admin to use this API
			requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden }));
		}
	} else {
		// Alert API user that they messed up
		requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));
	}
};
