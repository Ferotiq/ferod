import type {
	ApplicationCommandType,
	Events,
	PermissionFlagsBits,
} from "discord.js";
import type { databases, packageManagers } from "./constants.ts";

export type DatabaseType = (typeof databases)[number];
export type PackageManager = (typeof packageManagers)[number];

export interface CLIFlags {
	noGit?: boolean;
	noInstall?: boolean;
	yes?: boolean;
}

export interface CreateAppOptions {
	name?: string;
	flags: CLIFlags;
}

export type Features =
	| "prisma"
	| "typescript"
	| "helpCommand"
	// | "dashboard"
	| "eslint";

export interface CreateAppAnswers {
	name: string;
	gitRepo: boolean;
	install: boolean;
	features: Features[];
	databaseType?: DatabaseType;
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
