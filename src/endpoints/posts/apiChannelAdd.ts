import dbClient from 'db/client.ts';

import stdResp from 'endpoints/stdResponses.ts';
import { verifyQueryHasParams } from 'endpoints/utils.ts';

import utils from 'utils/utils.ts';

export const apiChannelAdd = async (query: Map<string, string>, apiUserid: bigint): Promise<Response> => {
  if (verifyQueryHasParams(query, ['user', 'channel'])) {
    if (apiUserid === BigInt(query.get('user') || '0')) {
      // Flag to see if there is an error inside the catch
      let erroredOut = false;

      // Insert new user/channel pair into the db
      await dbClient.execute('INSERT INTO allowed_channels(userid,channelid) values(?,?)', [apiUserid, BigInt(query.get('channel') || '0')]).catch((e) => {
        utils.commonLoggers.dbError('apiChannelAdd.ts:17', 'insert into', e);
        erroredOut = true;
      });

      // Exit this case now if catch errored
      if (erroredOut) {
        return stdResp.InternalServerError('Failed to store channel.');
      } else {
        // Send OK to indicate modification was successful
        return stdResp.OK('Successfully added channel.');
      }
    } else {
      // Alert API user that they shouldn't be doing this
      return stdResp.Forbidden('You can only add channels to your key.');
    }
  } else {
    // Alert API user that they messed up
    return stdResp.BadRequest(stdResp.Strings.missingParams);
  }
};
