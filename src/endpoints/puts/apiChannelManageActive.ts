import dbClient from 'db/client.ts';

import stdResp from 'endpoints/stdResponses.ts';
import { verifyQueryHasParams } from 'endpoints/utils.ts';

import utils from 'src/utils.ts';

export const apiChannelManageActive = async (query: Map<string, string>, apiUserid: bigint, path: string): Promise<Response> => {
  if (verifyQueryHasParams(query, ['user', 'channel'])) {
    if (apiUserid === BigInt(query.get('user') || '0')) {
      // Flag to see if there is an error inside the catch
      let value,
        erroredOut = false;

      // Determine value to set
      if (path.toLowerCase().includes('de')) {
        value = 0;
      } else {
        value = 1;
      }

      // Update the requested entry
      await dbClient
        .execute('UPDATE allowed_channels SET active = ? WHERE userid = ? AND channelid = ?', [value, apiUserid, BigInt(query.get('channel') || '0')])
        .catch((e) => {
          utils.commonLoggers.dbError('apiChannelManageActive.ts:25', 'update', e);
          erroredOut = true;
        });

      // Exit this case now if catch errored
      if (erroredOut) {
        return stdResp.InternalServerError('Failed to update channel.');
      } else {
        // Send API key as response
        return stdResp.OK(`Successfully active to ${value}.`);
      }
    } else {
      // Alert API user that they shouldn't be doing this
      return stdResp.Forbidden('You can only manage your own channels.');
    }
  } else {
    // Alert API user that they messed up
    return stdResp.BadRequest(stdResp.Strings.missingParams);
  }
};
