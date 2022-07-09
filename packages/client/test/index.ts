console.clear();

import { Client } from "../src";

import * as fs from "fs";

const config = JSON.parse(
  fs.readFileSync("./test/config.json").toString() || "null"
);

if (!config) {
  console.error("No config.json found!");

  process.exit(1);
}

const client = new Client(config, __dirname);

client.reload().then(console.log);
