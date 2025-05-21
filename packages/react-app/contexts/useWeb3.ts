import { useState, useEffect } from "react";
import StableTokenABI from "./cusd-abi.json";
import {
    createPublicClient,
    createWalletClient,
    custom,
    getContract,
    http,
    parseEther,
    Address,
    formatUnits,
} from "viem";
import { celoAlfajores } from "viem/chains";
import { VortexAddress } from "@/app/config/addresses";
import { BigNumber } from "bignumber.js";

const publicClient = createPublicClient({
    chain: celoAlfajores,
    transport: http(),
});

const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

// Helper function to handle scientific notation and precise decimals
const parseExactEther = (amount: string): bigint => {
    const bn = new BigNumber(amount);
    if (bn.isNaN()) throw new Error("Invalid amount format");
    return BigInt(bn.times(1e18).toFixed(0));
};

export const useWeb3 = () => {
    const [address, setAddress] = useState<Address | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [balance, setBalance] = useState<string>("0");

    const updateBalance = async (addr: Address) => {
        const balance = await publicClient.readContract({
            address: cUSDTokenAddress,
            abi: StableTokenABI.abi,
            functionName: "balanceOf",
            args: [addr],
        });
        setBalance(formatUnits(balance, 18));
    };

    const connectWallet = async () => {
        if (typeof window === "undefined" || !window.ethereum) return;
        setIsConnecting(true);
        try {
            const walletClient = createWalletClient({
                transport: custom(window.ethereum),
                chain: celoAlfajores,
            });
            const [address] = await walletClient.getAddresses();
            if (address) {
                setAddress(address);
                await updateBalance(address);
            }
        } catch (error) {
            console.error("Connection error:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    const sendCUSD = async (amount: string) => {
        if (!address) throw new Error("Wallet not connected");
        
        // Check balance first
        const currentBalance = await publicClient.readContract({
            address: cUSDTokenAddress,
            abi: StableTokenABI.abi,
            functionName: "balanceOf",
            args: [address],
        });

        const amountInWei = parseExactEther(amount);
        if (currentBalance < amountInWei) {
            throw new Error("Insufficient balance");
        }

        const walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: celoAlfajores,
        });

        const txHash = await walletClient.writeContract({
            address: cUSDTokenAddress,
            abi: StableTokenABI.abi,
            functionName: "transfer",
            account: address,
            args: [VortexAddress, amountInWei],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
        });

        // Update balance after transaction
        await updateBalance(address);
        return receipt;
    };

    useEffect(() => {
        if (window.ethereum?.isMiniPay) connectWallet();
    }, []);

    return { 
        address, 
        balance,
        isConnecting, 
        connectWallet, 
        sendCUSD,
        updateBalance,
    };
};