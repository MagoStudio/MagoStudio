CREATE TABLE `cloud_render_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`cloud_asset_id` text,
	`cloud_clip_id` text,
	`model` text NOT NULL,
	`project_id` text NOT NULL,
	`shot_id` text NOT NULL,
	`track_id` text NOT NULL,
	`clip_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`request_json` text NOT NULL,
	`error` text,
	`interacted` integer DEFAULT false NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shot_id`) REFERENCES `shots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`clip_id`) REFERENCES `clips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cloud_render_jobs_status_idx` ON `cloud_render_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `cloud_render_jobs_project_id_idx` ON `cloud_render_jobs` (`project_id`);
