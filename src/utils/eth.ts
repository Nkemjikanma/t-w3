import "dotenv/config";

import { createClient, formatEther, http, isAddress } from "viem";
import { getBalance, getEnsAddress, getEnsName } from "viem/actions";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { createTable } from "./utils.js";
import { publicActionCovalent } from "@covalenthq/client-viem-sdk";
import ora from "ora";

const client = createClient({
    chain: mainnet,
    transport: http(process.env.ALCHEMY_HTTPS),
}).extend(publicActionCovalent(process.env.COVALENT_API_KEY));

export async function getWalletAddress(address: string) {
    // check if complete address is provided
    const addressToSearch = address.endsWith(".eth")
        ? address
        : `${address}.eth`;

    const ethAddress = await getEnsAddress(client, {
        name: normalize(addressToSearch),
    });

    if (!ethAddress) {
        console.error("\n No address found");
        return;
    }

    const table = new createTable(ethAddress);
    console.log("");
    console.table(table);
    return ethAddress;
}

export async function getEnsDomainName(address: string) {
    if (!isAddress(address)) {
        console.error("Invalid address");
        return;
    }

    const ensName = await getEnsName(client, { address });

    const table = new createTable(String(ensName));
    console.log("");
    console.table(table);
}

// get all tokens in wallet
export async function getWalletBalances(walletAddress: string) {
    const hexAdd = async (): Promise<`0x${string}` | undefined> => {
        if (!isAddress(walletAddress)) {
            try {
                return await getWalletAddress(walletAddress);
            } catch (error) {
                console.error("Invalid address");
                return;
            }
        }
        return walletAddress;
    };

    const spinner = ora("Verifying address").start();
    const hex = await hexAdd();
    spinner.succeed("Address verified");

    if (!hex) {
        return;
    }

    spinner.start("Fetching token balances\n");
    const tokenBalances =
        await client.BalanceService.getTokenBalancesForWalletAddress(
            "eth-mainnet",
            hex,
        );

    const tokenBalance = tokenBalances.data.items;

    console.table(
        tokenBalance.map((balance) => {
            return {
                "Token name": balance.contract_name ?? "-",
                Balance: balance.balance
                    ? (
                          Number(balance.balance) /
                          10 ** balance.contract_decimals
                      ).toFixed(4)
                    : "-",
                "Token value $": balance.quote ?? "-",
                "Percentage change": `${balance.quote_24h / 100}%` ?? "-",
            };
        }),
    );
    spinner.succeed("Token balances fetched");
}

// get wallet value in eth
export async function getWalletBalance(walletAddress: string) {
    const hexAdd = async (): Promise<`0x${string}` | undefined> => {
        if (!isAddress(walletAddress)) {
            try {
                return await getWalletAddress(walletAddress);
            } catch (error) {
                console.error("Invalid address");
                return;
            }
        }
        return walletAddress;
    };

    const spinner = ora("Verifying address").start();
    const hex = await hexAdd();
    spinner.succeed("Address verified");

    if (!hex) {
        return;
    }

    spinner.start("Fetching transactions\n");
    const balance = await getBalance(client, { address: hex && hex });

    console.table({ Balance: `E${Number(formatEther(balance)).toFixed(4)}` });
    spinner.succeed("\n Balance fetched");
}

// get summary of transactions
export async function transactions(walletAddress: string) {
    const hexAdd = async (): Promise<`0x${string}` | undefined> => {
        if (!isAddress(walletAddress)) {
            try {
                return await getWalletAddress(walletAddress);
            } catch (error) {
                console.error("Invalid address");
                return;
            }
        }
        return walletAddress;
    };

    const spinner = ora("Verifying address").start();
    const hex = await hexAdd();
    spinner.succeed("Address verified");

    if (!hex) {
        return;
    }

    spinner.start("Fetching transactions\n");
    const addressActivity = await client.BaseService.getAddressActivity(hex);

    const addressActivities = addressActivity.data.items;

    console.table(
        addressActivities.map((activity) => {
            return {
                Chain: activity.category_label ?? "-",
                label: activity.label ?? "-",
            };
        }),
    );
    spinner.succeed("Transactions fetched");
}
