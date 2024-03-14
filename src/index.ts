#!/usr/bin/env node

import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import { program } from "commander";
import {
    getEnsDomainName,
    getWalletAddress,
    transactions,
} from "./utils/eth.js";
import { isAddress } from "viem";

program
    .version("0.0.1")
    .description("Terminal-ENS(TENS) CLI")
    .option(
        "-r, --resolve <value>",
        "resolve Address from ENS name or ENS name from address",
    )
    .option("-s, --search <value>", "resolve ENS name from address")
    .option("-t, --transactions <value>", "get all wallet transactions")
    .option("-h, --help", "display help for command");

// program.parse(process.argv);
program.parse(process.argv);
const options = program.opts();

if (options.resolve) {
    if (isAddress(options.resolve)) {
        getEnsDomainName(options.resolve);
    } else {
        getWalletAddress(options.resolve);
    }
}
if (options.transactions) {
    await transactions(options.transactions);
}

if (!process.argv.slice(2).length) {
    clear();
    console.log(
        chalk.greenBright(
            figlet.textSync("T-ENS", { horizontalLayout: "full" }),
        ),
    );
    program.outputHelp();
}
