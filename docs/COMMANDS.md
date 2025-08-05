## Available Commands
The Artificer comes with a few supplemental commands to the main rolling command.

This document uses the default prefix (`[[`) on all commands listed.  If a command starts with `/` (such as `/help`), this means the command is available as a Discord Slash Command.

* `/help` or `[[help` or `[[h` or `[[?`
  * Provides a message similar to this available commands block.
* `[[rollhelp` or `[[??` or `[[rh` or `[[hr`
  * Opens the new help library.
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
* `/info` or `[[info` or `[[i`
  * Outputs some information and links relating to the bot.
* `/privacy` or `[[privacy` or `[[tos`
  * Prints some information about the Privacy Policy, found in `PRIVACY.md`.
* `/version` or `[[version` or `[[v`
  * Prints out the current version of the bot.
* `[[popcat` or `[[pop` or `[[p`
  * Sends the animated popcat emote for those who do not have Discord Nitro.
  * If bot is given the permission `Manage Messages`, the bot will remove the message requesting the emote.
* `/stats` or `[[stats` or `[[s`
  * Prints out how many users, channels, and servers the bot is currently serving.
* `/heatmap` or `[[heatmap` or `[[hm`
  * Heatmap of when the roll command is run the most.
* `/report report-text:[issue-or-feature]` or `[[report [issue-or-feature]`
  * People aren't perfect, but this bot is trying to be.
  * If you encounter a command that errors out or returns something unexpected, please use this command to alert the developers of the problem.
  * Example:
    * `[[report [[2+2]] returned 5 when I expected it to return 4` will send the entire message after `[[report` to the devs via Discord.
* `[[opt-out` or `[[ignore-me`
  * Adds you to an ignore list so the bot will never respond to you
* `[[opt-in` **Available via DM ONLY**
  * Removes you from the ignore list
* `/toggle-inline-rolls [subcommand]` or `[[inline [subcommand]`
  * Controls whether or not inline rolls can be done in a guild, defaults off.  These commands may only be used by the Owner or Admins of your guild.
  * An inline roll is a roll that does not immediately start with `[[`, such as `test [[d20]]`.
  * Available subcommands:
    * `/toggle-inline-rolls help`
    * `[[inline help`
      * Provides a message similar to this subcommand description.
    * `/toggle-inline-rolls status`
    * `[[inline status`
      * Shows the current status of inline rolls for this guild.
    * `/toggle-inline-rolls enable`
    * `[[inline allow` or `[[inline enable`
      * Allows inline rolls in the guild.
    * `/toggle-inline-rolls disable`
    * `[[inline block` or `[[inline disable` or `[[inline delete`
      * Blocks inline rolls in the guild.
* `/toggle-unrestricted-repeat [subcommand]` or `[[repeat [subcommand]`
  * Controls whether or not unrestricted repeat rolls can be done in a guild, defaults off.  Unrestricted Repeat Rolls are whether or not anyone in a guild can use the `Repeat Roll` button on anyone's roll or only the original roller can use them.  These commands may only be used by the Owner or Admins of your guild.
  * An inline roll is a roll that does not immediately start with `[[`, such as `test [[d20]]`.
  * Available subcommands:
    * `/toggle-unrestricted-repeat help`
    * `[[repeat help`
      * Provides a message similar to this subcommand description.
    * `/toggle-unrestricted-repeat status`
    * `[[repeat status`
      * Shows the current status of unrestricted repeat rolls for this guild.
    * `/toggle-unrestricted-repeat enable`
    * `[[repeat allow` or `[[repeat enable`
      * Allows unrestricted repeat rolls in the guild.
    * `/toggle-unrestricted-repeat disable`
    * `[[repeat block` or `[[repeat disable` or `[[repeat delete`
      * Blocks unrestricted repeat rolls in the guild.
