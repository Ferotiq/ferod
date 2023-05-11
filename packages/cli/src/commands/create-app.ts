import { exec } from "child_process";
import fse from "fs-extra";
import inquirer from "inquirer";
import { resolve } from "path";
import { databases, packageManagers } from "../constants.js";
import type {
	CreateAppAnswers,
	CreateAppOptions,
	PackageManager,
	ScaffoldOptions,
} from "../types.js";
import { getTemplatesDirectory } from "../utils/file.js";

const templatesDirectory = getTemplatesDirectory(import.meta.url);

/**
 * Create a new Ferod app.
 */
export async function createFerodApp(options: CreateAppOptions): Promise<void> {
	const answers = await getAnswers(options);

	if (answers.name === "") {
		console.log("Name field is required.");

		return;
	}

	const packageManager = getUserPackageManager();

	const name = answers.name ?? options.name;

	const projectDirectory = resolve(process.cwd(), name);

	await scaffoldProject({
		...answers,
		packageManager,
		projectDirectory,
	});
}

/**
 * Get the answers to the questions
 * @param options The options passed to the command
 * @returns The answers to the questions
 */
async function getAnswers(
	options: CreateAppOptions
): Promise<CreateAppAnswers> {
	if (options.flags.yes) {
		return {
			name: options.name ?? "my-app",
			gitRepo: options.flags.noGit === undefined,
			install: options.flags.noInstall === undefined,
			features: [
				"typescript",
				"prisma",
				"helpCommand",
				// "dashboard",
				"eslint",
				"prettier",
			],
			databaseType: "MongoDB",
		};
	}

	return await inquirer.prompt([
		{
			name: "name",
			type: "input",
			message: "What is the name of your app?",
			default: "my-app",
			when: () => options.name === undefined,
		},
		{
			name: "gitRepo",
			type: "confirm",
			message: "Initialize a git repository?",
			default: true,
			when: () => !options.flags.yes && options.flags.noGit === undefined,
		},
		{
			name: "install",
			type: "confirm",
			message: "Install dependencies?",
			default: true,
			when: () => !options.flags.yes && options.flags.noInstall === undefined,
		},
		{
			name: "features",
			type: "checkbox",
			message: "What features do you want to use?",
			choices: [
				{
					name: "TypeScript",
					value: "typescript",
					checked: true,
				},
				{
					name: "Prisma",
					value: "prisma",
					checked: true,
				},
				{
					name: "Help command",
					value: "helpCommand",
					checked: true,
				},
				// {
				// 	name: "Dashboard",
				// 	value: "dashboard",
				// 	checked: true
				// },
				{
					name: "ESLint",
					value: "eslint",
					checked: true,
				},
				{
					name: "Prettier",
					value: "prettier",
					checked: true,
				},
			],
			when: () => !options.flags.yes,
		},
		{
			name: "databaseType",
			type: "list",
			message: "What database do you want to use?",
			choices: databases,
			default: "MongoDB",
			when: (answers: CreateAppAnswers) =>
				!options.flags.yes && answers.features.includes("prisma"),
		},
	]);
}

/**
 * Gets the user's package manager
 */
function getUserPackageManager(): PackageManager {
	// This environment variable is set by npm and yarn but pnpm seems less consistent
	const userAgent = process.env.npm_config_user_agent ?? "npm";
	return (
		packageManagers.find((manager) => userAgent.includes(manager)) ?? "npm"
	);
}

/**
 * Scaffold a new Ferod app
 */
