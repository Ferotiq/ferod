import type {
	ApplicationCommandType,
	Events,
	PermissionFlagsBits
} from "discord.js";

export type PackageManager = "npm" | "yarn" | "pnpm";

export interface CLIFlags {
	noGit?: boolean;
	noInstall?: boolean;
	yes?: boolean;
}

export interface CreateAppOptions {
	name?: string;
	flags: CLIFlags;
}

export const databases = [
	"MySQL",
	"MongoDB",
	"SQLite",
	"PostgreSQL",
	"SQLServer",
	"CockroachDB"
] as const;

export type DatabaseType = (typeof databases)[number];

export interface CreateAppAnswers {
	name: string;
	gitRepo: boolean;
	install: boolean;
	prisma: boolean;
	databaseType?: DatabaseType;
	databaseUri?: string;
	typescript: boolean;
	helpCommand: boolean;
	dashboard: boolean;
	eslintAndPrettier: boolean;
}

export interface ScaffoldOptions extends CreateAppAnswers {
	packageManager: PackageManager;
	projectDirectory: string;
}

export interface CreateCommandOptions {
	name?: string;
}

export interface CreateCommandAnswers {
	name: string;
	description: string;
	category: string;
	defaultPermissions: (keyof typeof PermissionFlagsBits)[];
	type: keyof typeof ApplicationCommandType;
}

export interface CreateEventListenerOptions {
	name?: string;
}

export interface CreateEventListenerAnswers {
	name: string;
	event: keyof typeof Events;
}
