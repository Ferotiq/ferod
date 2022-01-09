/** @format */

console.clear();

import { Client } from "../src/index";

import config from "./config/config.json";

// @ts-ignore
const client: Client = new Client(config);

client.reload().then(console.log);
