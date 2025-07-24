# The Artificer's Privacy Policy
## Information relating to Discord Interactions
### Public Bot Information
Publicly available versions of `The Artificer#8166` (Discord ID: `789045930011656223`) (herein referred to as _The Bot_ or _Bot_) do not track or collect user information via Discord.

Upon inviting _The Bot_ to a user's guild, _The Bot_ sends the guild name, Discord Guild ID, and current count of guild members to Burn_E99 (herein referred to as _The Developer_) via a private Discord Guild.  The guild name, Discord Guild ID, and current count of guild members are only used to roughly gage how popular _The Bot_ is and to determine if _The Bot_'s hosting solution needs to be improved.  These pieces of information will never be sold or shared with anyone.

Like all Discord bots, _The Bot_ reads every message that it is allowed to, meaning if _The Bot_ is allowed to see a channel in a guild, it reads every new message sent in said channel.  This is due to the way the Discord API itself is designed.  _The Bot_ does not read any messages sent in the past.
* Messages sent in a Guild with the Inline Roll System disabled and do not begin with _The Bot_'s command prefix are not scanned for commands.  Data regarding these messages are not saved or stored anywhere.
* Messages sent in a Guild with the Inline Roll System enabled and do not begin with _The Bot_'s command prefix are only scanned for Inline Roll commands.  If an Inline Roll command is found, it is sent through the Roll command handler.  If an Inline Roll command is not found, the message is ignored and not scanned for other inline commands.  Data regarding these messages are not saved or stored anywhere.
* Messages that do begin with _The Bot_'s command prefix are scanned for commands that _The Bot_ supports.  Any commands that store any amount or kind of data are listed below.  If the command or system is not listed, then it does not log or store any data.
  * The report command (in Discord, this command is known as `/report`, `[[report`, or `[[r`):
    * This command is entirely optional, meaning users never need to run this command under normal usage of _The Bot_.  This command is only intended to be used to report roll commands that did not output what was expected.
    * The report command only stores the text placed within the message that is directly after the command (herein referred to as _The Report Text_).  This command will accept any value for _The Report Text_, thus it is up to the user to remove any sensitive information before sending the command.
    * _The Report Text_ is solely used to improve _The Bot_, either by providing a feature suggestions or alerting _The Developer_ to bugs that need patched.
    * _The Report Text_ is stored in a private Discord Guild in a channel that only _The Developer_ can see.
  * The API Control System (in Discord, these commands are known as `[[api enable`, `[[api allow`, `[[api disable`, and `[[api block`):
    * These commands are entirely optional, meaning users never need to run this command under normal usage of _The Bot_.  These commands only need to be used when the user desires to utilize the optional API.
    * The API enable/disable commands only stores the Discord Guild ID and Discord Channel ID upon usage.  Discord Guild IDs and Channel IDs are internal IDs generated and provided by Discord.
    * _The Bot_ only uses the stored Discord Guild IDs to ensure that API users cannot interact with Guilds that do not allow it or to check if an API user is a member of said Guild.
    * The Discord Guild IDs and Discord Channel IDs are only visible to _The Developer_ thru direct database administration.  This direct database administration is only used when there are issues with _The Bot_'s database.
  * The Opt Out System (in Discord, this command is known as `[[opt-out` or `[[ignore-me`):
    * This command is optional, meaning users normally do not need to run this command under normal usage of _The Bot_.  This command is intended for privacy, allowing a user to block _The Bot_ from reading their messages.
    * The Opt Out command only stores the Discord User ID of the user who ran the command.  Discord User IDs are internal IDs generated and provided by Discord.
    * _The Bot_ only uses the stored Discord User IDs to filter what messages it will scan for commands.  If a Discord User ID is in the Opt Out list, messages from this user will be immediately ignored.
    * The Discord User IDs are only visible to _The Developer_ thru direct database administration.  This direct database administration is only used when there are issues with _The Bot_'s database.
  * The Inline Roll System (in Discord, these commands are known as `/toggle-inline-rolls enable`, `[[inline enable`, `[[inline allow`, `/toggle-inline-rolls disable`, `[[inline block`, `[[inline disable`, and `[[inline delete`):
    * This system is entirely optional, meaning users never need to run these commands under normal usage of _The Bot_.  This system is only intended to be used when a user wants to utilize Inline Rolls in their Guild.
    * The Inline Roll System only stores the Discord Guild ID upon usage.  Discord Guild IDs are internal IDs generated and provided by Discord.
    * _The Bot_ only uses the stored Discord Guild IDs to determine which Guilds it should do a preliminary scan for Inline Rolls for all messages sent.
    * The Discord Guild IDs are only visible to _The Developer_ thru direct database administration.  This direct database administration is only used when there are issues with _The Bot_'s database.
  * The Roll Alias System (in Discord, this system contains all commands starting with `/alias`, `[[rollalias`, `[[ralias`, `[[alias`, `[[rolla`, and `[[ra`, and the subcommands that _The Bot_ will store data from are `add`, `create`, `set`, `update`, `replace`, `copy`, `clone`, and `rename`):
    * This system is entirely optional, meaning users never need to run these commands under normal usage of _The Bot_.  This system is only intended to be used when a user wants to save roll commands for later reuse.
    * The Roll Alias System stores the user provided Alias Name, the user provided Roll String, and in Guild mode, the Discord Guild ID of the Guild the command was run in; and in personal mode, the Discord User ID of the user who ran the command.  The Alias Name is string of up to 200 characters that the user provided to save the Roll String under.  The Roll String is a string of up to 4,000 characters containing roll commands and formatting text the user provided.  Discord Guild IDs and Discord User IDs are internal IDs generated and provided by Discord.
    * _The Bot_ uses the Discord Guild IDs and Discord User IDs to determine who and where an alias can be used.  The Alias Names are used to look up the requested Roll String.  The Roll Strings are used to execute the requested alias.
    * The Alias Names and Roll Strings may be shown in Discord by using the following subcommands: `list`, `list-all`, `preview`, and `view`.  In Guild mode, these subcommands will only show the Alias Names and Roll Strings created in the Guild the command was run in.  In Personal mode, these subcommands will only show the Alias Names and Roll Strings the user created.  The Alias Names, Roll Strings, Discord Guild IDs and Discord User IDs are visible to _The Developer_ thru direct database administration.  This direct database administration is only used when there are issues with _The Bot_'s database.

