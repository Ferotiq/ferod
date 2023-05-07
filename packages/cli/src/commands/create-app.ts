import inquirer from "inquirer";
import { resolve } from "path";
import type { CreateAppOptions } from "../types";

interface Answers {
  name: string;
  gitRepo: boolean;
  install: boolean;
  prisma: boolean;
  databaseType?: "PostgreSQL" | "MySQL" | "MongoDB" | "SQLite";
  databaseURI?: string;
  language: "TypeScript" | "JavaScript";
  helpCommand: boolean;
  dashboard: boolean;
  dashboardFramework: "React" | "SolidJS";
  eslintAndPrettier: boolean;
}

/**
 * Create a new Ferod app.
 */
export async function createFerodApp(options: CreateAppOptions): Promise<void> {
  const answers: Answers = await inquirer.prompt([
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
      choices: ["PostgreSQL", "MySQL", "MongoDB", "SQLite"],
      default: "MongoDB",
      when: (answers) => !options.flags.yes && answers.prisma
    },
    {
      name: "databaseURI",
      type: "input",
      message: "What is the database URI?",
      default: `mongodb://localhost:27017/${options.name ?? "my-app"}`,
      when: (answers) => !options.flags.yes && answers.prisma
    },
    {
      name: "language",
      type: "list",
      message: "What language do you want to use?",
      choices: ["TypeScript", "JavaScript"],
      default: "TypeScript",
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
      name: "dashboardFramework",
      type: "list",
      message: "What framework do you want to use for the dashboard?",
      choices: ["React", "SolidJS"],
      default: "SolidJS",
      when: (answers) => !options.flags.yes && answers.dashboard
    },
    {
      name: "eslintAndPrettier",
      type: "confirm",
      message: "Use ESLint and Prettier?",
      default: true,
      when: () => !options.flags.yes
    }
  ]);

  const packageManager = getUserPackageManager();

  const name = answers.name ?? options.name;

  const projectDirectory = resolve(process.cwd(), name);

  await scaffoldProject({
    ...answers,
    packageManager,
    projectDirectory
  });
}

type PackageManager = "npm" | "yarn" | "pnpm";

/**
 * Gets the user's package manager
 */
function getUserPackageManager(): PackageManager {
  // This environment variable is set by npm and yarn but pnpm seems less consistent
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent) {
    if (userAgent.startsWith("yarn")) {
      return "yarn";
    } else if (userAgent.startsWith("pnpm")) {
      return "pnpm";
    } else {
      return "npm";
    }
  } else {
    // If no user agent is set, assume npm
    return "npm";
  }
}

/**
 * Scaffold a new Ferod app
 */
async function scaffoldProject(
  options: Answers & {
    packageManager: PackageManager;
    projectDirectory: string;
  }
): Promise<void> {
  const templatesDirectory = resolve(__dirname, "../../templates");
  console.log(templatesDirectory);

  const packages = ["ferod"];

  if (options.prisma) {
    packages.push("prisma", "@prisma/client");
  }

  if (options.language === "TypeScript") {
    packages.push("typescript");
  }

  if (options.dashboard) {
    if (options.dashboardFramework === "React") {
      packages.push("react", "react-dom");
    } else {
      packages.push("solid-js");
    }

    packages.push("vite");
  }

  console.log(`Using ${options.packageManager} to scaffold the project`);
}
