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
    hexToBigInt,
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

    // Estimate gas limit for a transaction, paid in cUSD
    const estimateGas = async (tx: any) => {
        return await publicClient.estimateGas({
            ...tx,
            feeCurrency: cUSDTokenAddress,
        });
    };

    // Estimate gas price for a transaction, paid in cUSD
    const estimateGasPrice = async () => {
        return await publicClient.request({
            method: "eth_gasPrice",
            params: [cUSDTokenAddress],
        });
    };

    // Calculate transaction fees in cUSD
    const calculateTxFees = async (tx: any) => {
        const gasLimit = await estimateGas(tx);
        const gasPriceHex = await estimateGasPrice();
        const gasPrice = hexToBigInt(gasPriceHex);
        const txFees = gasLimit * gasPrice;
        return txFees;
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
            feeCurrency: cUSDTokenAddress,
        };

        const gasLimit = await estimateGas(txRequest);
        const gasPriceHex = await estimateGasPrice();
        const gasPrice = hexToBigInt(gasPriceHex);

        const hash = await walletClient.sendTransaction({
            ...txRequest,
            gas: gasLimit,
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice,
        });

        return hash;
    };

    // Check if the user has sufficient balance for the transaction
    const checkBalanceForTx = async (userAddress: string, amount: string) => {
        const balance = await getCUSDBalance(userAddress);
        const amountInWei = parseEther(amount);

        const txRequest = {
            account: userAddress,
            to: cUSDTokenAddress,
            data: encodeFunctionData({
                abi: StableTokenABI.abi,
                functionName: "transfer",
                args: [userAddress, amountInWei], // Dummy transfer to self for estimation
            }),
            value: 0n,
        };

        const txFees = await calculateTxFees(txRequest);
        const totalCost = amountInWei + txFees;

        if (balance < totalCost) {
            throw new Error(
                `Insufficient cUSD balance. Required: ${formatEther(totalCost)} cUSD, Available: ${formatEther(balance)} cUSD`
            );
        }
    };

    return {
        address,
        getUserAddress,
        getCUSDBalance,
        estimateGas,
        estimateGasPrice,
        calculateTxFees,
        sendCUSD,
        checkBalanceForTx,
    };
};