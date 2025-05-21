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
} from "viem";
import { celoAlfajores } from "viem/chains";

const publicClient = createPublicClient({
    chain: celoAlfajores,
    transport: http(),
});

const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // Alfajores testnet cUSD

export const useWeb3 = () => {
    const [address, setAddress] = useState<string | null>(null);

    // Get the connected user's address
    const getUserAddress = async () => {
        if (typeof window !== "undefined" && window.ethereum) {
            const walletClient = createWalletClient({
                transport: custom(window.ethereum),
                chain: celoAlfajores,
            });
            const [userAddress] = await walletClient.getAddresses();
            setAddress(userAddress);
            return userAddress;
        }
        throw new Error("No injected wallet found");
    };

    // Get cUSD balance in wei (bigint)
    const getCUSDBalance = async (userAddress: string) => {
        const token = getContract({
            abi: StableTokenABI.abi,
            address: cUSDTokenAddress,
            publicClient,
        });
        const balance = await token.read.balanceOf([userAddress]);
        return balance;
    };

    // Estimate gas limit for a transaction
    const estimateGas = async (tx: any, feeCurrency: string = cUSDTokenAddress) => {
        return await publicClient.estimateGas({
            ...tx,
            feeCurrency,
        });
    };

    // Estimate gas price for a transaction
    const estimateGasPrice = async (feeCurrency: string = cUSDTokenAddress) => {
        return await publicClient.request({
            method: "eth_gasPrice",
            params: [feeCurrency],
        });
    };

    // Send cUSD and return the transaction hash
    const sendCUSD = async (to: string, amount: string) => {
        if (!window.ethereum) throw new Error("No injected wallet found");
        
        const walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: celoAlfajores,
        });
        const [userAddress] = await walletClient.getAddresses();
        const amountInWei = parseEther(amount);

        const data = encodeFunctionData({
            abi: StableTokenABI.abi,
            functionName: "transfer",
            args: [to, amountInWei],
        });

        const txRequest = {
            account: userAddress,
            to: cUSDTokenAddress,
            data,
            value: 0n,
        };

        const gasLimit = await estimateGas(txRequest);
        const gasPrice = await estimateGasPrice();

        const hash = await walletClient.sendTransaction({
            ...txRequest,
            gas: gasLimit,
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice,
            feeCurrency: cUSDTokenAddress,
        });

        return hash;
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