import config from '../../../config.ts';
import { dbClient } from '../../db.ts';
import {
	// nanoid deps
	nanoid,
	// Discordeno deps
	sendMessage,
} from '../../../deps.ts';
import { generateApiDeleteEmail } from '../../commandUtils.ts';
import utils from '../../utils.ts';
import stdResp from '../stdResponses.ts';

export const apiKeyDelete = async (requestEvent: Deno.RequestEvent, query: Map<string, string>, apiUserid: BigInt, apiUserEmail: string, apiUserDelCode: string) => {
	if (query.has('user') && ((query.get('user') || '').length > 0) && query.has('email') && ((query.get('email') || '').length > 0)) {
		if (apiUserid === BigInt(query.get('user') || '0') && apiUserEmail === query.get('email')) {
			if (query.has('code') && ((query.get('code') || '').length > 0)) {
				if ((query.get('code') || '') === apiUserDelCode) {
					// User has recieved their delete code and we need to delete the account now
					let erroredOut = false;

					await dbClient.execute('DELETE FROM allowed_channels WHERE userid = ?', [apiUserid]).catch((e) => {
						utils.commonLoggers.dbError('apiKeyDelete.ts:25', 'insert into', e);
						requestEvent.respondWith(stdResp.InternalServerError('Channel Clean Failed.'));
						erroredOut = true;
					});
					if (erroredOut) {
						return;
					}

					await dbClient.execute('DELETE FROM all_keys WHERE userid = ?', [apiUserid]).catch((e) => {
						utils.commonLoggers.dbError('apiKeyDelete.ts:34', 'delete from', e);
						requestEvent.respondWith(stdResp.InternalServerError('Delete Key Failed.'));
						erroredOut = true;
					});
					if (erroredOut) {
						return;
					} else {
						// Send OK as response to indicate key deletion was successful
						requestEvent.respondWith(stdResp.OK('You have been removed from the DB, Goodbye.'));
						return;
					}
				} else {
					// Alert API user that they shouldn't be doing this
					requestEvent.respondWith(stdResp.Forbidden('Invalid Delete Code.'));
				}
			} else {
				// User does not have their delete code yet, so we need to generate one and email it to them
				const deleteCode = await nanoid(10);

				let erroredOut = false;

				// Execute the DB modification
				await dbClient.execute('UPDATE all_keys SET deleteCode = ? WHERE userid = ?', [deleteCode, apiUserid]).catch((e) => {
					utils.commonLoggers.dbError('apiKeyDelete.ts:57', 'update', e);
					requestEvent.respondWith(stdResp.InternalServerError('Delete Code Failed'));
					erroredOut = true;
				});
				if (erroredOut) {
					return;
				}

				// "Send" the email
				await sendMessage(config.api.email, generateApiDeleteEmail(apiUserEmail, deleteCode)).catch(() => {
					requestEvent.respondWith(stdResp.InternalServerError('Failed to send email.'));
					erroredOut = true;
				});
				if (erroredOut) {
					return;
				} else {
					// Send API key as response
					requestEvent.respondWith(stdResp.FailedDependency('Please look for an email containing a Delete Key and run this query again with said key.'));
					return;
				}
			}
		} else {
			// Alert API user that they shouldn't be doing this
			requestEvent.respondWith(stdResp.Forbidden('You can only delete your own key.'));
		}
	} else {
		// Alert API user that they messed up
		requestEvent.respondWith(stdResp.BadRequest(stdResp.Strings.missingParams));
	}
};
