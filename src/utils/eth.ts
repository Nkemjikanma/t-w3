import { createPublicClient, http, isAddress, parseAbiItem } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { createTable } from "./utils.js";

const client = createPublicClient({
    chain: mainnet,
    transport: http(process.env.ALCHEMY_HTTPS),
});

export async function getWalletAddress(address: string) {
    // check if complete address is provided

    const addressToSearch = address.endsWith(".eth")
        ? address
        : `${address}.eth`;

    const ethAddress = await client.getEnsAddress({
        name: normalize(addressToSearch),
    });
    if (!ethAddress) {
        console.error("No address found");
        return;
    }

    const table = new createTable(ethAddress);
    console.table(table);
}

export async function getEnsDomainName(address: string) {
    if (!isAddress(address)) {
        console.error("Invalid address");
        return;
    }

    const ensName = await client.getEnsName({ address });

    const table = new createTable(String(ensName));
    console.table(table);
}

export async function transactions(walletAddress: string) {
    if (!isAddress(walletAddress)) {
        console.error("Invalid address");
        return;
    }

    const logs = await client.getLogs({
        address: walletAddress,
        fromBlock: "earliest",
        toBlock: "latest",
        event: parseAbiItem(
            "event Transfer(address indexed from, address indexed to, uint256 value)",
        ),
    });

    console.log(logs);
}

//TODO function to search wallet address
//TODO get balance of eth address
//TODO function to register eth address
