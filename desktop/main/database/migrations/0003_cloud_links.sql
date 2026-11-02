CREATE TABLE `cloud_links` (
	`kind` text NOT NULL,
	`local_id` text NOT NULL,
	`cloud_id` text NOT NULL,
	`synced_at` integer,
	`data_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`kind`, `local_id`)
);
--> statement-breakpoint
CREATE INDEX `cloud_links_cloud_id_idx` ON `cloud_links` (`kind`,`cloud_id`);
