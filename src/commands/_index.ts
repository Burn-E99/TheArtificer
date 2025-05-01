import { api } from 'commands/apiCmd.ts';
import { audit } from 'commands/audit.ts';
import { emoji } from 'commands/emoji.ts';
import { handleMentions } from 'commands/handleMentions.ts';
import { heatmap } from 'commands/heatmap.ts';
import { help } from 'commands/help.ts';
import { info } from 'commands/info.ts';
import { optIn } from 'commands/optIn.ts';
import { optOut } from 'commands/optOut.ts';
import { ping } from 'commands/ping.ts';
import { privacy } from 'commands/privacy.ts';
import { rip } from 'commands/rip.ts';
import { report } from 'commands/report.ts';
import { roll } from 'commands/roll.ts';
import { rollDecorators } from 'commands/rollDecorators.ts';
import { rollHelp } from 'commands/rollHelp.ts';
import { stats } from 'commands/stats.ts';
import { version } from 'commands/version.ts';

export default {
  ping,
  rip,
  rollHelp,
  rollDecorators,
  help,
  info,
  privacy,
  version,
  report,
  stats,
  api,
  emoji,
  roll,
  handleMentions,
  audit,
  heatmap,
  optOut,
  optIn,
};
