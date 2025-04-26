import { apiKeyDelete } from './deletes/apiKeyDelete.ts';
import { apiKey } from './gets/apiKey.ts';
import { apiRoll } from './gets/apiRoll.ts';
import { apiKeyAdmin } from './gets/apiKeyAdmin.ts';
import { apiChannel } from './gets/apiChannel.ts';
import { heatmapPng } from './gets/heatmapPng.ts';
import { apiChannelAdd } from './posts/apiChannelAdd.ts';
import { apiKeyManage } from './puts/apiKeyManage.ts';
import { apiChannelManageBan } from './puts/apiChannelManageBan.ts';
import { apiChannelManageActive } from './puts/apiChannelManageActive.ts';

export default {
  delete: {
    apiKeyDelete,
  },
  get: {
    apiKey,
    apiRoll,
    apiKeyAdmin,
    apiChannel,
    heatmapPng,
  },
  post: {
    apiChannelAdd,
  },
  put: {
    apiKeyManage,
    apiChannelManageBan,
    apiChannelManageActive,
  },
};
