import { dbClient } from '../../db.ts';
import {
	// Log4Deno deps
	log,
	LT,
} from '../../../deps.ts';
import stdResp from '../stdResponses.ts';
import utils from '../../utils.ts';

export const apiChannel = async (requestEvent: Deno.RequestEvent, query: Map<string, string>, apiUserid: BigInt) => {
	if (query.has('user') && ((query.get('user') || '').length > 0)) {
		if (apiUserid === BigInt(query.get('user') || '0')) {
			// Flag to see if there is an error inside the catch
			let erroredOut = false;

			// Get all channels userid has authorized
			const dbAllowedChannelQuery = await dbClient.query('SELECT * FROM allowed_channels WHERE userid = ?', [apiUserid]).catch((e) => {
				utils.commonLoggers.dbError('apiChannel.ts', 'query', e);
				requestEvent.respondWith(stdResp.InternalServerError('Failed to get channels.'));
				erroredOut = true;
			});

			if (erroredOut) {
				return;
			} else {
				// Customized strinification to handle BigInts correctly
				const returnChannels = JSON.stringify(dbAllowedChannelQuery, (_key, value) => (typeof value === 'bigint' ? value.toString() : value));
				// Send channel list as response
				requestEvent.respondWith(stdResp.OK(returnChannels));
				return;
			}
		} else {
			// Alert API user that they shouldn't be doing this
			requestEvent.respondWith(stdResp.Forbidden('You can only view your own channels.'));
		}
	} else {
		// Alert API user that they messed up
		requestEvent.respondWith(stdResp.BadRequest(stdResp.Strings.missingParams));
	}
};
