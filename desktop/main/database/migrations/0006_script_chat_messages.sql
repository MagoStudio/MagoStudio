CREATE TABLE `script_chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`content` text,
	`data_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `script_chat_messages_project_created_idx` ON `script_chat_messages` (`project_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `script_chat_messages_pending_per_project` ON `script_chat_messages` (`project_id`) WHERE "script_chat_messages"."status" = 'PENDING';
