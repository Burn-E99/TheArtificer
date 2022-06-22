import { dbClient } from '../../db.ts';
import {
	// Log4Deno deps
	log,
	LT,
} from '../../../deps.ts';
import stdResp from '../stdResponses.ts';

export const apiChannelAdd = async (requestEvent: Deno.RequestEvent, query: Map<string, string>, apiUserid: BigInt) => {
	if ((query.has('user') && ((query.get('user') || '').length > 0)) && (query.has('channel') && ((query.get('channel') || '').length > 0))) {
		if (apiUserid === BigInt(query.get('user') || '0')) {
			// Flag to see if there is an error inside the catch
			let erroredOut = false;

			// Insert new user/channel pair into the db
			await dbClient.execute('INSERT INTO allowed_channels(userid,channelid) values(?,?)', [apiUserid, BigInt(query.get('channel') || '0')]).catch((e) => {
				log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
				requestEvent.respondWith(stdResp.InternalServerError(''));
				erroredOut = true;
			});

			// Exit this case now if catch errored
			if (erroredOut) {
				return;
			} else {
				// Send OK to indicate modification was successful
				requestEvent.respondWith(stdResp.OK(''));
				return;
			}
		} else {
			// Alert API user that they shouldn't be doing this
			requestEvent.respondWith(stdResp.Forbidden(''));
		}
	} else {
		// Alert API user that they messed up
		requestEvent.respondWith(stdResp.BadRequest(''));
	}
};
