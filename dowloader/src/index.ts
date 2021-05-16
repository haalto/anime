#!/usr/bin/env node
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
import { commander } from "./commander";

(async function () {
  commander();
})();
