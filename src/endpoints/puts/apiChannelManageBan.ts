import config from '~config';

import dbClient from 'db/client.ts';

import stdResp from 'endpoints/stdResponses.ts';
import { verifyQueryHasParams } from 'endpoints/utils.ts';

import utils from 'src/utils.ts';

export const apiChannelManageBan = async (query: Map<string, string>, apiUserid: bigint, path: string): Promise<Response> => {
  if (verifyQueryHasParams(query, ['user', 'channel', 'a'])) {
    if (apiUserid === config.api.admin && apiUserid === BigInt(query.get('a') || '0')) {
      // Flag to see if there is an error inside the catch
      let value,
        erroredOut = false;

      // Determine value to set
      if (path.toLowerCase().includes('un')) {
        value = 0;
      } else {
        value = 1;
      }

      // Execute the DB modification
      await dbClient
        .execute('UPDATE allowed_channels SET banned = ? WHERE userid = ? AND channelid = ?', [value, apiUserid, BigInt(query.get('channel') || '0')])
        .catch((e) => {
          utils.commonLoggers.dbError('apiChannelManageBan.ts:28', 'update', e);
          erroredOut = true;
        });

      // Exit this case now if catch errored
      if (erroredOut) {
        return stdResp.InternalServerError('Failed to update channel.');
      } else {
        // Send OK to indicate modification was successful
        return stdResp.OK(`Successfully active to ${value}.`);
      }
    } else {
      // Alert API user that they shouldn't be doing this
      return stdResp.Forbidden(stdResp.Strings.restricted);
    }
  } else {
    // Alert API user that they messed up
    return stdResp.BadRequest(stdResp.Strings.missingParams);
  }
};
