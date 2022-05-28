import { dbClient } from '../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	// Log4Deno deps
	log,
	LT,
} from '../../deps.ts';
import { infoColor2 } from '../commandUtils.ts';

export const info = (message: DiscordenoMessage) => {
	// Light telemetry to see how many times a command is being run
	dbClient.execute(`CALL INC_CNT("info");`).catch((e) => {
		log(LT.ERROR, `Failed to call stored procedure INC_CNT: ${JSON.stringify(e)}`);
	});

	message.send({
		embeds: [{
			color: infoColor2,
			title: 'The Artificer, a Discord bot that specializing in rolling dice and calculating math',
			description: `The Artificer is developed by Ean AKA Burn_E99.
Additional information can be found on my website [here](https://discord.burne99.com/TheArtificer/).
Want to check out my source code?  Check it out [here](https://github.com/Burn-E99/TheArtificer).
Need help with this bot?  Join my support server [here](https://discord.gg/peHASXMZYv).`,
		}],
	}).catch((e) => {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	});
};
