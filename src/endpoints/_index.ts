import { apiKeyDelete } from 'endpoints/deletes/apiKeyDelete.ts';

import { apiChannel } from 'endpoints/gets/apiChannel.ts';
import { apiKey } from 'endpoints/gets/apiKey.ts';
import { apiKeyAdmin } from 'endpoints/gets/apiKeyAdmin.ts';
import { apiRoll } from 'endpoints/gets/apiRoll.ts';
import { heatmapPng } from 'endpoints/gets/heatmapPng.ts';

import { apiChannelAdd } from 'endpoints/posts/apiChannelAdd.ts';

import { apiChannelManageActive } from 'endpoints/puts/apiChannelManageActive.ts';
import { apiChannelManageBan } from 'endpoints/puts/apiChannelManageBan.ts';
import { apiKeyManage } from 'endpoints/puts/apiKeyManage.ts';

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