All commands contribute to a global counter to track the number of times a command is used.  These counters do not keep track of where commands were run, only counting the number of times the command has been called.  These counters have no way of being tracked back to the individual commands run by the users.

If the Discord interaction is not explicitly mentioned above, it does not collect any information at all.

### Private Bot Information
Privately hosted versions of The Artificer (in other words, bots running The Artificer's source code, but not running under the publicly available _Bot_, `The Artificer#8166` (Discord ID: `789045930011656223`)) (herein referred to as _Rehosts_ or _Rehost_) may contain modifications that can log data not mentioned in this document.

Due to the nature of open source code, _Rehosts_ may not use the same codebase that is available in this repository.  _The Developer_ does not moderate what other developers do to this codebase.  This means that if you are not using the publicly available _Bot_ and instead using a _Rehost_, this _Rehost_ could collect any information it desires.

All policies described in **Public Bot Information** apply to _Rehosts_ running the official codebase.  If the _Rehost_ has additional modifications, the developer(s) behind it should list any new instances data storage/logging.

# Direct Database Administration
_The Developer_ will only use direct database administration when there are issues with _The Bot_'s database.  These issues are include, but are not limited to, the following: data corruption, data recovery, data migration, manual data deletion, database schema updates.  While handling these issues, _The Developer_ will only view the required tables, and will not exfiltrate any data unless required by the issue (such as by data recovery).  Any data retrieved from the database during an aforementioned issue will be stored securely.

# Information relating to the Optional API Interactions
_The Bot_'s API (herein referred to as _The API_) does not automatically collect any information.  Users utilizing _The API_ are required to provide a small amount of information before using _The API_.

When generating and API Key, the user must submit two pieces of information to be stored in _The Bot_'s database: their Discord User ID and an email address.
* The Discord User ID is only used to link a single API Key to a single Discord user and to authenticate the user when using _The API_.  The stored User IDs are only visible to _The Developer_ thru direct database administration.  This direct database administration is only used when there are issues with _The Bot_'s database.
* The user's email address is only used to send the user their generated API Key and to act as method of contact if an issue with their API Key arises.  The stored email addresses will only be used for reasons relating to _The API_.  The stored email addresses will never be sold or shared with anyone.  The stored email addresses are only visible to _The Developer_ thru direct database administration.  This direct database administration is only used when there are issues with _The Bot_'s database.

In order to use _The API_, the user must provide _The Bot_ with Discord Channel IDs.  These Channel IDs are stored and used to restrict _The API_'s usage to desired Discord Channels.  These Channel IDs can be viewed by the user that submitted them via _The API_.  The user cannot view Channel IDs that they did not submit and link to their API Key.  The stored Channel IDs are also visible to _The Developer_ thru direct database administration.  This direct database administration is only used when there are issues with _The Bot_'s database.

When using _The API_'s roll endpoint (herein referred to as _The Roll Endpoint_), users acknowledge that every roll they request will be logged.  _The Roll Endpoint_ specifically logs the input string (provided by the user), the result string (generated by _The Bot_ using the input string and sent to Discord in the requested channel), the creation timestamp, and the Discord Message ID of the result message sent by _The Bot_.  This information stored is used only to identify and prevent API abuse.  This information is only visible to _The Developer_ thru direct database administration.  This direct database administration is only used when there are issues with _The Bot_'s database.  This information will only be reviewed when _The Developer_ is notified of possible API abuse.

# Deleting Your Data
## API Data Deletion
If you would like to remove all of your submitted data, this can easily be done using the Delete API Key option on _The Bot_'s [API Tools](https://artificer.eanm.dev/).  This will delete all Discord Channel ID/Discord User ID combos that you have submitted.  This will also delete your API key entry, completely removing your email address and Discord User ID from _The Bot_'s database.

If you have been banned from using _The API_, your API Key, and registration information (Discord User ID, and Email Address) will not be deleted as this data is considered necessary.

If you would like your Discord Guild ID to be removed from _The Bot_'s database, a Guild Owner or Administrator needs to run `[[api delete`.  This will remove your Discord Guild's ID from _The Bot_'s database, reverting it back to the default setting of blocking _The API_.  Additionally, _The Bot_ will automatically remove any data related to your Discord Guild when _The Bot_ is removed from your guild.

If your guild has been banned from using _The API_, the Discord Guild ID will not be deleted as this data is considered necessary.

The data described above is considered necessary to prevent users from abusing the API and ban evading by deleting and recreating their account.

## Report Command Data Deletion
If you would like to ensure that all of your submitted reports are removed from _The Bot_'s private development server, please contact _The Developer_ via Discord (by sending a direct message to @burn_e99) or via email (<ean@milligan.dev>) with a message along the lines of `"Please remove all of my submitted reports from your development server."`.  Submitted reports are deleted from the server as they are processed, which happens roughly once a week, but this can be accelerated if requested.

## Opt Out System Data Deletion
If you would like to remove your Discord User ID from _The Bot_'s database, simply send `[[opt-in` as a Direct Message to _The Bot_.  Please note the bot will no longer be ignoring your messages, and it will resume scanning our messages for commands.

## Inline Roll System Data Deletion
If you would like to remove your Discord Guild ID from _The Bot_'s database, simply send one of the following commands in the Guild: `/toggle-inline-rolls disable`, `[[inline disable`, `[[inline block`, or `[[inline delete`.  All variants of this delete the Discord Guild ID from _The Bot_'s database.

Additionally, _The Bot_ will automatically delete the Discord Guild ID from _The Bot_'s database when _The Bot_ is removed from your guild.

## Alias System Data Deletion
### Personal Mode
If you would like to remove all your Personal aliases from _The Bot_'s database, simply send one of the following commands in any channel you share with _The Bot_: `/alias personal delete-all`, `[[alias delete-all`, or `[[alias remove-all`.  As deletion is irreversible, _The Bot_ requires a verification code to execute the deletion.  _The Bot_ will create a verification code for you when you first send the command.

If you only need to delete one alias, the `delete-one` subcommand is available.

### Guild Mode
If you would like to remove all Guild aliases from _The Bot_'s database, simply send one of the following commands in the Guild: `/alias guild delete-all`, `[[alias guild delete-all`, or `[[alias guild remove-all`.  As deletion is irreversible, _The Bot_ requires a verification code to execute the deletion.  _The Bot_ will create a verification code for you when you first send the command.

If you only need to delete one alias, the `delete-one` subcommand is available.

Additionally, _The Bot_ will automatically delete all Guild aliases when _The Bot_ is removed from your guild.
