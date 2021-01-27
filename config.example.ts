export const config = {
	"name": "The Artificer", // Name of the bot
	"version": "1.3.3", // Version of the bot
	"token": "the_bot_token", // Discord API Token for this bot
	"prefix": "[[", // Prefix for all commands
	"postfix": "]]", // Postfix for rolling command
	"api": { // Setting for the built-in API
		"enable": false, // Leave this off if you have no intention of using this/supporting it
		"port": 8080, // Port for the API to listen on
		"supportURL": "your_support_url_for_api_abuse", // Fill this in with the way you wish to be contacted when somebody needs to report API key abuse
		"rateLimitTime": 10000, // Time range for how often the API rate limits will be lifted (time in ms)
		"rateLimitCnt": 10, // Amount of requests that can be made (successful or not) during above time range before getting rate limited
		"admin": 0n // Discord user ID of the bot admin, this user will be the user that can ban/unban user/channel combos and API keys
	},
	"db": { // Settings for the MySQL database, this is required for use with the API, if you do not want to set this up, you will need to rip all code relating to the DB out of the bot
		"host": "", // IP address for the db, usually localhost
		"port": 3306, // Port for the db
		"username": "", // Username for the account that will access your DB, this account will need "DB Manager" admin rights and "REFERENCES" Global Privalages
		"password": "", // Password for the account, user account may need to be authenticated with the "Standard" Authentication Type if this does not work out of the box
		"name": "" // Name of the database Schema to use for the bot
	},
	"logRolls": true, // Enables logging of roll commands, this should be left disabled for privacy, but exists to allow verification of rolls before deployment, all API rolls will always be logged no matter what this is set to
	"logChannel": "the_log_channel", // Discord channel ID where the bot should put startup messages and other error messages needed
	"reportChannel": "the_report_channel", // Discord channel ID where reports will be sent when using the built-in report command
	"devServer": "the_dev_server", // Discord guild ID where testing of indev features/commands will be handled, used in conjuction with the DEVMODE bool in mod.ts
	"help": [ // Array of strings that makes up the help command, placed here to keep source code cleaner
		"```fix",
		"The Artificer Help",
		"```",
		"__**Commands:**__",
		"```",
		"[[?                  - This Command",
		"[[rollhelp or ??     - Details on how to use the roll command, listed as [[xdy...]] below",
		"[[ping               - Pings the bot to check connectivity",
		"[[version            - Prints the bots version",
		"[[popcat             - Popcat",
		"[[report [text]      - Report a command that failed to run",
		"[[stats              - Statistics on the bot",
		"[[xdydzracsq!]] ...  - Rolls all configs requested, you may repeat the command multiple times in the same message (just ensure you close each roll with ]]), run [[?? for more details",
		"```"
	],
	"rollhelp": [ // Array of strings that makes up the rollhelp command, placed here to keep source code cleaner
		"```fix",
		"The Artificer Roll Command Details",
		"```",
		"```",
		"[[xdydzracsq!]] ... - Rolls all configs requested, you may repeat the command multiple times in the same message (just ensure you close each roll with ]])",
		"* x           [OPT] - number of dice to roll, if omitted, 1 is used",
		"* dy          [REQ] - size of dice to roll, d20 = 20 sided die",
		"* dz or dlz   [OPT] - drops the lowest z dice, cannot be used with kz",
		"* kz or khz   [OPT] - keeps the highest z dice, cannot be used with dz",
		"* dhz         [OPT] - drops the highest z dice, cannot be used with kz",
		"* klz         [OPT] - keeps the lowest z dice, cannot be used with dz",
		"* ra          [OPT] - rerolls any rolls that match a, r3 will reroll any dice that land on 3, throwing out old rolls",
		"* csq or cs=q [OPT] - changes crit score to q",
		"* cs<q        [OPT] - changes crit score to be less than or equal to q",
		"* cs>q        [OPT] - changes crit score to be greater than or equal to q	 ",
		"* cfq or cs=q [OPT] - changes crit fail to q",
		"* cf<q        [OPT] - changes crit fail to be less than or equal to q",
		"* cf>q        [OPT] - changes crit fail to be greater than or equal to q",
		"* !           [OPT] - exploding, rolls another dy for every crit roll",
		"*",
		"* This command also can fully solve math equations with parenthesis",
		"*",
		"* This command also has some useful flags that can used.  These flags simply need to be placed after all rolls in the message:",
		" * -nd  No Details    - Suppresses all details of the requested roll",
		" * -s   Spoiler       - Spoilers all details of the requested roll",
		" * -m   Maximize Roll - Rolls the theoretical maximum roll, cannot be used with -n",
		" * -n   Nominal Roll  - Rolls the theoretical nominal roll, cannot be used with -m",
		" * -gm @user1 @user2 @usern",
		"  *     GM Roll       - Rolls the requested roll in GM mode, suppressing all publicly shown results and details and sending the results directly to the specified GMs",
		" * -o a or -o d",
		"  *     Order Roll    - Rolls the requested roll and orders the results in the requested direction",
		"```"
	],
	"emojis": [ // Array of objects containing all emojis that the bot can send on your behalf, empty this array if you don't want any of them
		{ // Emoji object, duplicate for each emoji
			"name": "popcat", // Name of emoji in discord
			"aliases": ["popcat", "pop", "p"], // Commands that will activate this emoji
			"id": "796340018377523221", // Discord emoji ID for this emoji
			"animated": true, // Tells the bot this emoji is animated so it sends correctly
			"deleteSender": true // Tells the bot to attempt to delete the sender's message after sending the emoji
		}
	]
};

export default config;
