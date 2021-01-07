export const config = {
	"name": "The Artificer",
	"version": "1.0.0",
	"token": "the_bot_token",
	"prefix": "[[",
	"postfix": "]]",
	"logChannel": "the_log_channel",
	"reportChannel": "the_report_channel",
	"devServer": "the_dev_server",
	"help": [
		"```fix",
		"The Artificer Help",
		"```",
		"__**Commands:**__",
		"```",
		"[[?                 - This Command",
		"[[ping              - Pings the bot to check connectivity",
		"[[version           - Prints the bots version",
		"[[popcat            - Popcat",
		"[[report [text]     - Report a command that failed to run",
		"[[stats             - Statistics on the bot",
		"[[xdydzracsq!]] ... - Rolls all configs requested, you may repeat the command multiple times in the same message (just ensure you close each roll with ]])",
		" * x    [OPT] - number of dice to roll, if omitted, 1 is used",
		" * dy   [REQ] - size of dice to roll, d20 = 20 sided die",
		" * dz   [OPT] - drops the lowest z dice, cannot be used with kz",
		" * kz   [OPT] - keeps the highest z dice, cannot be used with dz",
		" * ra   [OPT] - rerolls any rolls that match a, r3 will reroll any dice that land on 3, throwing out old rolls",
		" * csq  [OPT] - changes crit score to q, where q can be a single number or a range formatted as q-u",
		" * !    [OPT] - exploding, rolls another dy for every crit roll",
		"```"
	],
	"emojis": {
		"popcat": {
			"name": "popcat",
			"id": "796340018377523221",
			animated: true
		}
	}
};

export default config;
