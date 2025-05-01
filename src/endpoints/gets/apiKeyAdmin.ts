import { nanoid } from '@nanoid';

import config from '/config.ts';

import dbClient from 'db/client.ts';

import stdResp from 'endpoints/stdResponses.ts';
import { verifyQueryHasParams } from 'endpoints/utils.ts';

import utils from 'src/utils.ts';

export const apiKeyAdmin = async (query: Map<string, string>, apiUserid: bigint): Promise<Response> => {
  if (verifyQueryHasParams(query, ['user', 'a'])) {
    if (apiUserid === config.api.admin && apiUserid === BigInt(query.get('a') || '0')) {
      // Generate new secure key
      const newKey = await nanoid(25);

      // Flag to see if there is an error inside the catch
      let erroredOut = false;

      // Insert new key/user pair into the db
      await dbClient.execute('INSERT INTO all_keys(userid,apiKey) values(?,?)', [apiUserid, newKey]).catch((e) => {
        utils.commonLoggers.dbError('apiKeyAdmin.ts:24', 'insert into', e);
        erroredOut = true;
      });

      // Exit this case now if catch errored
      if (erroredOut) {
        return stdResp.InternalServerError('Failed to store key.');
      } else {
        // Send API key as response
        return stdResp.OK(JSON.stringify({ key: newKey, userid: query.get('user') }));
      }
    } else {
      // Only allow the db admin to use this API
      return stdResp.Forbidden(stdResp.Strings.restricted);
    }
  } else {
    // Alert API user that they messed up
    return stdResp.BadRequest(stdResp.Strings.missingParams);
  }
};
