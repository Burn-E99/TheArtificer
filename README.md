# The Artificer - A Dice Rolling Discord Bot
The Artificer is a Discord bot that specializes in rolling dice.  The bot utilizes the compact [Roll20 formatting](https://roll20.zendesk.com/hc/en-us/articles/360037773133-Dice-Reference) for ease of use and will correctly perform any needed math on the roll (limited to basic algebra).

This bot was developed to replace the Sidekick discord bot after it went offline many times for extended periods.  This was also developed to fix some annoyances that were found with Sidekick, specifically its vague error messages (such as `"Tarantallegra!"`, what is that supposed to mean) and its inability to handle implicit mulitplication (such as `4(12 + 20)`).

## Using The Artificer
I am hosting this bot for public use and you may find its invite link below.  If you would like to host this bot yourself, details of how to do so are found in this repository, but I do not recommend this unless you are experienced with running Discord bots.

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
  * Paramaters for rolling:
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

  * If the paramater is Required, it must be provided at all times.
  * If the paramater is Repeatable, it may occur multiple times in the roll configuration.
  * Examples:
    * `[[4d20]]` will roll 4 d20 dice and add them together.
    * `[[4d20r1!]]` will roll 4 d20 dice, rerolling any dice that land on 1, and repeatedly rolling a new d20 for any critical success rolled.
    * `[[d20/40]]` will roll a d20 die and divide it by 40.
    * `[[((d20+20) - 10) / 5]]` will roll a d20, add 20 to that roll, subtract off 10, and finally divide by 5.

## Problems?  Feature requests?
If you run into any errors or problems with the bot, or think you have a good idea to add to the bot, please submit a new GitHub issue detailing it.  If you don't have a GitHub account, a report command (detailed above) is provided for use in Discord.

---

### Built in memory of my Grandmother, Babka
With much love, Ean

December 21, 2020
