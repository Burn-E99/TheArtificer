import { add, update } from './aliasAddUpdate.ts';
import { clone } from './clone.ts';
import { deleteAll, deleteOne } from './aliasDelete.ts';
import { help } from 'commands/aliasCmd/aliasHelp.ts';
import { list } from 'commands/aliasCmd/list.ts';
import { rename } from './rename.ts';
import { run } from 'commands/aliasCmd/run.ts';
import { view } from 'commands/aliasCmd/view.ts';

export default {
  add,
  clone,
  deleteAll,
  deleteOne,
  help,
  list,
  rename,
  run,
  update,
  view,
};
