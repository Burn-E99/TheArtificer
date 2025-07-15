import config from '~config';

import { ReservedWords } from 'commands/aliasCmd/reservedWords.ts';

import { HelpContents, HelpPage } from 'commands/helpLibrary/helpLibrary.d.ts';

const nameRestrictions = `Alias names are case-insensitive (\`tEsT\` is stored as \`test\`, but can still be called as \`tEsT\`).

Alias Naming Restrictions:
- Max allowed length:\`${config.limits.alias.maxNameLength}\`
- Cannot include any spaces/whitespace/newlines
- Cannot be named any of the following words:
\`${ReservedWords.join('`, `')}\``;

const name = 'Roll Alias System';
const description = `This system allows you to save any roll string to a short, custom, memorable alias.

Currently, you may create up to \`${config.limits.alias.free.guild.toLocaleString()}\` per guild and \`${config.limits.alias.free.user.toLocaleString()}\` per user account.  This limit may increase or decrease in the future.

The following commands are all linked to the Roll Alias System:
\`${config.prefix}rollalias\`, \`${config.prefix}ralias\`, \`${config.prefix}alias\`, \`${config.prefix}rolla\`, \`${config.prefix}ra\`
For simplicity, all help documents use \`${config.prefix}ra\`, but any of the other commands listed above are valid.

${nameRestrictions}`;
const dict = new Map<string, HelpContents>([
  [
    'run',
    {
      name: 'Run Alias',
      description: `**Personal Mode Usage:**
- \`${config.prefix}ra [aliasName] [yVars...?]\`
- \`${config.prefix}ra run [aliasName] [yVars...?]\`
- \`${config.prefix}ra execute [aliasName] [yVars...?]\`
**Guild Mode Usage:**
- \`${config.prefix}ra guild [aliasName] [yVars...?]\`
- \`${config.prefix}ra guild run [aliasName] [yVars...?]\`
- \`${config.prefix}ra guild execute [aliasName] [yVars...?]\`

**Params:**
- \`[aliasName]\` - The name of the alias you wish to run.
- \`[yVars...?]\` - List of numbers to use for required y variables.  If no y variables are required for the alias, no y variables need to be listed.

Runs the specified personal or guild alias with the provided yVars.  If an alias is not found in Personal Mode, this will check and use a guild alias if one exists.`,
      example: [
        '`[[ra simpleAlias` => Runs the alias `simpleAlias`.  Will first check for a personal alias named `simpleAlias`, and if one is not found, will check the guild for one.',
        '`[[ra run simpleAlias` => Runs the alias `simpleAlias`.  Will first check for a personal alias named `complexAlias`, and if one is not found, will check the guild for one.',
        '`[[ra guild simpleTest` => Explicitly runs the guild alias `simpleTest`.',
        '`[[ra guild run simpleTest` => Explicitly runs the guild alias `simpleTest`.',
        '`[[ra complexAlias 10 4 7` => Runs the alias `complexAlias` with `y0=10`, `y1=4`, and `y2=7`.  Check out the `Roll Alias System > Add New Alias` help page to see how this one was initially created.  Will first check for a personal alias named `complexAlias`, and if one is not found, will check the guild for one.',
      ],
    },
  ],
  [
    'add',
    {
      name: 'Add New Alias',
      description: `**Personal Mode Usage:**
- \`${config.prefix}ra add [aliasName] [rollString...]\`
- \`${config.prefix}ra set [aliasName] [rollString...]\`
- \`${config.prefix}ra create [aliasName] [rollString...]\`
**Guild Mode Usage:** [Can be only used by Guild Owners/Admins!]
- \`${config.prefix}ra guild add [aliasName] [rollString...]\`
- \`${config.prefix}ra guild set [aliasName] [rollString...]\`
- \`${config.prefix}ra guild create [aliasName] [rollString...]\`

**Params:**
- \`[aliasName]\` - The name of the alias you wish to create.
- \`[rollString]\` - The roll string to save.  This can include any valid roll command, and allows the usage of y variables that will be required by the alias.

Creates a new alias with the specified roll string.  This is saved for use either to your personal account or to the guild the command was run in.`,
      example: [
        '`[[ra add simpleAlias [[4d20+5]] Random Text! [[4d6d1]]` => Saves `[[4d20+5]] Random Text! [[4d6d1]]` as a personal alias named `simpleAlias`',
        '`[[ra guild add simpleTest Random Text! [[4d6d1]] [[4d20+5]]` => Saves `Random Text! [[4d6d1]] [[4d20+5]]` as a guild alias named `simpleTest`',
        '',
        '`[[ra add complexAlias Attack Roll: [[4d20+5+y0]]\nDamage Roll: [[y1 * 4d8 + y2]]`\nSaves `[[4d20+5+y0]]\nDamage Roll: [[y1 * 4d8 + y2]]` as a personal alias named `complexAlias` with 3 y variables (`y0`, `y1`, and `y2`).  Check out the `Roll Alias System > Run Alias` help page to see how this one is run.',
      ],
    },
  ],
  [
    'update',
    {
      name: 'Update Existing Alias',
      description: `**Personal Mode Usage:**
- \`${config.prefix}ra update [aliasName] [rollString...]\`
- \`${config.prefix}ra replace [aliasName] [rollString...]\`
**Guild Mode Usage:** [Can be only used by Guild Owners/Admins!]
- \`${config.prefix}ra guild update [aliasName] [rollString...]\`
- \`${config.prefix}ra guild replace [aliasName] [rollString...]\`

**Params:**
- \`[aliasName]\` - The name of the alias you wish to update.
- \`[rollString]\` - New roll string to update to.  This can include any valid roll command, and allows the usage of y variables that will be required by the alias.

Updates the specified alias to the new roll string.  This overwrites the alias saved to your personal account or to the guild the command was run in.`,
      example: [
        '`[[ra update simpleAlias [[20d7r3!]] TEXT -snd` => Saves `[[20d7r3!]] TEXT -snd` over the existing personal alias `simpleAlias`.',
        '`[[ra guild update simpleTest [[8d%! + 40]]` => Saves `[[8d%! + 40]]` over the existing guild alias `simpleTest`.',
      ],
    },
  ],
  [
    'list',
    {
      name: 'List All Aliases',
      description: `**Personal Mode Usage:**
- \`${config.prefix}ra list\`
- \`${config.prefix}ra list-all\`
**Guild Mode Usage:**
- \`${config.prefix}ra guild list\`
- \`${config.prefix}ra guild list-all\`

Lists all aliases (and their number of yVars) that are saved to your personal account or to the guild the command was run in.`,
    },
  ],
  [
    'view',
    {
      name: 'Preview One Alias',
      description: `**Personal Mode Usage:**
- \`${config.prefix}ra preview [aliasName]\`
- \`${config.prefix}ra view [aliasName]\`
**Guild Mode Usage:**
- \`${config.prefix}ra guild preview [aliasName]\`
- \`${config.prefix}ra guild view [aliasName]\`

**Params:**
- \`[aliasName]\` - The name of the alias you wish to preview.

Shows the saved roll string for the specified personal or guild alias.`,
      example: ['`[[ra preview testAlias`', '`[[ra guild preview testGuildAlias`'],
    },
  ],
  [
    'rename',
    {
      name: 'Rename Alias',
      description: `**Personal Mode Usage:**
- \`${config.prefix}ra rename [oldAliasName] [newAliasName]\`
**Guild Mode Usage:** [Can be only used by Guild Owners/Admins!]
- \`${config.prefix}ra guild rename [oldAliasName] [newAliasName]\`

**Params:**
- \`[oldAliasName]\` - The name of the alias you wish to rename.
- \`[newAliasName]\` - The new name of the alias.

Renames the specified alias saved to your personal account or to the guild the command was run in.`,
      example: ['`[[ra rename testAlias newName`', '`[[ra guild rename testGuildAlias newNameToo`'],
    },
  ],
  [
    'clone',
    {
      name: 'Copy Alias to/from Guild',
      description: `**Copy to Guild Usage:** [Can be only used by Guild Owners/Admins!]
- \`${config.prefix}ra clone [aliasName]\`
- \`${config.prefix}ra copy [aliasName]\`
**Copy from Guild Usage:**
- \`${config.prefix}ra guild clone [aliasName]\`
- \`${config.prefix}ra guild copy [aliasName]\`

**Params:**
- \`[aliasName]\` - The name of the alias you wish to copy.

Copies the specified alias to/from the guild the command was run in.`,
      example: ['`[[ra clone testAlias`', '`[[ra guild clone testGuildAlias`'],
    },
  ],
  [
    'delete',
    {
      name: 'Delete One Alias',
      description: `**Personal Mode Usage:**
- \`${config.prefix}ra delete [aliasName] [verificationCode?]\`
- \`${config.prefix}ra remove [aliasName] [verificationCode?]\`
**Guild Mode Usage:** [Can be only used by Guild Owners/Admins!]
- \`${config.prefix}ra guild delete [aliasName] [verificationCode?]\`
- \`${config.prefix}ra guild remove [aliasName] [verificationCode?]\`

**Params:**
- \`[aliasName]\` - The name of the alias you wish to delete.
- \`[verificationCode?]\` - The 4 digit code to confirm that you do want to delete the alias.  If omitted, ${config.name} will request confirmation and provide a verification code to re-run the command with.

Deletes the specified alias from your personal account or to the guild the command was run in.  This is a permanent deletion and cannot be undone.`,
      example: ['`[[ra delete testAlias`', '`[[ra guild delete testGuildAlias`'],
    },
  ],
  [
    'delete-all',
    {
      name: 'Delete All Aliases',
      description: `**Personal Mode Usage:**
- \`${config.prefix}ra delete-all [verificationCode?]\`
- \`${config.prefix}ra remove-all [verificationCode?]\`
**Guild Mode Usage:** [Can be only used by Guild Owners/Admins!]
- \`${config.prefix}ra guild delete-all [verificationCode?]\`
- \`${config.prefix}ra guild remove-all [verificationCode?]\`

**Params:**
- \`[verificationCode?]\` - The 4 digit code to confirm that you do want to delete the alias.  If omitted, ${config.name} will request confirmation and provide a verification code to re-run the command with.

Deletes all aliases saved to your personal account or to the guild the command was run in.  This is a permanent deletion and cannot be undone.`,
    },
  ],
  [
    'help',
    {
      name: 'Help',
      description: `**Personal Mode Usage:**
- \`${config.prefix}ra help\`
- \`${config.prefix}ra h\`
- \`${config.prefix}ra ?\`
**Guild Mode Usage:**
- \`${config.prefix}ra guild help\`
- \`${config.prefix}ra guild h\`
- \`${config.prefix}ra guild ?\`

Opens the help library to the Roll Alias System section.`,
    },
  ],
]);

export const RollAliasHelpPages: HelpPage = {
  name,
  description,
  isPage: true,
  dict,
};
