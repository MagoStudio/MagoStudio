ALTER TABLE `tracks` ADD `rating` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `assets` ADD `rate` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `shots` ADD `active` integer DEFAULT true NOT NULL;
