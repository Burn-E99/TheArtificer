import config from '../../../config.ts';
import { dbClient } from '../../db.ts';
import {
	// Log4Deno deps
	log,
	LT,
	// nanoid deps
	nanoid,
	// Discordeno deps
	sendMessage,
} from '../../../deps.ts';
import { generateApiKeyEmail } from '../../commandUtils.ts';
import utils from '../../utils.ts';
import stdResp from '../stdResponses.ts';

export const apiKey = async (requestEvent: Deno.RequestEvent, query: Map<string, string>) => {
	if ((query.has('user') && ((query.get('user') || '').length > 0)) && (query.has('email') && ((query.get('email') || '').length > 0))) {
		// Generate new secure key
		const newKey = await nanoid(25);

		// Flag to see if there is an error inside the catch
		let erroredOut = false;

		// Insert new key/user pair into the db
		await dbClient.execute('INSERT INTO all_keys(userid,apiKey,email) values(?,?,?)', [BigInt(query.get('user') || '0'), newKey, (query.get('email') || '').toLowerCase()]).catch(
			(e) => {
				utils.commonLoggers.dbError('apiKey.ts:27', 'insert into', e);
				requestEvent.respondWith(stdResp.InternalServerError('Failed to store key.'));
				erroredOut = true;
			},
		);

		// Exit this case now if catch errored
		if (erroredOut) {
			return;
		}

		// "Send" the email
		await sendMessage(config.api.email, generateApiKeyEmail(query.get('email') || 'no email', newKey)).catch(() => {
			requestEvent.respondWith(stdResp.InternalServerError('Failed to send email.'));
			erroredOut = true;
		});

		if (erroredOut) {
			return;
		} else {
			// Send basic OK to indicate key has been sent
			requestEvent.respondWith(stdResp.OK('Email Sent.'));
			return;
		}
	} else {
		// Alert API user that they messed up
		requestEvent.respondWith(stdResp.BadRequest(stdResp.Strings.missingParams));
	}
};
