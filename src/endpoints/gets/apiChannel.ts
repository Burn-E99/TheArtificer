import { dbClient } from '../../db.ts';
import {
	// Log4Deno deps
	log,
	LT,
	// httpd deps
	Status,
	STATUS_TEXT,
} from '../../../deps.ts';

export const apiChannel = async (requestEvent: Deno.RequestEvent, query: Map<string, string>, apiUserid: BigInt) => {
	if (query.has('user') && ((query.get('user') || '').length > 0)) {
		if (apiUserid === BigInt(query.get('user') || '0')) {
			// Flag to see if there is an error inside the catch
			let erroredOut = false;

			// Get all channels userid has authorized
			const dbAllowedChannelQuery = await dbClient.query('SELECT * FROM allowed_channels WHERE userid = ?', [apiUserid]).catch((e) => {
				log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
				requestEvent.respondWith(new Response(`${STATUS_TEXT.get(Status.InternalServerError)}-1`, { status: Status.InternalServerError }));
				erroredOut = true;
			});

			if (erroredOut) {
				return;
			} else {
				// Customized strinification to handle BigInts correctly
				const returnChannels = JSON.stringify(dbAllowedChannelQuery, (_key, value) => (typeof value === 'bigint' ? value.toString() : value));
				// Send API key as response
				requestEvent.respondWith(new Response(returnChannels, { status: Status.OK }));
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
