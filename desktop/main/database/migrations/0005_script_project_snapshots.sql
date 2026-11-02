CREATE TABLE `script_project_snapshots` (
	`project_id` text PRIMARY KEY NOT NULL,
	`state_json` text,
	`script_versions_json` text,
	`plan_details_json` text,
	`cut_json` text,
	`preview_url` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `script_project_media` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`source_url` text NOT NULL,
	`relative_path` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `script_project_media_project_id_idx` ON `script_project_media` (`project_id`);--> statement-breakpoint
CREATE INDEX `script_project_media_source_url_idx` ON `script_project_media` (`source_url`);
