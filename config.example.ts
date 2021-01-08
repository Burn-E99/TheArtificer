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
		"* x            [OPT] - number of dice to roll, if omitted, 1 is used",
		"* dy           [REQ] - size of dice to roll, d20 = 20 sided die",
		"* dz || dlz    [OPT] - drops the lowest z dice, cannot be used with kz",
		"* kz || khz    [OPT] - keeps the highest z dice, cannot be used with dz",
		"* dhz          [OPT] - drops the highest z dice, cannot be used with kz",
		"* klz          [OPT] - keeps the lowest z dice, cannot be used with dz",
		"* ra           [OPT] - rerolls any rolls that match a, r3 will reroll any dice that land on 3, throwing out old rolls",
		"* csq || cs=q  [OPT] - changes crit score to q",
		"* cs<q         [OPT] - changes crit score to be less than or equal to q",
		"* cs>q         [OPT] - changes crit score to be greater than or equal to q	 ",
		"* cfq || cs=q  [OPT] - changes crit fail to q",
		"* cf<q         [OPT] - changes crit fail to be less than or equal to q",
		"* cf>q         [OPT] - changes crit fail to be greater than or equal to q",
		"* !            [OPT] - exploding, rolls another dy for every crit roll",
		"```"
	],
	"emojis": {
		"popcat": {
			"name": "popcat",
			"id": "796340018377523221",
			"animated": true
		}
	}
};

export default config;
