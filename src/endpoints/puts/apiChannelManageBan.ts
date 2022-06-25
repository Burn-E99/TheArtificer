import config from '../../../config.ts';
import { dbClient } from '../../db.ts';
import {
	// Log4Deno deps
	log,
	LT,
} from '../../../deps.ts';
import stdResp from '../stdResponses.ts';
import utils from '../../utils.ts';

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
				utils.commonLoggers.dbError('apiChannelManageBan.ts:28', 'update', e);
				requestEvent.respondWith(stdResp.InternalServerError('Failed to update channel.'));
				erroredOut = true;
			});

			// Exit this case now if catch errored
			if (erroredOut) {
				return;
			} else {
				// Send OK to indicate modification was successful
				requestEvent.respondWith(stdResp.OK(`Successfully active to ${value}.`));
				return;
			}
		} else {
			// Alert API user that they shouldn't be doing this
			requestEvent.respondWith(stdResp.Forbidden(stdResp.Strings.restricted));
		}
	} else {
		// Alert API user that they messed up
		requestEvent.respondWith(stdResp.BadRequest(stdResp.Strings.missingParams));
	}
};
