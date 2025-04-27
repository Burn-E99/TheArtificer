import dbClient from '../../db/client.ts';
import {
  // Discordeno deps
  DiscordenoMessage,
  EmbedField,
} from '../../../deps.ts';
import { infoColor2 } from '../../commandUtils.ts';
import { compilingStats } from '../../commonEmbeds.ts';
import utils from '../../utils.ts';

interface DBSizeData {
  table: string;
  size: string;
  rows: number;
}

export const auditDB = async (message: DiscordenoMessage) => {
  try {
    const m = await message.send(compilingStats);

    // Get DB statistics
    const auditQuery = await dbClient.query(`SELECT * FROM db_size;`).catch((e) => utils.commonLoggers.dbError('auditDB.ts:19', 'query', e));

    // Turn all tables into embed fields, currently only properly will handle 25 tables, but we'll fix that when it gets 26 tables
    const embedFields: Array<EmbedField> = [];
    auditQuery.forEach((row: DBSizeData) => {
      embedFields.push({
        name: `${row.table}`,
        value: `**Size:** ${row.size} MB
**Rows:** ${row.rows}`,
        inline: true,
      });
    });

    // Send the results
    m.edit({
      embeds: [
        {
          color: infoColor2,
          title: 'Database Audit',
          description: 'Lists all tables with their current size and row count.',
          timestamp: new Date().toISOString(),
          fields: embedFields,
        },
      ],
    }).catch((e: Error) => utils.commonLoggers.messageEditError('auditDB.ts:43', message, e));
  } catch (e) {
    utils.commonLoggers.messageSendError('auditDB.ts:45', message, e as Error);
  }
};
