import { useState } from "react";
import StableTokenABI from "./cusd-abi.json";
import {
    createPublicClient,
    createWalletClient,
    custom,
    getContract,
    http,
    parseEther,
    encodeFunctionData,
    formatEther,
} from "viem";
import { celoAlfajores } from "viem/chains";

// Initialize public client for read-only blockchain interactions
const publicClient = createPublicClient({
    chain: celoAlfajores,
    transport: http(),
});

// cUSD contract address on Alfajores testnet
const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

export const useWeb3 = () => {
    const [address, setAddress] = useState<string | null>(null);

    // Retrieve the connected user's address from the injected wallet
    const getUserAddress = async (): Promise<string> => {
        if (typeof window === "undefined" || !window.ethereum) {
            throw new Error("No injected wallet found. Please connect a wallet like MiniPay.");
        }

        const walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: celoAlfajores,
        });
        const [userAddress] = await walletClient.getAddresses();
        setAddress(userAddress);
        return userAddress;
    };

    // Fetch the user's cUSD balance using the contract
    const getCUSDBalance = async (userAddress: string): Promise<bigint> => {
        try {
            const token = getContract({
                abi: StableTokenABI.abi,
                address: cUSDTokenAddress,
                publicClient,
            });
            const balance = await token.read.balanceOf([userAddress]);
            return balance; // Returns balance in wei (bigint)
        } catch (error) {
            console.error("Failed to fetch cUSD balance:", error);
            throw new Error("Unable to retrieve cUSD balance. Please try again.");
        }
    };

    // Estimate gas limit for a transaction using cUSD as the fee currency
    const estimateGas = async (tx: any): Promise<bigint> => {
        try {
            return await publicClient.estimateGas({
                ...tx,
                feeCurrency: cUSDTokenAddress,
            });
        } catch (error) {
            console.error("Gas estimation failed:", error);
            throw new Error("Could not estimate gas for the transaction.");
        }
    };

    // Estimate gas price for a transaction using cUSD
    const estimateGasPrice = async (): Promise<bigint> => {
        try {
            return await publicClient.request({
                method: "eth_gasPrice",
                params: [cUSDTokenAddress],
            });
        } catch (error) {
            console.error("Gas price estimation failed:", error);
            throw new Error("Could not estimate gas price.");
        }
    };

    // Send cUSD to a specified address and return the transaction hash
    const sendCUSD = async (to: string, amount: string): Promise<string> => {
        if (!window.ethereum) {
            throw new Error("No injected wallet found. Please connect a wallet.");
        }

        const walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: celoAlfajores,
        });
        const [userAddress] = await walletClient.getAddresses();
        const amountInWei = parseEther(amount); // Convert amount to wei

        // Prepare the transfer function call data
        const data = encodeFunctionData({
            abi: StableTokenABI.abi,
            functionName: "transfer",
            args: [to, amountInWei],
        });

        const txRequest = {
            account: userAddress,
            to: cUSDTokenAddress,
            data,
            value: 0n, // No native CELO, only cUSD
        };

        try {
            const gasLimit = await estimateGas(txRequest);
            const gasPrice = await estimateGasPrice();

            // Check if the user has sufficient cUSD balance
            const balance = await getCUSDBalance(userAddress);
            const totalCost = amountInWei + gasLimit * gasPrice;

            if (balance < totalCost) {
                throw new Error(
                    `Insufficient cUSD balance. Required: ${formatEther(totalCost)} cUSD, Available: ${formatEther(balance)} cUSD`
                );
            }

            // Send the transaction
            const hash = await walletClient.sendTransaction({
                ...txRequest,
                gas: gasLimit,
                maxFeePerGas: gasPrice,
                maxPriorityFeePerGas: gasPrice,
                feeCurrency: cUSDTokenAddress,
            });

            return hash;
        } catch (error) {
            console.error("cUSD transaction failed:", error);
            throw new Error(`Failed to send cUSD: ${error.message}`);
        }
    };

    return {
        address,
        getUserAddress,
        getCUSDBalance,
        estimateGas,
        estimateGasPrice,
        sendCUSD,
    };
};