// This file will populate the tables with default values

import config from "../config.ts";
import { dbClient } from "../src/db.ts";

console.log("Attempting to populate DB Admin API key");
await dbClient.execute("INSERT INTO all_keys(userid,apiKey) values(?,?)", [config.api.admin, config.api.adminKey]).catch(e => {
	console.log("Failed to insert into database", e);
});
console.log("Inesrtion done");

console.log("Attempting to insert default commands into command_cnt");
const commands = ["ping", "rip", "rollhelp", "help", "info", "version", "report", "stats", "roll", "emojis", "api", "privacy"];
for (let i = 0; i < commands.length; i++) {
	await dbClient.execute("INSERT INTO command_cnt(command) values(?)", [commands[i]]).catch(e => {
		console.log(`Failed to insert into database`, e);
	});
}
console.log("Insertion done");

await dbClient.close();
console.log("Done!");
