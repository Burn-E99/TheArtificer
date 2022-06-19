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
	// httpd deps
	Status,
	STATUS_TEXT,
} from '../../../deps.ts';
import { generateApiKeyEmail } from '../../commandUtils.ts';

export const apiKey = async (requestEvent: Deno.RequestEvent, query: Map<string, string>) => {
	if ((query.has('user') && ((query.get('user') || '').length > 0)) && (query.has('email') && ((query.get('email') || '').length > 0))) {
		// Generate new secure key
		const newKey = await nanoid(25);

		// Flag to see if there is an error inside the catch
		let erroredOut = false;

		// Insert new key/user pair into the db
		await dbClient.execute('INSERT INTO all_keys(userid,apiKey,email) values(?,?,?)', [BigInt(query.get('user') || '0'), newKey, (query.get('email') || '').toLowerCase()]).catch(
			(e) => {
				log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
				requestEvent.respondWith(new Response(`${STATUS_TEXT.get(Status.InternalServerError)}-9`, { status: Status.InternalServerError }));
				erroredOut = true;
			},
		);

		// Exit this case now if catch errored
		if (erroredOut) {
			return;
		}

		// "Send" the email
		await sendMessage(config.api.email, generateApiKeyEmail(query.get('email') || 'no email', newKey)).catch(() => {
			requestEvent.respondWith(new Response('Message 31 failed to send.', { status: Status.InternalServerError }));
			erroredOut = true;
		});

		if (erroredOut) {
			return;
		} else {
			// Send API key as response
			requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.OK), { status: Status.OK }));
			return;
		}
	} else {
		// Alert API user that they messed up
		requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.BadRequest), { status: Status.BadRequest }));
	}
};
