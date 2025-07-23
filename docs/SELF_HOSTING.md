## Self Hosting The Artificer
The Artificer is built on [Deno](https://deno.land/) `v2.2.9` using [Discordeno](https://discordeno.mod.land/) `v12.0.1`.  If you choose to run this yourself, you will need to rename `config.example.ts` to `config.ts` and edit some values.  You will need to create a new [Discord Application](https://discord.com/developers/applications) and copy the newly generated token into the `"token"` key.  If you want to utilize some of the bots dev features, you will need to fill in the keys `"logChannel"` and `"reportChannel"` with text channel IDs and `"devServer"` with a guild ID.

You will also need to install and setup a MySQL database with a user for the bot to use to add/modify the database.  This user must have the "DB Manager" admin rights and "REFERENCES" Global Privileges.  Once the DB is installed and a user is setup, run the provided `db\initialize.ts` to create the schema and tables.  After this, run `db\populateDefaults.ts` to insert some needed values into the tables.

Once everything is set up, starting the bot can simply be done with the command in `start.command`.

If you choose to run version `1.1.0` or newer, ensure you disable the API in `config.ts` or verify you have properly secured your instance of The Artificer.  If you enable the API, you should manually generate a 25 char nanoid and place it in `config.api.adminKey` and copy your `userid` and place it in `config.api.admin` before running `db\populateDefaults.ts`.

If you disable the API, please note some features like the roll heatmap and roll webview will not be available.
