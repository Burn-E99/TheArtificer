export const config = {
	'name': 'The Artificer', // Name of the bot
	'version': '2.0.2', // Version of the bot
	'token': 'the_bot_token', // Discord API Token for this bot
	'localtoken': 'local_testing_token', // Discord API Token for a secondary OPTIONAL testing bot, THIS MUST BE DIFFERENT FROM "token"
	'prefix': '[[', // Prefix for all commands
	'postfix': ']]', // Postfix for rolling command
	'limits': { // Limits for the bot functions
		'maxLoops': 5000000, // Determines how long the bot will attempt a roll, number of loops before it kills a roll.  Increase this at your own risk, originally was set to 5 Million before rollWorkers were added, increased to 10 Million since multiple rolls can be handled concurrently
		'maxWorkers': 16, // Maximum number of worker threads to spawn at once (Set this to less than the number of threads your CPU has, Artificer will eat it all if too many rolls happen at once)
		'workerTimeout': 300000, // Maximum time before the bot kills a worker thread in ms
	},
	'api': { // Setting for the built-in API
		'enable': false, // Leave this off if you have no intention of using this/supporting it
		'publicDomain': 'http://example.com/', // Public domain that the API is behind, should end with a /
		'port': 8080, // Port for the API to listen on
		'supportURL': 'your_support_url_for_api_abuse', // Fill this in with the way you wish to be contacted when somebody needs to report API key abuse
		'rateLimitTime': 10000, // Time range for how often the API rate limits will be lifted (time in ms)
		'rateLimitCnt': 10, // Amount of requests that can be made (successful or not) during above time range before getting rate limited
		'admin': 0n, // Discord user ID of the bot admin, this user will be the user that can ban/unban user/channel combos and API keys
		'adminKey': 'your_25char_api_token', // API Key generated by nanoid that is 25 char long, this gets pre-populated into all_keys
		'email': 0n, // Temporary set up for email, this will be adjusted to an actual email using deno-smtp in the future.
	},
	'db': { // Settings for the MySQL database, this is required for use with the API, if you do not want to set this up, you will need to rip all code relating to the DB out of the bot
		'host': '', // IP address for the db, usually localhost
		'localhost': '', // IP address for a secondary OPTIONAL local testing DB, usually also is localhost, but depends on your dev environment
		'port': 3306, // Port for the db
		'username': '', // Username for the account that will access your DB, this account will need "DB Manager" admin rights and "REFERENCES" Global Privalages
		'password': '', // Password for the account, user account may need to be authenticated with the "Standard" Authentication Type if this does not work out of the box
		'name': '', // Name of the database Schema to use for the bot
	},
	'logRolls': false, // Enables logging of roll commands, this should be left disabled for privacy, but exists to allow verification of rolls before deployment, all API rolls will always be logged no matter what this is set to
	'logChannel': 0n, // Discord channel ID where the bot should put startup messages and other error messages needed
	'reportChannel': 0n, // Discord channel ID where reports will be sent when using the built-in report command
	'devServer': 0n, // Discord guild ID where testing of indev features/commands will be handled, used in conjuction with the DEVMODE bool in mod.ts
	'emojis': [ // Array of objects containing all emojis that the bot can send on your behalf, empty this array if you don't want any of them
		{ // Emoji object, duplicate for each emoji
			'name': 'emoji_name', // Name of emoji in discord
			'aliases': ['alias_1', 'alias_2', 'alias_n'], // Commands that will activate this emoji
			'id': 'the_emoji_id', // Discord emoji ID for this emoji
			'animated': false, // Tells the bot this emoji is animated so it sends correctly
			'deleteSender': false, // Tells the bot to attempt to delete the sender's message after sending the emoji
		},
	],
	'botLists': [ // Array of objects containing all bot lists that stats should be posted to
		{ // Bot List object, duplicate for each bot list
			'name': 'Bot List Name', // Name of bot list, not used
			'enabled': true, // Should statistics be posted to this list?
			'apiUrl': 'https://example.com/api/bots/?{bot_id}/stats', // API URL, use ?{bot_id} in place of the bot id so that it can be dynamically replaced
			'headers': [ // Array of headers that need to be added to the request
				{ // Header Object, duplicate for every header needed
					'header': 'header_name', // Name of header needed, usually Authorization is needed
					'value': 'header_value', // Value for the header
				},
			],
			'body': { // Data payload to send to the bot list, will be turned into a string and any ?{} will be replaced with the required value, currently only has ?{server_count}
				'param_name': '?{param_value}', // Add more params as needed
			},
		},
	],
};

export default config;
