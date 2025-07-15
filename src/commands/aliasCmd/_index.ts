import { add, update } from 'commands/aliasCmd/aliasAddUpdate.ts';
import { clone } from 'commands/aliasCmd/clone.ts';
import { deleteAll, deleteOne } from 'commands/aliasCmd/aliasDelete.ts';
import { list } from 'commands/aliasCmd/list.ts';
import { rename } from 'commands/aliasCmd/rename.ts';
import { run } from 'commands/aliasCmd/run.ts';
import { view } from 'commands/aliasCmd/view.ts';

export default {
  add,
  clone,
  deleteAll,
  deleteOne,
  list,
  rename,
  run,
  update,
  view,
};
