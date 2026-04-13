#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import fs from "fs";
import { startServer } from "../server/server.js";

const program = new Command();

program
  .command("serve [file]")
  .description("Serve file as AI generated webpage")
  .action(async (file) => {
    let filePath = file;

    if (!filePath) {
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "file",
          message: "Enter file path:",
        },
      ]);

      filePath = answer.file;
    }

    if (!fs.existsSync(filePath)) {
      console.log("❌ File not found");
      process.exit(1);
    }

    startServer(filePath);
  });

program.parse(process.argv);
