import dbClient from '../../db/client.ts';
import stdResp from '../stdResponses.ts';
import utils from '../../utils.ts';
import { verifyQueryHasParams } from '../utils.ts';

export const apiChannel = async (query: Map<string, string>, apiUserid: bigint): Promise<Response> => {
  if (verifyQueryHasParams(query, ['user'])) {
    if (apiUserid === BigInt(query.get('user') || '0')) {
      // Flag to see if there is an error inside the catch
      let erroredOut = false;

      // Get all channels userid has authorized
      const dbAllowedChannelQuery = await dbClient.query('SELECT * FROM allowed_channels WHERE userid = ?', [apiUserid]).catch((e) => {
        utils.commonLoggers.dbError('apiChannel.ts', 'query', e);
        erroredOut = true;
      });

      if (erroredOut) {
        return stdResp.InternalServerError('Failed to get channels.');
      } else {
        // Customized stringification to handle BigInts correctly
        const returnChannels = JSON.stringify(dbAllowedChannelQuery, (_key, value) => (typeof value === 'bigint' ? value.toString() : value));
        // Send channel list as response
        return stdResp.OK(returnChannels);
      }
    } else {
      // Alert API user that they shouldn't be doing this
      return stdResp.Forbidden('You can only view your own channels.');
    }
  } else {
    // Alert API user that they messed up
    return stdResp.BadRequest(stdResp.Strings.missingParams);
  }
};
