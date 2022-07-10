# The Artificer - A Dice Rolling Discord Bot | V2.1.0 - 2022/07/10
[![SonarCloud](https://sonarcloud.io/images/project_badges/sonarcloud-orange.svg)](https://sonarcloud.io/summary/new_code?id=TheArtificer)  
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=TheArtificer&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=TheArtificer) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=TheArtificer&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=TheArtificer) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=TheArtificer&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=TheArtificer) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=TheArtificer&metric=bugs)](https://sonarcloud.io/summary/new_code?id=TheArtificer) [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=TheArtificer&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=TheArtificer) [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=TheArtificer&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=TheArtificer)  

The Artificer is a Discord bot that specializes in rolling dice.  The bot utilizes the compact [Roll20 formatting](https://artificer.eanm.dev/roll20) for ease of use and will correctly perform any needed math on the roll (limited to basic algebra).

This bot was developed to replace the Sidekick discord bot after it went offline many times for extended periods, and is now dead according to their GitHub.  This was also developed to fix some annoyances that were found with Sidekick, specifically its vague error messages (such as `"Tarantallegra!"`, what is that supposed to mean) and its inability to handle implicit multiplication (such as `4(12 + 20)`).

## Using The Artificer
I am hosting this bot for public use and you may find its invite link below.  If you would like to host this bot yourself, details of how to do so are found at the end of this README, but I do not recommend this unless you are experienced with running Discord bots.

After inviting the bot, if you would like it to remove the message requesting the popcat emoji, you will need to give the `The Artificer` role the `Manage Messages` permission.  All other permissions needed are handled by the invite link.

[Bot Invite Link](https://discord.com/api/oauth2/authorize?client_id=789045930011656223&permissions=2048&scope=bot)

[Support Server Invite Link](https://discord.gg/peHASXMZYv)

---

## Available Commands
The Artificer comes with a few supplemental commands to the main rolling command.

* `[[help` or `[[h` or `[[?`
  * Provides a message similar to this available commands block.
* `[[rollhelp` or `[[??` or `[[rh` or `[[hr`
  * Details on how to use the roll command, listed as `[[xdy...]]` below.
* `[[rolldecorators` or `[[???` or `[[rd` or `[[dr`
  * Details on how to use decorators on the roll command.
* `[[api [subcommand]`
  * Administrative tools for the bots's API.  These commands may only be used by the Owner or Admins of your guild.
  * Available Subcommands:
    * `[[api help`
      * Provides a message similar to this subcommand description.
    * `[[api status`
      * Shows the current status of the API for this guild.
    * `[[api allow` or `[[api enable`
      * Allows API Rolls to be sent to this guild.
    * `[[api block` or `[[api disable`
      * Blocks API Rolls from being sent to this guild.
    * `[[api delete`
      * Deletes this guild from The Artificer's database.
* `[[ping`
  * Tests the latency between you, Discord, and the bot.
* `[[info` or `[[i`
  * Outputs some information and links relating to the bot.
* `[[privacy`
  * Prints some information about the Privacy Policy, found in `PRIVACY.md`.
* `[[version` or `[[v`
  * Prints out the current version of the bot.
* `[[popcat` or `[[pop` or `[[p`
  * Sends the animated popcat emote for those who do not have Discord Nitro.
  * If bot is given the permission `Manage Messages`, the bot will remove the message requesting the emote.
* `[[stats` or `[[s`
  * Prints out how many users, channels, and servers the bot is currently serving.
* `[[heatmap` or `[[hm`
  * Heatmap of when the roll command is run the most.
* `[[report` or `[[r [command that failed]`
  * People aren't perfect, but this bot is trying to be.
  * If you encounter a command that errors out or returns something unexpected, please use this command to alert the developers of the problem.
  * Example:
    * `[[report [[2+2]] returned 5 when I expected it to return 4` will send the entire message after `[[report` to the devs via Discord.
* `[[opt-out` or `[[ignore-me`
  * Adds you to an ignore list so the bot will never respond to you
* `[[opt-in`
  * Removes you from the ignore list
* `[[xdydzracsq!]]`
  * This is the command the bot was built specifically for.
  * It looks a little complicated at first, but if you are familiar with the [Roll20 formatting](https://artificer.eanm.dev/roll20), this will no different.
  * Any math (limited to exponentials, multiplication, division, modulus, addition, and subtraction) will be correctly handled in PEMDAS order, so use parenthesis as needed.
  * PI and e are available for use.
  * Parameters for rolling:

  |  Paramater    |  Required?  |  Repeatable?  |  Description                                                                                                                                                             |
  |---------------|-------------|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
  |  x            |  Optional   |      No       |  number of dice to roll, if omitted, 1 is used, additionally, replace x with `F` to roll the dice as Fate dice                                                           |
  |  dy           |  Required   |      No       |  size of dice to roll, d20 = 20 sided die                                                                                                                                |
  |  dz or dlz    |  Optional   |      No       |  drops the lowest z dice, cannot be used with any other drop or keep options                                                                                             |
  |  kz or khz    |  Optional   |      No       |  keeps the highest z dice, cannot be used with any other drop or keep options                                                                                            |
  |  dhz          |  Optional   |      No       |  drops the highest z dice, cannot be used with any other drop or keep options                                                                                            |
  |  klz          |  Optional   |      No       |  keeps the lowest z dice, cannot be used with any other drop or keep options                                                                                             |
  |  ra or r=a    |  Optional   |      Yes      |  rerolls any rolls that match a, r3 will reroll every die that land on 3, throwing out old rolls, cannot be used with ro                                                 |
  |  r<a          |  Optional   |      Yes      |  rerolls any rolls that are less than or equal to a, r3 will reroll every die that land on 3, 2, or 1, throwing out old rolls, cannot be used with ro                    |
  |  r>a          |  Optional   |      Yes      |  rerolls any rolls that are greater than or equal to a, r3 will reroll every die that land on 3 or greater, throwing out old rolls, cannot be used with ro               |
  |  roa or ro=a  |  Optional   |      Yes      |  rerolls any rolls that match a, r3 will reroll each die that lands on 3 ONLY ONE TIME, throwing out old rolls, cannot be used with r                                    |
  |  ro<a         |  Optional   |      Yes      |  rerolls any rolls that are less than or equal to a, r3 will reroll each die that lands on 3, 2, or 1 ONLY ONE TIME, throwing out old rolls, cannot be used with r       |
  |  ro>a         |  Optional   |      Yes      |  rerolls any rolls that are greater than or equal to a, r3 will reroll each die that lands on 3 or greater ONLY ONE TIME, throwing out old rolls, cannot be used with r  |
  |  csq or cs=q  |  Optional   |      Yes      |  changes crit score to q                                                                                                                                                 |
  |  cs<q         |  Optional   |      Yes      |  changes crit score to be less than or equal to q                                                                                                                        |
  |  cs>q         |  Optional   |      Yes      |  changes crit score to be greater than or equal to q                                                                                                                     |
  |  cfq or cf=q  |  Optional   |      Yes      |  changes crit fail to q                                                                                                                                                  |
  |  cf<q         |  Optional   |      Yes      |  changes crit fail to be less than or equal to q                                                                                                                         |
  |  cf>q         |  Optional   |      Yes      |  changes crit fail to be greater than or equal to q                                                                                                                      |
  |  !            |  Optional   |      No       |  exploding, rolls another dy for every crit success                                                                                                                      |
  |  !o           |  Optional   |      No       |  exploding once, rolls another dy for each original crit success                                                                                                         |
  |  !p           |  Optional   |      No       |  penetrating explosion, rolls one dy for each crit success, but subtracts one from each resulting explosion                                                              |
  |  !!           |  Optional   |      No       |  compounding explosion, rolls one dy for each crit success, but adds the resulting explosion to the die that caused this explosion                                       |
  |  !=u          |  Optional   |      Yes      |  exploding, rolls another dy for every die that lands on u                                                                                                               |
  |  !>u          |  Optional   |      Yes      |  exploding, rolls another dy for every die that lands on u or greater                                                                                                    |
  |  !<u>         |  Optional   |      Yes      |  exploding, rolls another dy for every die that lands on u or less                                                                                                       |
  |  !o=u         |  Optional   |      Yes      |  exploding once, rolls another dy for each original die that landed on u                                                                                                 |
  |  !o>u         |  Optional   |      Yes      |  exploding once, rolls another dy for each original die that landed on u or greater                                                                                      |
  |  !o<u         |  Optional   |      Yes      |  exploding once, rolls another dy for each original die that landed on u or less                                                                                         |
  |  !p=u         |  Optional   |      Yes      |  penetrating explosion, rolls one dy for each die that lands on u, but subtracts one from each resulting explosion                                                       |
  |  !p>u         |  Optional   |      Yes      |  penetrating explosion, rolls one dy for each die that lands on u or greater, but subtracts one from each resulting explosion                                            |
  |  !p<u         |  Optional   |      Yes      |  penetrating explosion, rolls one dy for each die that lands on u or under, but subtracts one from each resulting explosion                                              |
  |  !!=u         |  Optional   |      Yes      |  compounding explosion, rolls one dy for each die that lands on u, but adds the resulting explosion to the die that caused this explosion                                |
  |  !!>u         |  Optional   |      Yes      |  compounding explosion, rolls one dy for each die that lands on u or greater, but adds the resulting explosion to the die that caused this explosion                     |
  |  !!<u         |  Optional   |      Yes      |  compounding explosion, rolls one dy for each die that lands on u or under, but adds the resulting explosion to the die that caused this explosion                       |

  * If the parameter is Required, it must be provided at all times.
  * If the parameter is Repeatable, it may occur multiple times in the roll configuration.
  * Examples:
    * `[[4d20]]` will roll 4 d20 dice and add them together.
    * `[[4d20r1!]]` will roll 4 d20 dice, rerolling any dice that land on 1, and repeatedly rolling a new d20 for any critical success rolled.
    * `[[d20/40]]` will roll a d20 die and divide it by 40.
    * `[[((d20+20) - 10) / 5]]` will roll a d20, add 20 to that roll, subtract off 10, and finally divide by 5.
  * This command can also handle some custom format dice:
    * CWOD Dice - `[[xcwody]]`
      * `x` - Number of CWOD dice to roll
      * `y` - Difficulty to roll at
    * OVA Dice - `[[xovady]]`
      * `x` - Number of OVA dice to roll
      * `y` - Size of the die to roll (defaults to 6 if omitted)
  * This command also has some useful decorators that can used.  These decorators simply need to be placed after all rolls in the message:
    * `-c` - Count - Shows the Count Embed, containing the count of successful rolls, failed rolls, rerolls, drops, and explosions
    * `-nd` - No Details - Suppresses all details of the requested roll
    * `-snd` - Super No Details - Suppresses all details of the requested roll and hides no details message
    * `-s` - Spoiler - Spoilers all details of the requested roll
    * `-m` - Maximize Roll - Rolls the theoretical maximum roll, cannot be used with -n
    * `-n` - Nominal Roll - Rolls the theoretical nominal roll, cannot be used with -m
    * `-gm @user1 @user2 ... @usern` - GM Roll - Rolls the requested roll in GM mode, suppressing all publicly shown results and details and sending the results directly to the specified GMs
    * `-o a` or `-o d` - Order Roll - Rolls the requested roll and orders the results in the requested direction
  * The results have some formatting applied on them to provide details on what happened during this roll.
    * Critical successes will be **bolded**
    * Critical fails will be <ins>underlined</ins>
    * Rolls that were dropped or rerolled ~~crossed out~~

## The Artificer API
The Artificer features an API that allows authenticated users to roll dice into Discord from third party applications (such as Excel macros).  The API has a couple endpoints exposed to all authenticated users allowing management of channels that your API key can send rolls to.  APIs requiring administrative access are not listed below.

Guilds Owners or Admins must run the `[[api allow` command for any users to be able to use the `/api/roll` endpoint.

Every API request **requires** the header `X-Api-Key` with the value set to the API key granted to you.

* If an API fails, these are the possible responses:
  * `400` - Bad Request - Query parameters missing or malformed.
  * `403` - Forbidden - API Key is not authenticated or user does not match the owner of the API Key.
  * `404` - Not Found - Requested endpoint does not exist.
  * `429` - Too Many Requests - API rate limit exceeded, please slow down.
  * `500` - Internal Server Error - Something broke, if this continues to happen, please submit a GitHub issue.

API URL: `https://artificer.eanm.dev/api/`

Available Endpoints and Methods Required:

* `/api/roll` - `GET`
  * Required query parameters:
    * `user` - Your Discord User ID.
    * `channel` - The Discord Channel ID that the bot is to send the results into.
    * `rollstr` - A roll string formatted identically to the roll command detailed in the "Available Commands" section.
  * Optional query parameters (these parameters do not require values unless specified):
    * `c` - Count - Shows the Count Embed, containing the count of successful rolls, failed rolls, rerolls, drops, and explosions
    * `nd` - No Details - Suppresses all details of the requested roll.
    * `snd` - Super No Details - Suppresses all details of the requested roll and hides no details message.
    * `s` - Spoiler - Spoilers all details of the requested roll.
    * `m` - Maximize Roll - Rolls the theoretical maximum roll, cannot be used with Nominal roll.
    * `n` - Nominal Roll - Rolls the theoretical nominal roll, cannot be used with Maximise roll.
    * `gm` - GM Roll - Rolls the requested roll in GM mode, suppressing all publicly shown results and details and sending the results directly to the specified GMs.  Takes a comma separated list of Discord User IDs.
    * `o` - Order Roll - Rolls the requested roll and orders the results in the requested direction.  Takes a single character: `a` or `d`.
  * Returns:
    * `200` - OK - Results of the roll should be found in Discord, but also are returned as a string via the API.
* `/api/channel` - `GET`
  * Required query parameters:
    * `user` - Your Discord ID.
  * Returns:
    * `200` - OK - JSON Array as a string containing allowed channels with their active and banned statuses.
* `/api/channel/add` - `POST`
  * Required query parameters:
    * `user` - Your Discord ID.
    * `channel` - The Discord Channel ID you wish to whitelist for your user ID/API Key combo.
  * Returns:
    * `200` - OK - Nothing to be returned.
* `/api/channel/activate` - `PUT`
  * Required query parameters:
    * `user` - Your Discord ID.
    * `channel` - The Discord Channel ID you wish to reactivate.
  * Returns:
    * `200` - OK - Nothing to be returned.
* `/api/channel/deactivate` - `PUT`
  * Required query parameters:
    * `user` - Your Discord ID.
    * `channel` - The Discord Channel ID you wish to deactivate.
  * Returns:
    * `200` - OK - Nothing to be returned.
* `/api/key` - `GET`
  * This endpoint does not require the `X-Api-Key` header.
  * Required query parameters:
    * `user` - Your Discord ID.
    * `email` - An email address you can be reached at.  The API Key will be sent to this address.
  * Returns:
    * `200` - OK - Nothing to be returned.  API Key will be emailed to you within 24 hours.
* `/api/key/delete` - `DELETE`
  * Required query parameters:
    * `user` - Your Discord ID.
    * `email` - An email address you can be reached at.  This must match the email you registered with.  The delete code will be sent to this address.
    * `code` - Run this endpoint first without this field.  Once you recieve the email containing the delete code, run this API a second time with this field
  * Returns:
    * `424` - Failed dependancy - You will be emailed a delete code to rerun this endpoint with.
    * `200` - OK - Everything relating to your API key was successfully removed.

API Key management via a basic GUI is availble on the [API Tools](https://artificer.eanm.dev/) website.

## Problems?  Feature requests?
If you run into any errors or problems with the bot, or think you have a good idea to add to the bot, please submit a new GitHub issue detailing it.  If you don't have a GitHub account, a report command (detailed above) is provided for use in Discord.

---

## Self Hosting The Artificer
The Artificer is built on [Deno](https://deno.land/) `v1.22.0` using [Discordeno](https://discordeno.mod.land/) `v12.0.1`.  If you choose to run this yourself, you will need to rename `config.example.ts` to `config.ts` and edit some values.  You will need to create a new [Discord Application](https://discord.com/developers/applications) and copy the newly generated token into the `"token"` key.  If you want to utilize some of the bots dev features, you will need to fill in the keys `"logChannel"` and `"reportChannel"` with text channel IDs and `"devServer"` with a guild ID.

You will also need to install and setup a MySQL database with a user for the bot to use to add/modify the database.  This user must have the "DB Manager" admin rights and "REFERENCES" Global Privileges.  Once the DB is installed and a user is setup, run the provided `db\initialize.ts` to create the schema and tables.  After this, run `db\populateDefaults.ts` to insert some needed values into the tables.

Once everything is set up, starting the bot can simply be done with `deno run --allow-net .\mod.ts`.

If you choose to run version `1.1.0` or newer, ensure you disable the API in `config.ts` or verify you have properly secured your instance of The Artificer.  If you enable the API, you should manually generate a 25 char nanoid and place it in `config.api.adminKey` and copy your `userid` and place it in `config.api.admin` before running `db\populateDefaults.ts`.

---

## Privacy Policy and Terms of Service
The Artificer has a Privacy Policy and Terms of Service to detail expectations of what user data is stored and how users should use The Artificer.  The following Privacy Policy and Terms of Service only apply to the officially hosted version of The Artificer (`The Artificer#8166`, Discord ID: `789045930011656223`).

Privacy Policy TL;DR: Only report command data is stored if you do not use the API, if you use the API, submitted Discord Ids will be stored linked to your email.  For more detailed information, please check out the full [PRIVACY POLICY](https://github.com/Burn-E99/TheArtificer/blob/master/PRIVACY.md).

Terms of Service TL;DR: Don't abuse or attempt to hack/damage The Artificer or its API.  If you do, you may be banned from use.  For more detailed information, please check out the full [TERMS OF SERVICE](https://github.com/Burn-E99/TheArtificer/blob/master/TERMS.md).

---

### Built in memory of my Grandmother, Babka
With much love, Ean

December 21, 2020
