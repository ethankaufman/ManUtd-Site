CREATE TABLE `squad_member` (
	`season` text NOT NULL,
	`id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`shirt_number` text,
	`position` text,
	`age` integer,
	`date_of_birth` text,
	`nationality` text,
	`height_cm` integer,
	PRIMARY KEY(`season`, `id`)
);
