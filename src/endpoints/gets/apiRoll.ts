import { cache } from '@discordeno';
import { log, LogTypes as LT } from '@Log4Deno';

import config from '~config';

import { RollModifiers } from 'artigen/dice/dice.d.ts';

import { sendRollRequest } from 'artigen/managers/queueManager.ts';

import dbClient from 'db/client.ts';
import { queries } from 'db/common.ts';

import stdResp from 'endpoints/stdResponses.ts';
import { verifyQueryHasParams } from 'endpoints/utils.ts';

import utils from 'utils/utils.ts';

const apiWarning = `The following roll was conducted using my built in API.  If someone in this channel did not request this roll, please report API abuse here: <${config.api.supportURL}>`;

export const apiRoll = async (query: Map<string, string>, apiUserid: bigint): Promise<Response> => {
  // Make sure query contains all the needed parts
  if (verifyQueryHasParams(query, ['user', 'channel', 'rollstr'])) {
    if (query.has('n') && query.has('m')) {
      // Alert API user that they shouldn't be doing this
      return stdResp.BadRequest("Cannot have both 'n' and 'm'.");
    }

    // Check if user is authenticated to use this endpoint
    let authorized = false;
    let hideWarn = false;

    // Check if the db has the requested userid/channelid combo, and that the requested userid matches the userid linked with the api key
    const dbChannelQuery = await dbClient.query('SELECT active, banned FROM allowed_channels WHERE userid = ? AND channelid = ?', [
      apiUserid,
      BigInt(query.get('channel') || '0'),
    ]);
    if (dbChannelQuery.length === 1 && apiUserid === BigInt(query.get('user') || '0') && dbChannelQuery[0].active && !dbChannelQuery[0].banned) {
      // Get the guild from the channel and make sure user is in said guild
      const guild = cache.channels.get(BigInt(query.get('channel') || ''))?.guild;
      if (guild && guild.members.get(BigInt(query.get('user') || ''))?.id) {
        const dbGuildQuery = await dbClient.query('SELECT active, banned, hidewarn FROM allowed_guilds WHERE guildid = ? AND channelid = ?', [
          guild.id,
          BigInt(query.get('channel') || '0'),
        ]);

        // Make sure guild allows API rolls
        if (dbGuildQuery.length === 1 && dbGuildQuery[0].active && !dbGuildQuery[0].banned) {
          authorized = true;
          hideWarn = dbGuildQuery[0].hidewarn;
        }
      }
    }

    if (authorized) {
      // Rest of this command is in a try-catch to protect all sends/edits from erroring out
      try {
        // Make sure rollCmd is not undefined
        let rollCmd = query.get('rollstr') || '';
        const originalCommand = query.get('rollstr') || '';

        if (rollCmd.length === 0) {
          // Always log API rolls for abuse detection
          dbClient
            .execute(queries.insertRollLogCmd(1, 1), [originalCommand, 'EmptyInput', null])
            .catch((e) => utils.commonLoggers.dbError('apiRoll.ts:65', 'insert', e));

          // Alert API user that they messed up
          return stdResp.BadRequest('rollCmd is required.');
        }

        if (query.has('o') && query.get('o')?.toLowerCase() !== 'd' && query.get('o')?.toLowerCase() !== 'a') {
          // Always log API rolls for abuse detection
          dbClient
            .execute(queries.insertRollLogCmd(1, 1), [originalCommand, 'BadOrder', null])
            .catch((e) => utils.commonLoggers.dbError('apiRoll.ts:66', 'insert', e));

          // Alert API user that they messed up
          return stdResp.BadRequest("Order must be set to 'a' or 'd'.");
        }

        // Clip off the leading prefix.  API calls must be formatted with a prefix at the start to match how commands are sent in Discord
        rollCmd = rollCmd.replace(/%20/g, ' ').trim();

        const modifiers: RollModifiers = {
          noDetails: query.has('nd'),
          superNoDetails: query.has('snd'),
          hideRaw: query.has('hr'),
          spoiler: query.has('s') ? '||' : '',
          maxRoll: query.has('m') || query.has('max'),
          minRoll: query.has('min'),
          nominalRoll: query.has('n'),
          gmRoll: query.has('gms'),
          gms: query.has('gms') ? (query.get('gms') || '').split(',') : [],
          order: query.has('o') ? query.get('o')?.toLowerCase() || '' : '',
          count: query.has('c'),
          commaTotals: query.has('ct'),
          confirmCrit: query.has('cc'),
          rollDist: query.has('rd'),
          apiWarn: hideWarn ? '' : apiWarning,
          valid: true,
          error: new Error(),
        };

        return new Promise<Response>((resolve) => {
          sendRollRequest({
            apiRoll: true,
            api: { resolve, channelId: BigInt(query.get('channel') || '0'), userId: BigInt(query.get('user') || '') },
            rollCmd,
            modifiers,
            originalCommand,
          });
        });

        // Parse the roll and get the return text
      } catch (err) {
        // Handle any errors we missed
        log(LT.ERROR, `Unhandled Error: ${JSON.stringify(err)}`);
        return stdResp.InternalServerError('Something went wrong.');
      }
    } else {
      // Alert API user that they messed up
      return stdResp.Forbidden(
        `Verify you are a member of the guild you are sending this roll to.  If you are, the ${config.name} may not have that registered, please send a message in the guild so ${config.name} can register this.  This registration is temporary, so if you see this error again, just poke your server again.`,
      );
    }
  } else {
    // Alert API user that they shouldn't be doing this
    return stdResp.BadRequest(stdResp.Strings.missingParams);
  }
};
