# The Artificer - A Dice Rolling Discord Bot
Version 1.3.1 - 2020/01/18

The Artificer is a Discord bot that specializes in rolling dice.  The bot utilizes the compact [Roll20 formatting](https://roll20.zendesk.com/hc/en-us/articles/360037773133-Dice-Reference) for ease of use and will correctly perform any needed math on the roll (limited to basic algebra).

This bot was developed to replace the Sidekick discord bot after it went offline many times for extended periods.  This was also developed to fix some annoyances that were found with Sidekick, specifically its vague error messages (such as `"Tarantallegra!"`, what is that supposed to mean) and its inability to handle implicit multiplication (such as `4(12 + 20)`).

## Using The Artificer
I am hosting this bot for public use and you may find its invite link below.  If you would like to host this bot yourself, details of how to do so are found at the end of this README, but I do not recommend this unless you are experienced with running Discord bots.

After inviting the bot, if you would like it to remove the message requesting the popcat emoji, you will need to give the `The Artificer` role the `Manage Messages` permission.  All other permissions needed are handled by the invite link.

[Bot Invite Link](https://discord.com/api/oauth2/authorize?client_id=789045930011656223&permissions=2048&scope=bot)

---

## Available Commands
The Artificer comes with a few supplemental commands to the main rolling command.

* `[[help or [[h or [[?`
  * Provides a message similar to this available commands block.
* `[[ping`
  * Tests the latency between you, Discord, and the bot.
* `[[version or [[v`
  * Prints out the current version of the bot.
* `[[popcat or [[pop or [[p`
  * Sends the animated popcat emote for those who do not have Discord Nitro.
  * If bot is given the permission `Manage Messages`, the bot will remove the message requesting the emote.
* `[[stats or [[s`
  * Prints out how many users, channels, and servers the bot is currently serving.
* `[[report or [[r [command that failed]`
  * People aren't perfect, but this bot is trying to be.
  * If you encounter a command that errors out or returns something unexpected, please use this command to alert the developers of the problem.
  * Example:
    * `[[report [[2+2]] returned 5 when I expected it to return 4` will send the entire message after `[[report` to the devs via Discord.
* `[[xdydzracsq!]]`
  * This is the command the bot was built specifically for.
  * It looks a little complicated at first, but if you are familiar with the [Roll20 formatting](https://roll20.zendesk.com/hc/en-us/articles/360037773133-Dice-Reference), this will no different.
  * Any math (limited to exponentials, multiplication, division, modulus, addition, and subtraction) will be correctly handled in PEMDAS order, so use parenthesis as needed.
  * PI and e are available for use.
  * Parameters for rolling:

	|  Paramater    |  Required?  |  Repeatable?  | Description                                                                                      |
	|---------------|-------------|---------------|--------------------------------------------------------------------------------------------------|
	|  x            |  Optional   |      No       |  number of dice to roll, if omitted, 1 is used                                                   |
	|  dy           |  Required   |      No       |  size of dice to roll, d20 = 20 sided die                                                        |
	|  dz or dlz    |  Optional   |      No       |  drops the lowest z dice, cannot be used any other drop or keep options                          |
	|  kz or khz    |  Optional   |      No       |  keeps the highest z dice, cannot be used any other drop or keep options                         |
	|  dhz          |  Optional   |      No       |  drops the highest z dice, cannot be used any other drop or keep options                         |
	|  klz          |  Optional   |      No       |  keeps the lowest z dice, cannot be used any other drop or keep options                          |
	|  ra           |  Optional   |      Yes      |  rerolls any rolls that match a, r3 will reroll any dice that land on 3, throwing out old rolls  |
	|  csq or cs=q  |  Optional   |      Yes      |  changes crit score to q                                                                         |
	|  cs<q         |  Optional   |      Yes      |  changes crit score to be less than or equal to q                                                |
	|  cs>q         |  Optional   |      Yes      |  changes crit score to be greater than or equal to q                                             |
	|  cfq or cs=q  |  Optional   |      Yes      |  changes crit fail to q                                                                          |
	|  cf<q         |  Optional   |      Yes      |  changes crit fail to be less than or equal to q                                                 |
	|  cf>q         |  Optional   |      Yes      |  changes crit fail to be greater than or equal to q                                              |
	|  !            |  Optional   |      No       |  exploding, rolls another dy for every crit roll                                                 |

  * If the parameter is Required, it must be provided at all times.
  * If the parameter is Repeatable, it may occur multiple times in the roll configuration.
  * Examples:
    * `[[4d20]]` will roll 4 d20 dice and add them together.
    * `[[4d20r1!]]` will roll 4 d20 dice, rerolling any dice that land on 1, and repeatedly rolling a new d20 for any critical success rolled.
    * `[[d20/40]]` will roll a d20 die and divide it by 40.
    * `[[((d20+20) - 10) / 5]]` will roll a d20, add 20 to that roll, subtract off 10, and finally divide by 5.
  * This command also has some useful flags that can used.  These flags simply need to be placed after all rolls in the message:
    * `-nd` - No Details - Suppresses all details of the requested roll
    * `-s` - Spoiler - Spoilers all details of the requested roll
    * `-m` - Maximize Roll - Rolls the theoretical maximum roll, cannot be used with -n
    * `-n` - Nominal Roll - Rolls the theoretical nominal roll, cannot be used with -m
    * `-gm @user1 @user2 ... @usern` - GM Roll - Rolls the requested roll in GM mode, suppressing all publicly shown results and details and sending the results directly to the specified GMs
    * `-o a` or `-o d` - Order Roll - Rolls the requested roll and orders the results in the requested direction

## The Artificer API
The Artificer features an API that allows authenticated users to roll dice into Discord from third party applications (such as Excel macros).  The API has a couple endpoints exposed to all authenticated users allowing management of channels that your API key can send rolls to.  APIs requiring administrative access are not listed below.

Every API request **requires** the header `X-Api-Key` with the value set to the API key granted to you.

* If an API fails, these are the possible responses:
  * `400` - Bad Request - Query parameters missing or malformed.
  * `403` - Forbidden - API Key is not authenticated or user does not match the owner of the API Key.
  * `404` - Not Found - Requested endpoint does not exist.
  * `429` - Too Many Requests - API rate limit exceeded, please slow down.
  * `500` - Internal Server Error - Something broke, if this continues to happen, please submit a GitHub issue.

Available Endpoints:

* `/api/roll`
  * Required query parameters:
    * `rollstr` - A roll string formatted identically to the roll command detailed in the "Available Commands" section.
    * `channel` - The Discord Channel ID that the bot is to send the results into.
    * `user` - Your Discord User ID.
  * Optional query parameters (these parameters do not require values unless specified):
    * `nd` - No Details - Suppresses all details of the requested roll.
    * `s` - Spoiler - Spoilers all details of the requested roll.
    * `m` - Maximize Roll - Rolls the theoretical maximum roll, cannot be used with Nominal roll.
    * `n` - Nominal Roll - Rolls the theoretical nominal roll, cannot be used with Maximise roll.
    * `gm` - GM Roll - Rolls the requested roll in GM mode, suppressing all publicly shown results and details and sending the results directly to the specified GMs.  Takes a comma separated list of Discord User IDs.
    * `o` - Order Roll - Rolls the requested roll and orders the results in the requested direction.  Takes a single character: `a` or `d`.
  * Returns:
    * `200` - OK - Results of the roll should be found in Discord, but also are returned as a string via the API.
* `/api/channel`
  * Required query parameters:
    * `user` - Your Discord ID.
  * Returns:
    * `200` - OK - JSON Array as a string containing allowed channels with their active and banned statuses.
* `/api/channel/add`
  * Required query parameters:
    * `channel` - The Discord Channel ID you wish to whitelist for your user ID/API Key combo.
    * `user` - Your Discord ID.
  * Returns:
    * `200` - OK - Nothing to be returned.
* `/api/channel/activate`
  * Required query parameters:
    * `channel` - The Discord Channel ID you wish to reactivate.
    * `user` - Your Discord ID.
  * Returns:
    * `200` - OK - Nothing to be returned.
* `/api/channel/deactivate`
  * Required query parameters:
    * `channel` - The Discord Channel ID you wish to deactivate.
    * `user` - Your Discord ID.
  * Returns:
    * `200` - OK - Nothing to be returned.

## Problems?  Feature requests?
If you run into any errors or problems with the bot, or think you have a good idea to add to the bot, please submit a new GitHub issue detailing it.  If you don't have a GitHub account, a report command (detailed above) is provided for use in Discord.

---

## Self Hosting The Artificer
The Artificer was built on Deno `v1.6.3` using Discodeno `v10.0.0`.  If you choose to run this yourself, you will need to rename `config.example.ts` to `config.ts` and edit some values.  You will need to create a new [Discord Application](https://discord.com/developers/applications) and copy the newly generated token into the `"token"` key.  If you want to utilize some of the bots dev features, you will need to fill in the keys `"logChannel"` and `"reportChannel"` with text channel IDs and `"devServer"` with a guild ID.

You will also need to install and setup a MySQL database with a user for the bot to use to add/modify the database.  This user must have the "DB Manager" admin rights and "REFERENCES" Global Privileges.  Once the DB is installed and a user is setup, run the provided `initDB.ts` to create the schema and tables.

Once everything is set up, starting the bot can simply be done with `deno run --allow-net .\mod.ts`.

If you choose to run version `1.1.0` or newer, ensure you disable the API in `config.ts` or verify you have properly secured your instance of The Artificer.  If you enable the API, you will need to manually add an entry into the `all_keys`.  This entry's `userid` will need to match the `api.admin` in `config.ts` and the `apiKey` will need to be a 25 character `nanoid`.

---

### Built in memory of my Grandmother, Babka
With much love, Ean

December 21, 2020
