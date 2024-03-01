#!/usr/bin/env node

import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import { program } from "commander";
// Import viem transport, viem chain, and ENSjs
import { http } from "viem";
import { mainnet } from "viem/chains";
import { createEnsPublicClient } from "@ensdomains/ensjs";
import { createTable } from "./utils/utils.js";

// Create the client
const client = createEnsPublicClient({
    chain: mainnet,
    transport: http(),
});

program
    .version("0.0.1")
    .description("Terminal-ENS(TENS) CLI")
    .option("-l, --lookup <value>", "lookup eth address")
    .option("-s, --search <value>", "in progress - search wallet address")
    .option("-r, --register <value>", "in progress - register eth address")
    .option("-h, --help", "display help for command");

// program.parse(process.argv);
program.parse(process.argv);
const options = program.opts();

async function lookupEthAddress(address: string) {
    try {
        const ethAddress = await client.getAddressRecord({ name: address });

        if (ethAddress) {
            const table = new createTable(String(ethAddress.value));

            console.table(table);
        }
    } catch (e) {
        console.log("error occured while looking up eth address", e);
    }
}

// TODO, finish function to look up contents of wallet address
async function searchWalletAddress(walletAddress: string) {
    try {
        console.log("searchWalletAddress");
    } catch (e) {
        console.log("error occured while searching wallet address", e);
    }
}

if (options.lookup) {
    const addressToSearch = async (): Promise<any> => {
        if (
            typeof options.lookup === "string" &&
            options.lookup.endsWith(".eth")
        ) {
            return await lookupEthAddress(options.lookup);
        } else if (
            typeof options.lookup === "string" &&
            !options.lookup.endsWith(".eth")
        ) {
            return await lookupEthAddress(`${options.lookup}.eth`);
        }
    };
    addressToSearch();
}

//TODO function to search wallet address
//TODO function to register eth address

if (!process.argv.slice(2).length) {
    clear();
    console.log(
        chalk.greenBright(
            figlet.textSync("T-ENS", { horizontalLayout: "full" }),
        ),
    );
    program.outputHelp();
}
