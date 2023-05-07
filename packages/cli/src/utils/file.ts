import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

/**
 * Get the templates directory
 * @param metaUrl The meta URL of the calling file
 * @returns The templates directory
 */
export function getTemplatesDirectory(metaUrl: string): string {
	const __dirname = dirname(fileURLToPath(metaUrl));
	const templatesDirectory = resolve(__dirname, "../templates");

	return templatesDirectory;
}
