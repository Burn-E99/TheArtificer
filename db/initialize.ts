// This file will create all tables for the artificer schema
// DATA WILL BE LOST IF DB ALREADY EXISTS, RUN AT OWN RISK

import config from "../config.ts";
import { dbClient } from "../src/db.ts";

console.log("Attempting to create DB");
await dbClient.execute(`CREATE SCHEMA IF NOT EXISTS ${config.db.name};`);
await dbClient.execute(`USE ${config.db.name}`);
console.log("DB created");

console.log("Attempt to drop all tables");
await dbClient.execute(`DROP TABLE IF EXISTS allowed_channels;`);
await dbClient.execute(`DROP TABLE IF EXISTS all_keys;`);
await dbClient.execute(`DROP TABLE IF EXISTS allowed_guilds;`);
await dbClient.execute(`DROP TABLE IF EXISTS roll_log;`);
await dbClient.execute(`DROP PROCEDURE IF EXISTS INC_CNT;`);
await dbClient.execute(`DROP TABLE IF EXISTS command_cnt;`);
console.log("Tables dropped");

console.log("Attempting to create table command_cnt");
await dbClient.execute(`
	CREATE TABLE command_cnt (
		command char(20) NOT NULL,
		count bigint unsigned NOT NULL DEFAULT 0,
		PRIMARY KEY (command),
		UNIQUE KEY command_cnt_command_UNIQUE (command)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);
console.log("Table created");

console.log("Attempt creating increment Stored Procedure");
await dbClient.execute(`
	CREATE PROCEDURE INC_CNT(
		IN cmd CHAR(20)
	)
	BEGIN
		declare oldcnt bigint unsigned;
		set oldcnt = (SELECT count FROM command_cnt WHERE command = cmd);
		UPDATE command_cnt SET count = oldcnt + 1 WHERE command = cmd;
	END
`);
console.log("Stored Procedure created");

console.log("Attempting to create table roll_log");
await dbClient.execute(`
	CREATE TABLE roll_log (
		id int unsigned NOT NULL AUTO_INCREMENT,
		input text NOT NULL,
		resultid bigint NULL,
		result longtext NOT NULL,
		createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
		api tinyint(1) NOT NULL,
		error tinyint(1) NOT NULL,
		PRIMARY KEY (id),
		UNIQUE KEY roll_log_id_UNIQUE (id),
		UNIQUE KEY roll_log_resultid_UNIQUE (resultid)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);
console.log("Table created");

console.log("Attempting to create table allowed_guilds");
await dbClient.execute(`
	CREATE TABLE allowed_guilds (
		guildid bigint unsigned NOT NULL,
		createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
		active tinyint(1) NOT NULL DEFAULT 0,
		banned tinyint(1) NOT NULL DEFAULT 0,
		PRIMARY KEY (guildid),
		UNIQUE KEY allowed_guilds_guildid_UNIQUE (guildid)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);
console.log("Table created");

console.log("Attempting to create table all_keys");
await dbClient.execute(`
	CREATE TABLE all_keys (
		userid bigint unsigned NOT NULL,
		apiKey char(25) NOT NULL,
		deleteCode char(10) NULL,
		email char(255) NULL,
		createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
		active tinyint(1) NOT NULL DEFAULT 1,
		banned tinyint(1) NOT NULL DEFAULT 0,
		PRIMARY KEY (userid),
		UNIQUE KEY all_keys_userid_UNIQUE (userid),
		UNIQUE KEY all_keys_apiKey_UNIQUE (apiKey),
		UNIQUE KEY all_keys_email_UNIQUE (email)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);
console.log("Table created");

console.log("Attempting to create table allowed_channels");
await dbClient.execute(`
	CREATE TABLE allowed_channels (
		userid bigint unsigned NOT NULL,
		channelid bigint unsigned NOT NULL,
		createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
		active tinyint(1) NOT NULL DEFAULT 1,
		banned tinyint(1) NOT NULL DEFAULT 0,
		PRIMARY KEY (userid, channelid),
		CONSTRAINT allowed_channels_userid_FK FOREIGN KEY (userid) REFERENCES all_keys (userid) ON DELETE RESTRICT ON UPDATE RESTRICT
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);
console.log("Table created");

await dbClient.close();
console.log("Done!");
