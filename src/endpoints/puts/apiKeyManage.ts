import config from '/config.ts';

import dbClient from 'db/client.ts';

import stdResp from 'endpoints/stdResponses.ts';
import { verifyQueryHasParams } from 'endpoints/utils.ts';

import utils from 'src/utils.ts';

export const apiKeyManage = async (query: Map<string, string>, apiUserid: bigint, path: string): Promise<Response> => {
  if (verifyQueryHasParams(query, ['user', 'a'])) {
    if (apiUserid === config.api.admin && apiUserid === BigInt(query.get('a') || '0')) {
      // Flag to see if there is an error inside the catch
      let key: string,
        value: number,
        erroredOut = false;

      // Determine key to edit
      if (path.toLowerCase().includes('ban')) {
        key = 'banned';
      } else {
        key = 'active';
      }

      // Determine value to set
      if (path.toLowerCase().includes('de') || path.toLowerCase().includes('un')) {
        value = 0;
      } else {
        value = 1;
      }

      // Execute the DB modification
      await dbClient.execute('UPDATE all_keys SET ?? = ? WHERE userid = ?', [key, value, apiUserid]).catch((e) => {
        utils.commonLoggers.dbError('apiKeyManage.ts', 'update', e);
        erroredOut = true;
      });

      // Exit this case now if catch errored
      if (erroredOut) {
        return stdResp.InternalServerError(`Failed to ${key} to ${value}.`);
      } else {
        // Send OK as response to indicate modification was successful
        return stdResp.OK(`Successfully ${key} to ${value}.`);
      }
    } else {
      // Alert API user that they shouldn't be doing this
      return stdResp.Forbidden('You can only manage your own key.');
    }
  } else {
    // Alert API user that they messed up
    return stdResp.BadRequest(stdResp.Strings.missingParams);
  }
};
