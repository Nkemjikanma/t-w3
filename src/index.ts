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
import { oraPromise } from "ora";

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

// TODO: handle ora promise - success and failure

if (options.resolve) {
    if (isAddress(options.resolve)) {
        await oraPromise(getEnsDomainName(options.resolve), "Resolving ENS");
    } else {
        await oraPromise(
            getWalletAddress(options.resolve),
            "Resolving Address",
        );
    }
}
if (options.transactions) {
    await oraPromise(
        transactions(options.transactions),
        "Fetching Transactions",
    );
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
