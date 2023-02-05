console.clear();

import { config } from "dotenv";
config();

import { Client, ClientOptions } from "../src";

import { dirname } from "path";
import { fileURLToPath } from "url";

import options from "./config/config.json" assert { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));

const token = process.env.TOKEN;

if (!token) {
  console.error("No token found!");

  process.exit(1);
}

const client = new Client(options as ClientOptions, __dirname);

client.start(token);
