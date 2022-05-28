import { dbClient } from '../../db.ts';
import {
	// Discordeno deps
	DiscordenoMessage,
	EmbedField,
	// Log4Deno deps
	log,
	LT,
} from '../../../deps.ts';
import { infoColor2 } from '../../commandUtils.ts';
import { compilingStats } from '../../commonEmbeds.ts';

export const auditDB = async (message: DiscordenoMessage) => {
	try {
		const m = await message.send(compilingStats);

		// Get DB statistics
		const auditQuery = await dbClient.query(`SELECT * FROM db_size;`).catch((e) => {
			log(LT.ERROR, `Failed to query DB: ${JSON.stringify(e)}`);
		});

		// Turn all tables into embed fields, currently only properly will handle 25 tables, but we'll fix that when artificer gets 26 tables
		const embedFields: Array<EmbedField> = [];
		auditQuery.forEach((row: any) => {
			embedFields.push({
				name: `${row.table}`,
				value: `**Size:** ${row.size} MB
**Rows:** ${row.rows}`,
				inline: true,
			});
		});

		// Send the results
		m.edit({
			embeds: [{
				color: infoColor2,
				title: 'Database Audit',
				description: 'Lists all tables with their current size and row count.',
				timestamp: new Date().toISOString(),
				fields: embedFields,
			}],
		}).catch((e) => {
			log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
		});
	} catch (e) {
		log(LT.ERROR, `Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
	}
};
