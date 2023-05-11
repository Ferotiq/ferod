import { config } from "dotenv";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { Client, type ClientOptions } from "../src/index.js";
import options from "./config/config.json" assert { type: "json" };

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Client(options as ClientOptions, __dirname);

const token = process.env.TOKEN;
if (token === undefined) {
	throw new Error("Missing Discord token.");
}

client.start(token);
