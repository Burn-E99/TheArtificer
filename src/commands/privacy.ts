import config from '../../config.ts';
import { dbClient, queries } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
} from '../../deps.ts';
import { infoColor1 } from '../commandUtils.ts';
import utils from '../utils.ts';

export const privacy = (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(queries.callIncCnt('privacy')).catch((e) => utils.commonLoggers.dbError('privacy.ts:15', 'call sproc INC_CNT on', e));

	message.send({
		embeds: [{
			color: infoColor1,
			title: 'Privacy Policy',
			fields: [{
				name: 'The Artificer does not track or collect user information via Discord.',
				value:
					`The only user submitted information that is stored is submitted via the \`${config.prefix}report\` command.  This information is only stored for a short period of time in a location that only the Developer of The Artificer can see.

For more details, please check out the Privacy Policy on the GitHub [here](https://github.com/Burn-E99/TheArtificer/blob/master/PRIVACY.md).

Terms of Service can also be found on GitHub [here](https://github.com/Burn-E99/TheArtificer/blob/master/TERMS.md).`,
			}],
		}],
	}).catch((e: Error) => utils.commonLoggers.messageSendError('privacy.ts:33', message, e));
};
