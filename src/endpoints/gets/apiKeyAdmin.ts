import config from '../../../config.ts';
import { dbClient } from '../../db.ts';
import {
	// nanoid deps
	nanoid,
} from '../../../deps.ts';
import stdResp from '../stdResponses.ts';
import utils from '../../utils.ts';

export const apiKeyAdmin = async (requestEvent: Deno.RequestEvent, query: Map<string, string>, apiUserid: BigInt) => {
	if ((query.has('user') && ((query.get('user') || '').length > 0)) && (query.has('a') && ((query.get('a') || '').length > 0))) {
		if (apiUserid === config.api.admin && apiUserid === BigInt(query.get('a') || '0')) {
			// Generate new secure key
			const newKey = await nanoid(25);

			// Flag to see if there is an error inside the catch
			let erroredOut = false;

			// Insert new key/user pair into the db
			await dbClient.execute('INSERT INTO all_keys(userid,apiKey) values(?,?)', [apiUserid, newKey]).catch((e) => {
				utils.commonLoggers.dbError('apiKeyAdmin.ts:24', 'insert into', e);
				requestEvent.respondWith(stdResp.InternalServerError('Failed to store key.'));
				erroredOut = true;
			});

			// Exit this case now if catch errored
			if (erroredOut) {
				return;
			} else {
				// Send API key as response
				requestEvent.respondWith(stdResp.OK(JSON.stringify({ 'key': newKey, 'userid': query.get('user') })));
				return;
			}
		} else {
			// Only allow the db admin to use this API
			requestEvent.respondWith(stdResp.Forbidden(stdResp.Strings.restricted));
		}
	} else {
		// Alert API user that they messed up
		requestEvent.respondWith(stdResp.BadRequest(stdResp.Strings.missingParams));
	}
};