async function scaffoldProject(options: ScaffoldOptions): Promise<void> {
	// make project directory
	fse.ensureDirSync(options.projectDirectory);
	if (fse.readdirSync(options.projectDirectory).length > 0) {
		console.log(
			`The directory ${options.projectDirectory} is not empty. Please try again.`
		);

		return;
	}

	const typescript = options.features.includes("typescript");
	const prisma = options.features.includes("prisma");
	const helpCommand = options.features.includes("helpCommand");
	// const dashboard = options.features.includes("dashboard");
	const eslint = options.features.includes("eslint");
	const prettier = options.features.includes("prettier");

	const basePath = typescript ? "base-ts" : "base-js";
	const templates = new Set(["base", basePath]);

	// copy base files
	fse.copySync(resolve(templatesDirectory, "base"), options.projectDirectory);
	fse.copySync(resolve(templatesDirectory, basePath), options.projectDirectory);

	// copy prisma files
	if (prisma) {
		templates.add("prisma");

		const databaseType = options.databaseType?.toLowerCase() ?? "mongodb";

		fse.copySync(
			resolve(templatesDirectory, "prisma"),
			options.projectDirectory
		);

		const schema = fse
			.readFileSync(
				resolve(options.projectDirectory, "prisma/schema.prisma"),
				"utf-8"
			)
			.replace("mongodb", databaseType);

		fse.writeFileSync(
			resolve(options.projectDirectory, "prisma/schema.prisma"),
			schema
		);
	}

	// copy prettier files
	if (prettier) {
		templates.add("prettier");

		fse.copySync(
			resolve(templatesDirectory, "prettier"),
			options.projectDirectory
		);
	}

	// copy eslint files
	if (eslint) {
		const templatePart = prettier ? "eslint-prettier" : "eslint";
		const template = typescript ? `${templatePart}-ts` : `${templatePart}-js`;
		templates.add(template);

		fse.copySync(
			resolve(templatesDirectory, template),
			options.projectDirectory
		);
	}

	// // copy dashboard files
	// if (dashboard) {
	// 	fse.copySync(
	// 		resolve(templatesDirectory, "dashboard"),
	// 		options.projectDirectory
	// 	);
	// }

	// copy help command files
	if (helpCommand) {
		const path = `src/commands/help.${typescript ? "ts" : "js"}`;
		fse.copyFileSync(
			resolve(templatesDirectory, `help/${path}`),
			resolve(options.projectDirectory, path)
		);
	}

	// copy example.env to .env
	fse.copyFileSync(
		resolve(options.projectDirectory, "example.env"),
		resolve(options.projectDirectory, ".env")
	);

	// copy config-example.json to config.json
	fse.copyFileSync(
		resolve(options.projectDirectory, "src/config/config-example.json"),
		resolve(options.projectDirectory, "src/config/config.json")
	);

	// initialize git repository
	if (options.gitRepo) {
		exec(`cd "${options.projectDirectory}" && git init`, (_, stdout) =>
			console.log(stdout)
		);
		fse.copyFileSync(
			resolve(templatesDirectory, "git/gitignore.example"),
			resolve(options.projectDirectory, ".gitignore")
		);
	} else {
		fse.removeSync(resolve(options.projectDirectory, "example.env"));
		fse.removeSync(
			resolve(options.projectDirectory, "src/config/config-example.json")
		);
	}

	// merge package.json files
	const packageJson = createPackageJson(options.name, ...templates);
	fse.writeJSONSync(
		resolve(options.projectDirectory, "package.json"),
		packageJson,
		{
			spaces: "\t",
		}
	);

	// install dependencies
	if (options.install) {
		console.log(`Using ${options.packageManager} to install dependencies...`);

		exec(
			`cd "${options.projectDirectory}" && ${options.packageManager} install --ignore-workspace`,
			(_, stdout) => console.log(stdout)
		);

		// if (options.dashboard) {
		// 	exec(
		// 		`cd ${options.projectDirectory}/dashboard && ${options.packageManager} install --ignore-workspace`,
		// 		(_, stdout) => console.log(stdout)
		// 	);
		// }
	}
}

/**
 * Merge the dependencies and devDependencies of all package.json template files
 * @param projectName The name of the project
 * @param paths The paths to the package.json files
 */
function createPackageJson(
	projectName: string,
	...templates: string[]
): Record<string, unknown> {
	type PackageJsonFieldEntries = [string, string][];

	const directories = templates.map((template) =>
		resolve(templatesDirectory, template)
	);

	const dependencies = new Map<string, string>();
	const devDependencies = new Map<string, string>();
	const scripts = new Map<string, string>();

	for (const directory of directories) {
		const packageJson = fse.readJSONSync(resolve(directory, "package.json"));

		const dependenciesEntries = Object.entries(
			packageJson.dependencies ?? {}
		) as PackageJsonFieldEntries;
		const devDependenciesEntries = Object.entries(
			packageJson.devDependencies ?? {}
		) as PackageJsonFieldEntries;
		const scriptsEntries = Object.entries(
			packageJson.scripts ?? {}
		) as PackageJsonFieldEntries;

		for (const [name, version] of dependenciesEntries) {
			dependencies.set(name, version);
		}

		for (const [name, version] of devDependenciesEntries) {
			devDependencies.set(name, version);
		}

		for (const [name, line] of scriptsEntries) {
			scripts.set(name, line);
		}
	}

	const basePackageJson = fse.readJSONSync(
		resolve(directories[0], "package.json")
	);

	return {
		...basePackageJson,
		name: projectName,
		scripts: Object.fromEntries(scripts),
		dependencies: Object.fromEntries(dependencies),
		devDependencies: Object.fromEntries(devDependencies),
	};
}
