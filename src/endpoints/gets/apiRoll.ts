import config from '../../../config.ts';
import { dbClient, queries } from '../../db.ts';
import {
	// Discordeno deps
	cache,
	// Log4Deno deps
	log,
	LT,
} from '../../../deps.ts';
import { QueuedRoll, RollModifiers } from '../../mod.d.ts';
import { queueRoll } from '../../solver/rollQueue.ts';
import stdResp from '../stdResponses.ts';

const apiWarning = `The following roll was conducted using my built in API.  If someone in this channel did not request this roll, please report API abuse here: <${config.api.supportURL}>`;

export const apiRoll = async (requestEvent: Deno.RequestEvent, query: Map<string, string>, apiUserid: BigInt) => {
	// Make sure query contains all the needed parts
	if (
		(query.has('rollstr') && ((query.get('rollstr') || '').length > 0)) && (query.has('channel') && ((query.get('channel') || '').length > 0)) &&
		(query.has('user') && ((query.get('user') || '').length > 0))
	) {
		if (query.has('n') && query.has('m')) {
			// Alert API user that they shouldn't be doing this
			requestEvent.respondWith(stdResp.BadRequest('Cannot have both \'n\' and \'m\'.'));
			return;
		}

		// Check if user is authenticated to use this endpoint
		let authorized = false;
		let hideWarn = false;

		// Check if the db has the requested userid/channelid combo, and that the requested userid matches the userid linked with the api key
		const dbChannelQuery = await dbClient.query('SELECT active, banned FROM allowed_channels WHERE userid = ? AND channelid = ?', [apiUserid, BigInt(query.get('channel') || '0')]);
		if (dbChannelQuery.length === 1 && (apiUserid === BigInt(query.get('user') || '0')) && dbChannelQuery[0].active && !dbChannelQuery[0].banned) {
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
				const originalCommand = query.get('rollstr');

				if (rollCmd.length === 0) {
					// Alert API user that they messed up
					requestEvent.respondWith(stdResp.BadRequest('rollCmd is required.'));

					// Always log API rolls for abuse detection
					dbClient.execute(queries.insertRollLogCmd(1, 1), [originalCommand, 'EmptyInput', null]).catch((e) => {
						log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
					});
					return;
				}

				if (query.has('o') && (query.get('o')?.toLowerCase() !== 'd' && query.get('o')?.toLowerCase() !== 'a')) {
					// Alert API user that they messed up
					requestEvent.respondWith(stdResp.BadRequest('Order must be set to \'a\' or \'d\'.'));

					// Always log API rolls for abuse detection
					dbClient.execute(queries.insertRollLogCmd(1, 1), [originalCommand, 'BadOrder', null]).catch((e) => {
						log(LT.ERROR, `Failed to insert into database: ${JSON.stringify(e)}`);
					});
					return;
				}

				// Clip off the leading prefix.  API calls must be formatted with a prefix at the start to match how commands are sent in Discord
				rollCmd = rollCmd.substring(rollCmd.indexOf(config.prefix) + 2).replace(/%20/g, ' ');

				const modifiers: RollModifiers = {
					noDetails: query.has('nd'),
					superNoDetails: query.has('snd'),
					spoiler: query.has('s') ? '||' : '',
					maxRoll: query.has('m'),
					nominalRoll: query.has('n'),
					gmRoll: query.has('gms'),
					gms: query.has('gms') ? (query.get('gms') || '').split(',') : [],
					order: query.has('o') ? (query.get('o')?.toLowerCase() || '') : '',
					count: query.has('c'),
					valid: true,
					apiWarn: hideWarn ? '' : apiWarning,
				};

				// Parse the roll and get the return text
				await queueRoll(
					<QueuedRoll> {
						apiRoll: true,
						api: { requestEvent, channelId: BigInt(query.get('channel') || '0'), userId: BigInt(query.get('user') || '') },
						rollCmd,
						modifiers,
						originalCommand,
					},
				);
			} catch (err) {
				// Handle any errors we missed
				log(LT.ERROR, `Unhandled Error: ${JSON.stringify(err)}`);
				requestEvent.respondWith(stdResp.InternalServerError('Something went wrong.'));
			}
		} else {
			// Alert API user that they messed up
			requestEvent.respondWith(
				stdResp.Forbidden(
					`Verify you are a member of the guild you are sending this roll to.  If you are, the ${config.name} may not have that registered, please send a message in the guild so ${config.name} can register this.  This registration is temporary, so if you see this error again, just poke your server again.`,
				),
			);
		}
	} else {
		// Alert API user that they shouldn't be doing this
		requestEvent.respondWith(stdResp.BadRequest(stdResp.Strings.missingParams));
	}
};
