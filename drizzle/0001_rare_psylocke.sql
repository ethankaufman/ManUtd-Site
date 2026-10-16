CREATE TABLE `competition` (
	`season` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`has_table` integer DEFAULT false NOT NULL,
	`sort_order` integer NOT NULL,
	PRIMARY KEY(`season`, `slug`)
);
--> statement-breakpoint
CREATE TABLE `match` (
	`id` text PRIMARY KEY NOT NULL,
	`season` text NOT NULL,
	`competition` text NOT NULL,
	`round` text DEFAULT '' NOT NULL,
	`kickoff` text NOT NULL,
	`state` text NOT NULL,
	`home` text NOT NULL,
	`away` text NOT NULL,
	`home_goals` integer,
	`away_goals` integer,
	`pen_home` integer,
	`pen_away` integer,
	`venue` text,
	`city` text,
	`attendance` integer,
	`neutral` integer DEFAULT false NOT NULL,
	`note` text,
	`detail` text
);
--> statement-breakpoint
CREATE TABLE `standing` (
	`season` text NOT NULL,
	`competition` text NOT NULL,
	`rank` integer NOT NULL,
	`team` text NOT NULL,
	`played` integer NOT NULL,
	`won` integer NOT NULL,
	`drawn` integer NOT NULL,
	`lost` integer NOT NULL,
	`goals_for` integer NOT NULL,
	`goals_against` integer NOT NULL,
	`points` integer NOT NULL,
	`zone` text,
	PRIMARY KEY(`season`, `competition`, `team`)
);
