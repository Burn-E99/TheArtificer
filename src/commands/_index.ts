import { upsertSlashCommands } from '@discordeno';

import { alias, aliasSC } from 'commands/aliasCmd.ts';
import { api } from 'commands/apiCmd.ts';
import { audit } from 'commands/audit.ts';
import { emoji } from 'commands/emoji.ts';
import { handleMentions } from 'commands/handleMentions.ts';
import { heatmap, heatmapSC } from 'commands/heatmap.ts';
import { help, helpSC } from 'commands/help.ts';
import { info, infoSC } from 'commands/info.ts';
import { optIn } from 'commands/optIn.ts';
import { optOut } from 'commands/optOut.ts';
import { ping } from 'commands/ping.ts';
import { privacy, privacySC } from 'commands/privacy.ts';
import { report, reportSC } from 'commands/report.ts';
import { rip, ripSC } from 'commands/rip.ts';
import { roll, rollSC } from 'commands/roll.ts';
import { rollHelp } from 'commands/rollHelp.ts';
import { stats, statsSC } from 'commands/stats.ts';
import { toggleInline, toggleInlineSC } from 'commands/toggleInline.ts';
import { toggleRepeat, toggleRepeatSC } from 'commands/toggleUnrestrictedRepeat.ts';
import { version, versionSC } from 'commands/version.ts';

export const announceSlashCommands = () => {
  upsertSlashCommands([aliasSC, heatmapSC, helpSC, infoSC, privacySC, reportSC, ripSC, rollSC, statsSC, toggleInlineSC, toggleRepeatSC, versionSC]);
};

export const commands = {
  alias,
  api,
  audit,
  emoji,
  handleMentions,
  heatmap,
  help,
  info,
  optIn,
  optOut,
  ping,
  privacy,
  report,
  rip,
  roll,
  rollHelp,
  stats,
  toggleInline,
  toggleRepeat,
  version,
};

export const slashCommandDetails = {
  aliasSC,
  heatmapSC,
  helpSC,
  infoSC,
  privacySC,
  ripSC,
  reportSC,
  rollSC,
  statsSC,
  toggleInlineSC,
  toggleRepeatSC,
  versionSC,
};
