console.clear();

import { Client } from "../src";

import { config } from "dotenv";

config({ path: "./test/.env" });

import * as fs from "fs";

const conf = JSON.parse(
  fs.readFileSync("./test/config/config.json").toString() || "null"
);

if (!conf) {
  console.error("No config.json found!");

  process.exit(1);
}

const token = process.env.TOKEN;

if (!token) {
  console.error("No token found!");

  process.exit(1);
}

const client = new Client(conf, __dirname);

client.start(token);
