import { useState, useEffect } from "react";
import StableTokenABI from "./cusd-abi.json";
import {
    createPublicClient,
    createWalletClient,
    custom,
    getContract,
    http,
    parseEther,
} from "viem";
import { celoAlfajores } from "viem/chains";
import { VortexAddress } from "@/app/config/addresses";

const publicClient = createPublicClient({
    chain: celoAlfajores,
    transport: http(),
});

const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

export const useWeb3 = () => {
    const [address, setAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const connectWallet = async () => {
        if (typeof window === "undefined" || !window.ethereum) return;
        setIsConnecting(true);
        try {
            const walletClient = createWalletClient({
                transport: custom(window.ethereum),
                chain: celoAlfajores,
            });
            const [address] = await walletClient.getAddresses();
            setAddress(address);
        } catch (error) {
            console.error("Connection error:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    const sendCUSD = async (amount: string) => {
        if (!address) throw new Error("Wallet not connected");
        const walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: celoAlfajores,
        });
        const txHash = await walletClient.writeContract({
            address: cUSDTokenAddress,
            abi: StableTokenABI.abi,
            functionName: "transfer",
            account: address,
            args: [VortexAddress, parseEther(amount)],
        });
        const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
        });
        return receipt;
    };

    useEffect(() => {
        if (window.ethereum?.isMiniPay) connectWallet();
    }, []);

    return { address, isConnecting, connectWallet, sendCUSD };
};