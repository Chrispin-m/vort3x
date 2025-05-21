import { useState, useEffect } from "react";
import StableTokenABI from "./cusd-abi.json";
import {
    createPublicClient,
    createWalletClient,
    custom,
    http,
    parseEther,
    Address,
    formatUnits,
    Hash
} from "viem";
import { celoAlfajores } from "viem/chains";
import { VortexAddress } from "@/app/config/addresses";
import { BigNumber } from "bignumber.js";

// Token type enforcement
type TokenType = "CUSD" | "CELO";
type TokenConfig = {
    address: Address;
    abi: any;
    isNative: boolean;
};

const publicClient = createPublicClient({
    chain: celoAlfajores,
    transport: http(),
});

const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
    CUSD: {
        address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
        abi: StableTokenABI.abi,
        isNative: false
    },
    CELO: {
        address: "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9", // Wrapped CELO address
        abi: [], // Native transfers don't need ABI
        isNative: true
    }
};

// Strict type-checked decimal parser
const parseExactUnits = (amount: string, decimals: number = 18): bigint => {
    const bn = new BigNumber(amount);
    if (bn.isNaN() || !bn.isFinite()) throw new Error("Invalid amount format");
    return BigInt(bn.times(10 ** decimals).toFixed(0));
};

export const useWeb3 = () => {
    const [address, setAddress] = useState<Address | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [balances, setBalances] = useState<Record<TokenType, string>>({
        CUSD: "0",
        CELO: "0"
    });

    const updateBalances = async (addr: Address) => {
        try {
            const [celoBalance, cusdBalance] = await Promise.all([
                // Native CELO balance
                publicClient.getBalance({ address: addr }),
                // cUSD balance
                publicClient.readContract({
                    address: TOKEN_CONFIGS.CUSD.address,
                    abi: TOKEN_CONFIGS.CUSD.abi,
                    functionName: "balanceOf",
                    args: [addr],
                })
            ]);

            setBalances({
                CUSD: formatUnits(cusdBalance, 18),
                CELO: formatUnits(celoBalance, 18)
            });
        } catch (error) {
            console.error("Balance update failed:", error);
        }
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
                await updateBalances(address);
            }
        } catch (error) {
            console.error("Connection error:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    const sendToken = async (tokenType: TokenType, amount: string) => {
        if (!address) throw new Error("Wallet not connected");
        if (!Object.keys(TOKEN_CONFIGS).includes(tokenType)) {
            throw new Error("Unsupported token type");
        }

        const amountInWei = parseExactUnits(amount);
        const config = TOKEN_CONFIGS[tokenType];
        const walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: celoAlfajores,
        });

        // Check balance first
        const currentBalance = config.isNative
            ? await publicClient.getBalance({ address })
            : await publicClient.readContract({
                address: config.address,
                abi: config.abi,
                functionName: "balanceOf",
                args: [address],
            });

        if (currentBalance < amountInWei) {
            throw new Error(`Insufficient ${tokenType} balance`);
        }

        let txHash: Hash;
        if (config.isNative) {
            // Native CELO transfer
            txHash = await walletClient.sendTransaction({
                account: address,
                to: VortexAddress,
                value: amountInWei,
            });
        } else {
            // cUSD ERC20 transfer
            txHash = await walletClient.writeContract({
                address: config.address,
                abi: config.abi,
                functionName: "transfer",
                account: address,
                args: [VortexAddress, amountInWei],
            });
        }

        const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
        });

        await updateBalances(address);
        return receipt;
    };

    useEffect(() => {
        if (window.ethereum?.isMiniPay) connectWallet();
    }, []);

    return { 
        address,
        balances,
        isConnecting, 
        connectWallet, 
        sendToken,
        updateBalances,
        supportedTokens: Object.keys(TOKEN_CONFIGS) as TokenType[]
    };
};