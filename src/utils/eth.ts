import "dotenv/config";

import { createClient, formatEther, http, isAddress } from "viem";
import { getBalance, getEnsAddress, getEnsName } from "viem/actions";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { createTable } from "./utils.js";
import { publicActionCovalent } from "@covalenthq/client-viem-sdk";
import ora from "ora";
import { TokensApprovalItem } from "@covalenthq/client-sdk";

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
    const spinner = ora("Fetching token balances\n").start();

    try {
        const tokenBalances =
            await client.BalanceService.getTokenBalancesForWalletAddress(
                "eth-mainnet",
                walletAddress,
            );

        const tokenBalanceList = tokenBalances.data.items;

        console.table(
            tokenBalanceList.map((balanceItem) => {
                return {
                    "Token name": balanceItem.contract_name ?? "-",
                    Balance: balanceItem.balance
                        ? (
                              Number(balanceItem.balance) /
                              10 ** balanceItem.contract_decimals
                          ).toFixed(4)
                        : "-",
                    "Token value $": balanceItem.quote ?? "-",
                    "Percentage change in 24hrs":
                        `${balanceItem.quote_24h / 100}%` ?? "-",
                    "Last transferred":
                        balanceItem.last_transferred_at.toLocaleDateString() ??
                        "-",
                    Dust: balanceItem.type === "dust" ? "Yes" : "No",
                };
            }),
        );
        spinner.succeed("Token balances fetched");
    } catch (error) {
        spinner.fail("Failed to fetch token balances");
    }
}

// get nft in wallet
export async function getWalletNft(walletAddress: string) {
    const spinner = ora("Fetching NFTs\n").start();

    try {
        const nftItems = await client.NftService.getNftsForAddress(
            "eth-mainnet",
            walletAddress,
            { noSpam: true },
        );

        const nfts = nftItems.data.items;

        console.table(
            nfts.map((nft) => {
                return {
                    Name: nft.contract_name ?? "-",
                    Description: nft.contract_ticker_symbol ?? "-",
                    "Token type": nft.supports_erc.map((erc) => erc).join(", "),
                    "Transfer date": nft.last_transfered_at ?? "-",
                    "Floor price": nft.floor_price_quote ?? "-",
                };
            }),
        );

        spinner.succeed("NFTs fetched");
    } catch (error) {
        spinner.fail("Failed to fetch NFTs");
    }
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
    try {
        const balance = await getBalance(client, { address: hex && hex });

        console.table({
            Balance: `E${Number(formatEther(balance)).toFixed(4)}`,
        });
        spinner.succeed("\n Balance fetched");
    } catch (error) {
        spinner.fail("Failed to fetch balance");
    }
}

// get summary of transactions
// TODO: get more details and add more details
export async function transactions(walletAddress: string) {
    const spinner = ora("Fetching transactions\n").start();

    try {
        const addressActivity = async () => {
            const addressActivities = [];
            for await (const resp of client.TransactionService.getAllTransactionsForAddress(
                "eth-mainnet",
                walletAddress,
            )) {
                addressActivities.push(resp);
            }

            return addressActivities;
        };
        const activities = await addressActivity();

        // console.log(activities);

        console.table(
            activities.map((activity) => {
                return {
                    "Tx Hash": activity.tx_hash ?? "-",
                    From: activity.from_address_label ?? activity.from_address,
                    To: activity.to_address_label ?? activity.to_address,
                    Value: activity.pretty_value_quote ?? "-",
                    "Tx fee": activity.pretty_gas_quote ?? "-",
                };
            }),
        );
        spinner.succeed("\nTransactions fetched");
    } catch (error) {
        spinner.fail("Failed to fetch transactions");
    }
}

export async function getWalletInPools(walletAddress: string) {
    const spinner = ora("Fetching pools\n").start();

    try {
        const pools = await client.XykService.getAddressExchangeBalances(
            "eth-mainnet",
            "uniswap_v2",
            walletAddress,
        );

        const poolData = pools.data.items;

        if (poolData.length === 0) {
            spinner.fail("No pools found");
            return;
        }

        console.table(
            poolData.map((pool) => {
                return {
                    "Token 1 name": pool.token_0.contract_ticker_symbol ?? "-",
                    "Token 1 balance": pool.token_0.balance ?? "-",
                    "Token 2 name": pool.token_1.contract_ticker_symbol ?? "-",
                    "Token 2 balance": pool.token_1.balance ?? "-",
                };
            }),
        );

        spinner.succeed("Pools fetched");
    } catch (error) {
        spinner.fail("Failed to fetch data from pools");
    }
}

// TODO: why "error_message: 'Malformed address provided: undefined'"?
export async function getWalletTokenApprovals(walletAddress: string) {
    const spinner = ora("Fetching token approvals\n").start();

    try {
        const tokenApprovals = await client.SecurityService.getApprovals(
            "eth-mainnet",
            walletAddress,
        );

        const tokenApprovalData: TokensApprovalItem[] =
            tokenApprovals.data.items;

        if (tokenApprovalData.length === 0) {
            spinner.fail(
                "No token approvals! Great job at keeping your wallet secure!",
            );
            return;
        }

        console.table(
            tokenApprovalData.map((approval) => {
                return {
                    "Token name": approval.token_address_label ?? "-",
                    "Risk factor": approval.value_at_risk ?? "-",
                };
            }),
        );
    } catch (error) {
        spinner.fail("Error fetching token approvals");
    }
}
