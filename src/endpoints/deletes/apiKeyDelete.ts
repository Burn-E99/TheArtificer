import { sendMessage } from '@discordeno';
import { nanoid } from '@nanoid';

import config from '~config';

import dbClient from 'db/client.ts';

import stdResp from 'endpoints/stdResponses.ts';
import { verifyQueryHasParams } from 'endpoints/utils.ts';

import { generateApiDeleteEmail } from 'src/commandUtils.ts';
import utils from 'src/utils.ts';

export const apiKeyDelete = async (query: Map<string, string>, apiUserid: bigint, apiUserEmail: string, apiUserDelCode: string): Promise<Response> => {
  if (verifyQueryHasParams(query, ['user', 'email'])) {
    if (apiUserid === BigInt(query.get('user') || '0') && apiUserEmail === query.get('email')) {
      if (verifyQueryHasParams(query, ['code'])) {
        if ((query.get('code') || '') === apiUserDelCode) {
          // User has received their delete code and we need to delete the account now
          let erroredOut = false;

          await dbClient.execute('DELETE FROM allowed_channels WHERE userid = ?', [apiUserid]).catch((e) => {
            utils.commonLoggers.dbError('apiKeyDelete.ts:25', 'insert into', e);
            erroredOut = true;
          });
          if (erroredOut) {
            return stdResp.InternalServerError('Channel Clean Failed.');
          }

          await dbClient.execute('DELETE FROM all_keys WHERE userid = ?', [apiUserid]).catch((e) => {
            utils.commonLoggers.dbError('apiKeyDelete.ts:34', 'delete from', e);
            erroredOut = true;
          });
          if (erroredOut) {
            return stdResp.InternalServerError('Delete Key Failed.');
          } else {
            // Send OK as response to indicate key deletion was successful
            return stdResp.OK('You have been removed from the DB, Goodbye.');
          }
        } else {
          // Alert API user that they shouldn't be doing this
          return stdResp.Forbidden('Invalid Delete Code.');
        }
      } else {
        // User does not have their delete code yet, so we need to generate one and email it to them
        const deleteCode = await nanoid(10);

        let erroredOut = false;

        // Execute the DB modification
        await dbClient.execute('UPDATE all_keys SET deleteCode = ? WHERE userid = ?', [deleteCode, apiUserid]).catch((e) => {
          utils.commonLoggers.dbError('apiKeyDelete.ts:57', 'update', e);
          erroredOut = true;
        });
        if (erroredOut) {
          return stdResp.InternalServerError('Delete Code Failed');
        }

        // "Send" the email
        await sendMessage(config.api.email, generateApiDeleteEmail(apiUserEmail, deleteCode)).catch(() => {
          erroredOut = true;
        });
        if (erroredOut) {
          return stdResp.InternalServerError('Failed to send email.');
        } else {
          // Send API key as response
          return stdResp.FailedDependency('Please look for an email containing a Delete Key and run this query again with said key.');
        }
      }
    } else {
      // Alert API user that they shouldn't be doing this
      return stdResp.Forbidden('You can only delete your own key.');
    }
  } else {
    // Alert API user that they messed up
    return stdResp.BadRequest(stdResp.Strings.missingParams);
  }
};
