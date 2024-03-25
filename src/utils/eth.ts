import "dotenv/config";

import { createClient, http, isAddress } from "viem";
import { getBalance, getEnsAddress, getEnsName } from "viem/actions";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { createTable } from "./utils.js";
import { publicActionCovalent } from "@covalenthq/client-viem-sdk";

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
        console.error("No address found");
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

    const hex = await hexAdd();

    if (!hex) {
        return;
    }

    const [balance, addressActivity] = await Promise.all([
        getBalance(client, { address: hex && hex }),
        await client.BaseService.getAddressActivity(hex),
        await client.BalanceService.getTokenBalancesForWalletAddress(
            "eth-mainnet",
            hex,
        ),
    ]);

    console.log(balance, addressActivity);

    // TODO: get more information about the wallet address
    // TODO: Render the information in an appealing way to the user - table?
}

export async function getWalletBalance() {}
