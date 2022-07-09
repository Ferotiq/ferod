import inquirer from "inquirer";
import { resolve } from "path";

interface Answers {
  name: string;
  gitRepo: boolean;
  prisma: boolean;
  databaseType?: "PostgreSQL" | "MySQL" | "MongoDB" | "SQLite";
  databaseURI?: string;
  language: "TypeScript" | "JavaScript";
  helpCommand: boolean;
  dashboard: boolean;
  dashboardFramework: "React" | "SolidJS";
}

/**
 * @description Create a new Fero-DC app.
 */
export async function createFeroDCApp(): Promise<void> {
  const answers: Answers = await inquirer.prompt([
    {
      name: "name",
      type: "input",
      message: "What is the name of your app?",
      default: "fero-dc-app"
    },
    {
      name: "gitRepo",
      type: "confirm",
      message: "Initialize a git repository?",
      default: true
    },
    {
      name: "prisma",
      type: "confirm",
      message: "Use Prisma?",
      default: true
    },
    {
      name: "databaseType",
      type: "list",
      message: "What database do you want to use?",
      choices: ["PostgreSQL", "MySQL", "MongoDB", "SQLite"],
      default: "MongoDB",
      when: (answers) => answers.prisma
    },
    {
      name: "databaseURI",
      type: "input",
      message: "What is the database URI?",
      default: "mongodb://localhost:27017/fero-dc-app",
      when: (answers) => answers.prisma
    },
    {
      name: "language",
      type: "list",
      message: "What language do you want to use?",
      choices: ["TypeScript", "JavaScript"],
      default: "TypeScript"
    },
    {
      name: "helpCommand",
      type: "confirm",
      message: "Add a help command?",
      default: true
    },
    {
      name: "dashboard",
      type: "confirm",
      message: "Add a dashboard?",
      default: true
    },
    {
      name: "dashboardFramework",
      type: "list",
      message: "What framework do you want to use for the dashboard?",
      choices: ["React", "SolidJS"],
      default: "SolidJS",
      when: (answers) => answers.dashboard
    }
  ]);

  const packageManager = getUserPackageManager();

  const projectDirectory = resolve(process.cwd(), answers.name);

  await scaffoldProject({
    ...answers,
    packageManager,
    projectDirectory
  });
}

type PackageManager = "npm" | "yarn" | "pnpm";

/**
 * @description Gets the user's package manager
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
 * @description Scaffold a new Fero-DC app
 */
async function scaffoldProject(
  options: Answers & {
    packageManager: PackageManager;
    projectDirectory: string;
  }
): Promise<void> {
  const templatesDirectory = resolve(__dirname, "../../templates");

  console.log(`Using ${options.packageManager} to scaffold the project`);
}