* `/alias [subcommand]` or `[[rollalias [subcommand]` or `[[ralias [subcommand]` or `[[alias [subcommand]` or `[[rolla [subcommand]` or `[[ra [subcommand]`
  * Custom Roll Alias System
  * Allows anyone to store a roll string as a shortcut/alias for later use/reuse.
  * Supports full roll syntax, plus y variables that are set every time the alias is called.
  * Every command has a matching "Guild Mode" command that modifies aliases linked to a guild instead of linked to a user account.
  * Available subcommands:
    * `/alias personal help`
    * `/alias guild help`
    * `[[ra help`
    * `[[ra guild help`
      * Provides a message similar to this subcommand description.
    * `/alias personal list-all`
    * `/alias guild list-all`
    * `[[ra list`
    * `[[ra guild list`
      * Lists all aliases currently set for your account or the guild you are in.
    * `/alias personal create alias-name:[aliasName] roll-string:[rollString...]`
    * `/alias guild create alias-name:[aliasName] roll-string:[rollString...]`
    * `[[ra add [aliasName] [rollString...]`
    * `[[ra guild add [aliasName] [rollString...]`
      * Creates the desired alias, saving the roll string to your account or the guild you are in.
    * `/alias personal replace alias-name:[aliasName] roll-string:[rollString...]`
    * `/alias guild replace alias-name:[aliasName] roll-string:[rollString...]`
    * `[[ra update [aliasName] [rollString...]`
    * `[[ra guild update [aliasName] [rollString...]`
      * Updates the desired alias, replacing the old roll string in your account or the guild you are in with the newly provided roll string.
    * `/alias personal view alias-name:[aliasName]`
    * `/alias guild view alias-name:[aliasName]`
    * `[[ra view [aliasName]`
    * `[[ra guild view [aliasName]`
      * View the saved roll string and how many yVars are needed for it.
    * `/alias personal delete-one alias-name:[aliasName] [verification-code:[verificationCode]?]`
    * `/alias guild delete-one alias-name:[aliasName] [verification-code:[verificationCode]?]`
    * `[[ra delete [aliasName] [verificationCode?]`
    * `[[ra guild delete [aliasName] [verificationCode?]`
      * Deletes the desired alias from your account or the guild you are in.  Can be run without a verification code to get the needed code for deletion.
    * `/alias personal delete-all alias-name:[aliasName] [verification-code:[verificationCode]?]`
    * `/alias guild delete-all alias-name:[aliasName] [verification-code:[verificationCode]?]`
    * `[[ra delete-all [aliasName] [verificationCode?]`
    * `[[ra guild delete-all [aliasName] [verificationCode?]`
      * Deletes all aliases from your account or the guild you are in.  Can be run without a verification code to get the needed code for deletion.
    * `/alias personal copy alias-name:[aliasName]`
    * `[[ra clone [aliasName]`
      * Copies the specified alias from your account to the guild you are in.
    * `/alias guild copy alias-name:[aliasName]`
    * `[[ra guild clone [aliasName]`
      * Copies the specified alias from the guild you are in to your account.
    * `/alias personal rename alias-name:[oldAliasName] alias-name-new:[newAliasName]`
    * `/alias guild rename alias-name:[oldAliasName] alias-name-new:[newAliasName]`
    * `[[ra rename [oldAliasName] [newAliasName]`
    * `[[ra guild rename [oldAliasName] [newAliasName]`
      * Renames the specified alias for your account or the guild you are in.
    * `/alias personal run alias-name:[aliasName] [y-variables:[yVars...]?]`
    * `[[ra [aliasName] [yVars?...]`
    * `[[ra run [aliasName] [yVars?...]`
      * Runs the desired personal alias with the specified yVars (if any are needed).  If the alias is not found on your account, it will check the guild aliases and use a match from there if one exists.
    * `/alias guild run alias-name:[aliasName] [y-variables:[yVars...]?]`
    * `[[ra guild [aliasName] [yVars?...]`
    * `[[ra guild run [aliasName] [yVars?...]`
      * Runs the desired guild alias with the specified yVars (if any are needed).
