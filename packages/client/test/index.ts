console.clear();

import { Client, ClientOptions } from "../src";

import { config } from "dotenv";

config({ path: "./test/.env" });

import conf from "./config/config.json";

const token = process.env.TOKEN;

if (!token) {
  console.error("No token found!");

  process.exit(1);
}

const client = new Client(conf as ClientOptions, __dirname);

client.start(token);
