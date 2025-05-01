// This file will create all tables for the artificer schema
// DATA WILL BE LOST IF DB ALREADY EXISTS, RUN AT OWN RISK

import config from '/config.ts';
import dbClient from 'db/client.ts';

console.log('Attempting to create DB');
await dbClient.execute(`CREATE SCHEMA IF NOT EXISTS ${config.db.name};`);
console.log('test');
await dbClient.execute(`USE ${config.db.name}`);
console.log('DB created');

console.log('Attempt to drop all tables');
await dbClient.execute(`DROP VIEW IF EXISTS db_size;`);
await dbClient.execute(`DROP TABLE IF EXISTS allowed_channels;`);
await dbClient.execute(`DROP TABLE IF EXISTS all_keys;`);
await dbClient.execute(`DROP TABLE IF EXISTS allowed_guilds;`);
await dbClient.execute(`DROP TABLE IF EXISTS roll_log;`);
await dbClient.execute(`DROP PROCEDURE IF EXISTS INC_HEATMAP;`);
await dbClient.execute(`DROP TABLE IF EXISTS roll_time_heatmap;`);
await dbClient.execute(`DROP PROCEDURE IF EXISTS INC_CNT;`);
await dbClient.execute(`DROP TABLE IF EXISTS command_cnt;`);
await dbClient.execute(`DROP TABLE IF EXISTS ignore_list;`);
console.log('Tables dropped');

// Table to hold list of users who want to be ignored by the bot
console.log('Attempting to create table ignore_list');
await dbClient.execute(`
	CREATE TABLE ignore_list (
		userid bigint unsigned NOT NULL,
		PRIMARY KEY (userid),
		UNIQUE KEY ignore_list_userid_UNIQUE (userid)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);
console.log('Table created');

// Light telemetry on how many commands have been run
console.log('Attempting to create table command_cnt');
await dbClient.execute(`
	CREATE TABLE command_cnt (
		command char(20) NOT NULL,
		count bigint unsigned NOT NULL DEFAULT 0,
		hourlyRate float unsigned NOT NULL DEFAULT 0,
		PRIMARY KEY (command),
		UNIQUE KEY command_cnt_command_UNIQUE (command)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);
console.log('Table created');

console.log('Attempt creating increment count Stored Procedure');
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
console.log('Stored Procedure created');

// Holds daily average of commands
console.log('Attempting to create table roll_time_heatmap');
await dbClient.execute(`
	CREATE TABLE roll_time_heatmap (
		hour tinyint(1) unsigned NOT NULL,
		sunday bigint unsigned NOT NULL DEFAULT 0,
		monday bigint unsigned NOT NULL DEFAULT 0,
		tuesday bigint unsigned NOT NULL DEFAULT 0,
		wednesday bigint unsigned NOT NULL DEFAULT 0,
		thursday bigint unsigned NOT NULL DEFAULT 0,
		friday bigint unsigned NOT NULL DEFAULT 0,
		saturday bigint unsigned NOT NULL DEFAULT 0,
		PRIMARY KEY (hour),
		UNIQUE KEY roll_time_heatmap_hour_UNIQUE (hour)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);
console.log('Table created');

console.log('Attempt creating increment heatmap Stored Procedure');
await dbClient.execute(`
	CREATE PROCEDURE INC_HEATMAP(
		IN dy varchar(10),
		IN hr tinyint(1)
	)
	BEGIN
		SET @s1=CONCAT('SELECT ',dy,' FROM roll_time_heatmap WHERE hour = ',hr,' INTO @oldcnt');
		PREPARE stmt1 FROM @s1;
		EXECUTE stmt1;
		DEALLOCATE PREPARE stmt1;

		SET @s2=CONCAT('UPDATE roll_time_heatmap SET ',dy,' = @oldcnt + 1 WHERE hour = ',hr);
		PREPARE stmt2 FROM @s2;
		EXECUTE stmt2;
		DEALLOCATE PREPARE stmt2;
	END
`);
console.log('Stored Procedure created');

// Roll log, holds rolls when requests
console.log('Attempting to create table roll_log');
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
console.log('Table created');

// Api guild settings
console.log('Attempting to create table allowed_guilds');
await dbClient.execute(`
	CREATE TABLE allowed_guilds (
		guildid bigint unsigned NOT NULL,
		channelid bigint unsigned NOT NULL,
		createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
		active tinyint(1) NOT NULL DEFAULT 0,
		banned tinyint(1) NOT NULL DEFAULT 0,
		hidewarn tinyint(1) NOT NULL DEFAULT 0,
		PRIMARY KEY (guildid, channelid)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);
console.log('Table created');

// Api keys
console.log('Attempting to create table all_keys');
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
console.log('Table created');

// Api user settings
console.log('Attempting to create table allowed_channels');
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
console.log('Table created');

// Database sizes view
console.log('Attempting to create view db_size');
await dbClient.execute(`
	CREATE VIEW db_size AS
		SELECT
			table_name AS "table",
			ROUND(((data_length + index_length) / 1024 / 1024), 3) AS "size",
			table_rows AS "rows"
		FROM information_schema.TABLES
		WHERE
			table_schema = "${config.db.name}"
			AND table_name <> "db_size";
`);
console.log('View Created');

await dbClient.close();
console.log('Done!');
