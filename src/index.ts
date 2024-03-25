#!/usr/bin/env node

import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import { program } from "commander";
import {
    getEnsDomainName,
    getWalletAddress,
    getWalletBalances,
    getWalletBalance,
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
    .option("-w, --wallet <value>", "Get content of wallet address")
    .option("-b, --balance <value>", "Get balance of wallet address")
    .option("-s, --summary <value>", "get wallet transactions summary")
    .option("-h, --help", "display help for command");

program.parse(process.argv);
const options = program.opts();

if (options.resolve) {
    console.log(options.resolve);
    if (isAddress(options.resolve)) {
        await oraPromise(getEnsDomainName(options.resolve), {
            text: "Resolving ENS address",
            successText: "ENS address output: ",
            failText: "ENS address not found", // TODO: handle this - how can I get this error on fail invalid address?
        });
    } else {
        await oraPromise(getWalletAddress(options.resolve), {
            text: "Resolving Address",
            successText: "Address output:",
            failText: "Address Not Found",
        });
    }
}

if (options.wallet) {
    await getWalletBalances(options.wallet);
}

if (options.balance) {
    await getWalletBalance(options.balance);
}

if (options.summary) {
    await transactions(options.summary);
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
