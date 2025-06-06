import { sendMessage } from '@discordeno';
import { nanoid } from '@nanoid';

import config from '~config';

import dbClient from 'db/client.ts';

import stdResp from 'endpoints/stdResponses.ts';
import { verifyQueryHasParams } from 'endpoints/utils.ts';

import { generateApiKeyEmail } from 'embeds/api.ts';

import utils from 'utils/utils.ts';

export const apiKey = async (query: Map<string, string>): Promise<Response> => {
  if (verifyQueryHasParams(query, ['user', 'email'])) {
    // Generate new secure key
    const newKey = await nanoid(25);

    // Flag to see if there is an error inside the catch
    let erroredOut = false;

    // Insert new key/user pair into the db
    await dbClient
      .execute('INSERT INTO all_keys(userid,apiKey,email) values(?,?,?)', [BigInt(query.get('user') || '0'), newKey, (query.get('email') || '').toLowerCase()])
      .catch((e) => {
        utils.commonLoggers.dbError('apiKey.ts:27', 'insert into', e);
        erroredOut = true;
      });

    // Exit this case now if catch errored
    if (erroredOut) {
      return stdResp.InternalServerError('Failed to store key.');
    }

    // "Send" the email
    await sendMessage(config.api.email, generateApiKeyEmail(query.get('email') || 'no email', newKey)).catch(() => {
      erroredOut = true;
    });

    if (erroredOut) {
      return stdResp.InternalServerError('Failed to send email.');
    } else {
      // Send basic OK to indicate key has been sent
      return stdResp.OK('Email Sent.');
    }
  } else {
    // Alert API user that they messed up
    return stdResp.BadRequest(stdResp.Strings.missingParams);
  }
};