* `/roll roll-string:[rollString...]` or `[[xdydzracsq!]]` AKA Roll Command
  * This is the command the bot was built specifically for.
  * It looks a little complicated at first, but if you are familiar with the [Roll20 formatting](https://artificer.eanm.dev/roll20), this will be no different.
  * Any math (limited to exponential, multiplication, division, modulus, addition, and subtraction) will be correctly handled in PEMDAS order, so use parenthesis as needed.
  * PI and e are available for use.
  * Parameters for rolling:

  |  Parameter    |  Required?  |  Repeatable?  |  Description                                                                                                                                                                             |
  |---------------|-------------|---------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
  |  x            |  Optional   |      No       |  number of dice to roll, if omitted, 1 is used                                                                                                                                           |
  |  dy           |  Required   |      No       |  size of dice to roll, d20 = 20 sided die, replace y with `F` to roll the dice as Fate dice                                                                                              |
  |  dz or dlz    |  Optional   |      No       |  drops the lowest z dice, cannot be used with any other drop or keep options                                                                                                             |
  |  kz or khz    |  Optional   |      No       |  keeps the highest z dice, cannot be used with any other drop or keep options                                                                                                            |
  |  dhz          |  Optional   |      No       |  drops the highest z dice, cannot be used with any other drop or keep options                                                                                                            |
  |  klz          |  Optional   |      No       |  keeps the lowest z dice, cannot be used with any other drop or keep options                                                                                                             |
  |  ra or r=a    |  Optional   |      Yes      |  rerolls any rolls that match a, r3 will reroll every die that land on 3, throwing out old rolls, cannot be used with ro                                                                 |
  |  r<a          |  Optional   |      Yes      |  rerolls any rolls that are less than or equal to a, r3 will reroll every die that land on 3, 2, or 1, throwing out old rolls, cannot be used with ro                                    |
  |  r>a          |  Optional   |      Yes      |  rerolls any rolls that are greater than or equal to a, r3 will reroll every die that land on 3 or greater, throwing out old rolls, cannot be used with ro                               |
  |  roa or ro=a  |  Optional   |      Yes      |  rerolls any rolls that match a, r3 will reroll each die that lands on 3 ONLY ONE TIME, throwing out old rolls, cannot be used with r                                                    |
  |  ro<a         |  Optional   |      Yes      |  rerolls any rolls that are less than or equal to a, r3 will reroll each die that lands on 3, 2, or 1 ONLY ONE TIME, throwing out old rolls, cannot be used with r                       |
  |  ro>a         |  Optional   |      Yes      |  rerolls any rolls that are greater than or equal to a, r3 will reroll each die that lands on 3 or greater ONLY ONE TIME, throwing out old rolls, cannot be used with r                  |
  |  csq or cs=q  |  Optional   |      Yes      |  changes crit score to q                                                                                                                                                                 |
  |  cs<q         |  Optional   |      Yes      |  changes crit score to be less than or equal to q                                                                                                                                        |
  |  cs>q         |  Optional   |      Yes      |  changes crit score to be greater than or equal to q                                                                                                                                     |
  |  cfq or cf=q  |  Optional   |      Yes      |  changes crit fail to q                                                                                                                                                                  |
  |  cf<q         |  Optional   |      Yes      |  changes crit fail to be less than or equal to q                                                                                                                                         |
  |  cf>q         |  Optional   |      Yes      |  changes crit fail to be greater than or equal to q                                                                                                                                      |
  |  !            |  Optional   |      No       |  exploding, rolls another dy for every crit success                                                                                                                                      |
  |  !o           |  Optional   |      No       |  exploding once, rolls another dy for each original crit success                                                                                                                         |
  |  !p           |  Optional   |      No       |  penetrating explosion, rolls one dy for each crit success, but subtracts one from each resulting explosion                                                                              |
  |  !!           |  Optional   |      No       |  compounding explosion, rolls one dy for each crit success, but adds the resulting explosion to the die that caused this explosion                                                       |
  |  !=u          |  Optional   |      Yes      |  exploding, rolls another dy for every die that lands on u                                                                                                                               |
  |  !>u          |  Optional   |      Yes      |  exploding, rolls another dy for every die that lands on u or greater                                                                                                                    |
  |  !<u>         |  Optional   |      Yes      |  exploding, rolls another dy for every die that lands on u or less                                                                                                                       |
  |  !o=u         |  Optional   |      Yes      |  exploding once, rolls another dy for each original die that landed on u                                                                                                                 |
  |  !o>u         |  Optional   |      Yes      |  exploding once, rolls another dy for each original die that landed on u or greater                                                                                                      |
  |  !o<u         |  Optional   |      Yes      |  exploding once, rolls another dy for each original die that landed on u or less                                                                                                         |
  |  !p=u         |  Optional   |      Yes      |  penetrating explosion, rolls one dy for each die that lands on u, but subtracts one from each resulting explosion                                                                       |
  |  !p>u         |  Optional   |      Yes      |  penetrating explosion, rolls one dy for each die that lands on u or greater, but subtracts one from each resulting explosion                                                            |
  |  !p<u         |  Optional   |      Yes      |  penetrating explosion, rolls one dy for each die that lands on u or under, but subtracts one from each resulting explosion                                                              |
  |  !!=u         |  Optional   |      Yes      |  compounding explosion, rolls one dy for each die that lands on u, but adds the resulting explosion to the die that caused this explosion                                                |
  |  !!>u         |  Optional   |      Yes      |  compounding explosion, rolls one dy for each die that lands on u or greater, but adds the resulting explosion to the die that caused this explosion                                     |
  |  !!<u         |  Optional   |      Yes      |  compounding explosion, rolls one dy for each die that lands on u or under, but adds the resulting explosion to the die that caused this explosion                                       |
  |  m            |  Optional   |      No       |  matching dice, adds labels to any dice that match, cannot be combined with Target Number/Successes or Target Failures                                                                   |
  |  mz           |  Optional   |      No       |  matching dice, adds labels to any dice that have z or more matches, cannot be combined with Target Number/Successes or Target Failures                                                  |
  |  mt           |  Optional   |      No       |  matching dice, adds labels to any dice that match, changes result to be the count of labels added, cannot be combined with Target Number/Successes or Target Failures                   |
  |  mtz          |  Optional   |      No       |  matching dice, adds labels to any dice that have z or more matches, changes result to be the count of labels added, cannot be combined with Target Number/Successes or Target Failures  |
  |  s or sa      |  Optional   |      No       |  sort dice, sorts the list of dice for a roll in ascending order                                                                                                                         |
  |  sd           |  Optional   |      No       |  sort dice, sorts the list of dice for a roll in descending order                                                                                                                        |
  |  =z           |  Optional   |      Yes      |  target number/success, counts and marks dice as successful when they land on z, cannot be combined with the Dice Matching option                                                        |
  |  <z           |  Optional   |      Yes      |  target number/success, counts and marks dice as successful when they land on z or less, cannot be combined with the Dice Matching option                                                |
  |  >z           |  Optional   |      Yes      |  target number/success, counts and marks dice as successful when they land on z or greater, cannot be combined with the Dice Matching option                                             |
  |  fz or f=z    |  Optional   |      Yes      |  target failures, counts and marks dice as failed when they land on z, cannot be combined with the Dice Matching option                                                                  |
  |  f<z          |  Optional   |      Yes      |  target failures, counts and marks dice as failed when they land on z or less, cannot be combined with the Dice Matching option                                                          |
  |  f>z          |  Optional   |      Yes      |  target failures, counts and marks dice as failed when they land on z or greater, cannot be combined with the Dice Matching option                                                       |

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
    * `-m` or `-max` - Maximize Roll - Rolls the theoretical maximum roll, cannot be used with `-n`, `-min`, or `-sn`
    * `-min` - Minimize Roll - Rolls the theoretical minimum roll, cannot be used with `-m`, `-max`, `-n`, or `-sn`
    * `-n` - Nominal Roll - Rolls the theoretical nominal roll, cannot be used with `-m`, `-max`, `-min`, or `-sn`
    * `-sn` or `-sn [number]` - Simulated Nominal - Rolls the requests roll many times to approximately simulate the nominal of complex rolls, can specify the amount or accept default amount by not specify the amount, cannot be used with `-m`, `-max`, `-min`, `-n`, or `-cc`
    * `-gm @user1 @user2 ... @userN` - GM Roll - Rolls the requested roll in GM mode, suppressing all publicly shown results and details and sending the results directly to the specified GMs
    * `-o a` or `-o d` - Order Roll - Rolls the requested roll and orders the results in the requested direction
    * `-ct` - Comma Totals - Adds commas to totals for readability
    * `-cc` - Confirm Critical Hits - Automatically rerolls whenever a crit hits, cannot be used with `-sn`
    * `-rd` - Roll Distribution - Shows a raw roll distribution of all dice in roll
    * `-hr` - Hide Raw - Hide the raw input, showing only the results/details of the roll
    * `-nv` or `-vn` - Number Variables - Adds `xN` before each roll command in the details section for debug reasons
    * `-cd` - Custom Dice shapes - Allows a list of `name:[side1,side2,...,sideN]` separated by `;` to be passed to create special shaped dice
    * `-ns` - No Spaces - Removes the default padding added space between rolls (`[[d4]][[d4]]` will output `22` instead of `2 2`)
    * `-yvariables y0,y1,...,yN` - Y Variables - Intended for internal use only, but is mentioned here since it is available externally.  Takes a comma separated list of numbers.  Unlike other decorators, this one will not be shown in the raw output.
  * The results have some formatting applied on them to provide details on what happened during this roll.
    * Critical successes will be **bolded**
    * Critical fails will be <ins>underlined</ins>
    * Rolls that were dropped or rerolled ~~crossed out~~
    * Rolls that exploded have an `!` added after them
