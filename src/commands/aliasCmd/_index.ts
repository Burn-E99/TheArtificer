import { add, update } from './aliasAddUpdate.ts';
import { deleteAll, deleteOne } from './aliasDelete.ts';
import { help } from 'commands/aliasCmd/aliasHelp.ts';
import { list } from 'commands/aliasCmd/list.ts';
import { run } from 'commands/aliasCmd/run.ts';
import { view } from 'commands/aliasCmd/view.ts';

export default {
  add,
  deleteAll,
  deleteOne,
  help,
  list,
  run,
  update,
  view,
};
