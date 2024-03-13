import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
    chain: mainnet,
    transport: http(process.env.ALCHEMY_HTTPS),
});
