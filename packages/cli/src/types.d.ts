export interface CLIFlags {
	noGit?: boolean;
	noInstall?: boolean;
	yes?: boolean;
}

export interface CreateAppOptions {
	name: string;
	flags: CLIFlags;
}
