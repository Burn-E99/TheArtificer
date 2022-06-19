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
import { generateApiDeleteEmail } from '../../commandUtils.ts';

export const apiKeyDelete = async (requestEvent: Deno.RequestEvent, query: Map<string, string>, apiUserid: BigInt, apiUserEmail: string, apiUserDelCode: string) => {
	if (query.has('user') && ((query.get('user') || '').length > 0) && query.has('email') && ((query.get('email') || '').length > 0)) {
		if (apiUserid === BigInt(query.get('user') || '0') && apiUserEmail === query.get('email')) {
			if (query.has('code') && ((query.get('code') || '').length > 0)) {
				if ((query.get('code') || '') === apiUserDelCode) {
					// User has recieved their delete code and we need to delete the account now
					let erroredOut = false;

					await dbClient.execute('DELETE FROM allowed_channels WHERE userid = ?', [apiUserid]).catch((e) => {
						log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
						requestEvent.respondWith(new Response(`${STATUS_TEXT.get(Status.InternalServerError)}-6`, { status: Status.InternalServerError }));
						erroredOut = true;
					});
					if (erroredOut) {
						return;
					}

					await dbClient.execute('DELETE FROM all_keys WHERE userid = ?', [apiUserid]).catch((e) => {
						log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
						requestEvent.respondWith(new Response(`${STATUS_TEXT.get(Status.InternalServerError)}-7`, { status: Status.InternalServerError }));
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
					// Alert API user that they shouldn't be doing this
					requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.Forbidden), { status: Status.Forbidden }));
				}
			} else {
				// User does not have their delete code yet, so we need to generate one and email it to them
				const deleteCode = await nanoid(10);

				let erroredOut = false;

				// Execute the DB modification
				await dbClient.execute('UPDATE all_keys SET deleteCode = ? WHERE userid = ?', [deleteCode, apiUserid]).catch((e) => {
					log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
					requestEvent.respondWith(new Response(`${STATUS_TEXT.get(Status.InternalServerError)}-8`, { status: Status.InternalServerError }));
					erroredOut = true;
				});
				if (erroredOut) {
					return;
				}

				// "Send" the email
				await sendMessage(config.api.email, generateApiDeleteEmail(apiUserEmail, deleteCode)).catch(() => {
					requestEvent.respondWith(new Response('Message 30 failed to send.', { status: Status.InternalServerError }));
					erroredOut = true;
				});
				if (erroredOut) {
					return;
				} else {
					// Send API key as response
					requestEvent.respondWith(new Response(STATUS_TEXT.get(Status.FailedDependency), { status: Status.FailedDependency }));
					return;
				}
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
