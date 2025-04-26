import config from '../../../config.ts';
import dbClient from '../../db/client.ts';
import stdResp from '../stdResponses.ts';
import utils from '../../utils.ts';

export const apiKeyManage = async (requestEvent: Deno.RequestEvent, query: Map<string, string>, apiUserid: BigInt, path: string) => {
  if (query.has('a') && (query.get('a') || '').length > 0 && query.has('user') && (query.get('user') || '').length > 0) {
    if (apiUserid === config.api.admin && apiUserid === BigInt(query.get('a') || '0')) {
      // Flag to see if there is an error inside the catch
      let key: string,
        value: number,
        erroredOut = false;

      // Determine key to edit
      if (path.toLowerCase().indexOf('ban') > 0) {
        key = 'banned';
      } else {
        key = 'active';
      }

      // Determine value to set
      if (path.toLowerCase().indexOf('de') > 0 || path.toLowerCase().indexOf('un') > 0) {
        value = 0;
      } else {
        value = 1;
      }

      // Execute the DB modification
      await dbClient.execute('UPDATE all_keys SET ?? = ? WHERE userid = ?', [key, value, apiUserid]).catch((e) => {
        utils.commonLoggers.dbError('apiKeyManage.ts', 'update', e);
        requestEvent.respondWith(stdResp.InternalServerError(`Failed to ${key} to ${value}.`));
        erroredOut = true;
      });

      // Exit this case now if catch errored
      if (erroredOut) {
        return;
      } else {
        // Send OK as response to indicate modification was successful
        requestEvent.respondWith(stdResp.OK(`Successfully ${key} to ${value}.`));
        return;
      }
    } else {
      // Alert API user that they shouldn't be doing this
      requestEvent.respondWith(stdResp.Forbidden('You can only manage your own key.'));
    }
  } else {
    // Alert API user that they messed up
    requestEvent.respondWith(stdResp.BadRequest(stdResp.Strings.missingParams));
  }
};
