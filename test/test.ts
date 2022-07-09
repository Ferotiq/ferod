console.clear();

import { Client, ClientOptions } from "../src";

import config from "./config/config.json";

const client: Client = new Client(config as ClientOptions, __dirname);

client.reload().then(console.log);
