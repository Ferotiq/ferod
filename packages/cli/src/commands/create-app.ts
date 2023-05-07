import { exec } from "child_process";
import fse from "fs-extra";
import inquirer from "inquirer";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import type { CreateAppOptions } from "../types";

const databases = [
	"MySQL",
	"MongoDB",
	"SQLite",
	"PostgreSQL",
	"SQLServer",
	"CockroachDB"
] as const;

type DatabaseType = (typeof databases)[number];

interface Answers {
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

interface ScaffoldOptions extends Answers {
	packageManager: PackageManager;
	projectDirectory: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Create a new Ferod app.
 */
export async function createFerodApp(options: CreateAppOptions): Promise<void> {
	const answers = await getAnswers(options);

	const packageManager = getUserPackageManager();

	const name = answers.name ?? options.name;

	const projectDirectory = resolve(process.cwd(), name);

	await scaffoldProject({
		...answers,
		packageManager,
		projectDirectory
	});
}

/**
 * Get the answers to the questions
 * @param options The options passed to the command
 * @returns The answers to the questions
 */
async function getAnswers(options: CreateAppOptions): Promise<Answers> {
	if (options.flags.yes) {
		return {
			name: options.name ?? "my-app",
			gitRepo: options.flags.noGit === undefined,
			install: options.flags.noInstall === undefined,
			prisma: true,
			databaseType: "MongoDB",
			databaseUri: `mongodb://localhost:27017/${options.name ?? "my-app"}`,
			typescript: true,
			helpCommand: true,
			dashboard: true,
			eslintAndPrettier: true
		};
	}

	return await inquirer.prompt([
		{
			name: "name",
			type: "input",
			message: "What is the name of your app?",
			default: "my-app",
			when: () => options.name === undefined
		},
		{
			name: "gitRepo",
			type: "confirm",
			message: "Initialize a git repository?",
			default: true,
			when: () => !options.flags.yes && options.flags.noGit === undefined
		},
		{
			name: "install",
			type: "confirm",
			message: "Install dependencies?",
			default: true,
			when: () => !options.flags.yes && options.flags.noInstall === undefined
		},
		{
			name: "prisma",
			type: "confirm",
			message: "Use Prisma?",
			default: true,
			when: () => !options.flags.yes
		},
		{
			name: "databaseType",
			type: "list",
			message: "What database do you want to use?",
			choices: databases,
			default: "MongoDB",
			when: (answers) => !options.flags.yes && answers.prisma
		},
		{
			name: "databaseUri",
			type: "input",
			message: "What is the database URI?",
			default: `mongodb://localhost:27017/${options.name ?? "my-app"}`,
			when: (answers) => !options.flags.yes && answers.prisma
		},
		{
			name: "typescript",
			type: "confirm",
			message: "Use TypeScript?",
			default: true,
			when: () => !options.flags.yes
		},
		{
			name: "helpCommand",
			type: "confirm",
			message: "Add a help command?",
			default: true,
			when: () => !options.flags.yes
		},
		{
			name: "dashboard",
			type: "confirm",
			message: "Add a dashboard?",
			default: true,
			when: () => !options.flags.yes
		},
		{
			name: "eslintAndPrettier",
			type: "confirm",
			message: "Use ESLint and Prettier?",
			default: true,
			when: () => !options.flags.yes
		}
	]);
}

type PackageManager = "npm" | "yarn" | "pnpm";

/**
 * Gets the user's package manager
 */
function getUserPackageManager(): PackageManager {
	// This environment variable is set by npm and yarn but pnpm seems less consistent
	const userAgent = process.env.npm_config_user_agent;
	if (userAgent === undefined) {
		return "npm";
	}

	if (userAgent.includes("yarn")) {
		return "yarn";
	} else if (userAgent.includes("pnpm")) {
		return "pnpm";
	}

	return "npm";
}

/**
 * Scaffold a new Ferod app
 */
async function scaffoldProject(options: ScaffoldOptions): Promise<void> {
	const templatesDirectory = resolve(__dirname, "../templates");

	const dependencies = new Set<string>([]);
	const devDependencies = new Set(["nodemon", "dotenv"]);

	if (options.prisma) {
		dependencies.add("@prisma/client");

		devDependencies.add("prisma");
	}

	if (options.typescript) {
		devDependencies.add("@types/node");
		devDependencies.add("typescript");
		devDependencies.add("ts-node");
	}

	if (options.dashboard) {
		dependencies.add("@solidjs/meta");
		dependencies.add("@solidjs/router");
		dependencies.add("solid-js");
		dependencies.add("solid-start");
		dependencies.add("undici");

		devDependencies.add("vite");
		devDependencies.add("solid-start-node");
		devDependencies.add("esbuild");
		devDependencies.add("postcss");
		devDependencies.add("@types/node");
		devDependencies.add("typescript");
	}

	if (options.eslintAndPrettier) {
		devDependencies.add("eslint");
		devDependencies.add("prettier");
		devDependencies.add("eslint-config-prettier");
		devDependencies.add("eslint-plugin-prettier");

		if (options.typescript) {
			devDependencies.add("@typescript-eslint/eslint-plugin");
			devDependencies.add("@typescript-eslint/parser");
		}
	}

	console.log(`Using ${options.packageManager} to scaffold the project`);

	if (fse.existsSync(options.projectDirectory)) {
		if (fse.readdirSync(options.projectDirectory).length > 0) {
			console.log(
				`The directory ${options.projectDirectory} is not empty. Please try again.`
			);

			return;
		}
	} else {
		fse.mkdirSync(options.projectDirectory);
	}

	// initialize npm/yarn/pnpm project
	exec(`cd "${options.projectDirectory}" && ${options.packageManager} init -y`);

	// initialize git repository
	if (options.gitRepo) {
		exec(`cd "${options.projectDirectory}" && git init`);
		fse.copySync(resolve(templatesDirectory, "git"), options.projectDirectory);
	}

	// copy base files
	const basePath = options.typescript ? "base-ts" : "base-js";
	fse.copySync(resolve(templatesDirectory, "base"), options.projectDirectory);
	fse.copySync(resolve(templatesDirectory, basePath), options.projectDirectory);

	// copy prisma files
	if (options.prisma) {
		fse.mkdirSync(resolve(options.projectDirectory, "prisma"));

		const databaseType = options.databaseType?.toLowerCase() ?? "mongodb";

		fse.copyFileSync(
			resolve(templatesDirectory, `prisma/${databaseType}.prisma`),
			resolve(options.projectDirectory, "prisma/schema.prisma")
		);
	}

	// install dependencies
	if (options.install) {
		const dependenciesString = Array.from(dependencies).join(" ");
		const devDependenciesString = Array.from(devDependencies).join(" ");
		const installCommand = options.packageManager === "npm" ? "install" : "add";
		const devFlag = options.packageManager === "npm" ? "--save-dev" : "-D";
		exec(
			`cd "${options.projectDirectory}" && ${options.packageManager} ${installCommand} ${dependenciesString} && ${options.packageManager} ${installCommand} ${devFlag} ${devDependenciesString}`,
			console.log
		);
	}
}
