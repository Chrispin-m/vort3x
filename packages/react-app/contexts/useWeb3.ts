import { useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseUnits,
  parseEther,
  formatUnits,
  encodeFunctionData,
} from "viem";
import { celo } from "viem/chains"; // MAINNET import
import { stableTokenABI } from "@celo/abis";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Supported tokens for MiniPay (Celo Mainnet addresses)
type MiniPayToken = {
  symbol: "cUSD" | "cEUR" | "cREAL" | "CELO" | "USDC" | "CKES" | "USDT";
  address?: `0x${string}`;
  decimals: number;
  abi?: typeof stableTokenABI; 
};

const TOKENS: MiniPayToken[] = [
  {
    symbol: "cUSD",
    address: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // cUSD Mainnet
    decimals: 18,
    abi: stableTokenABI,
  },
  {
    symbol: "cEUR",
    address: "0xD8763CBA276a3738e6de85b4B3BF5fdED6d6cA73", // cEUR Mainnet
    decimals: 18,
    abi: stableTokenABI,
  },
  {
    symbol: "cREAL",
    address: "0xE4D517785D091D3c54818832dB6094bcc2744545", // cREAL Mainnet
    decimals: 18,
    abi: stableTokenABI,
  },
  {
    symbol: "USDC",
    address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", // USDC Mainnet
    decimals: 6,
    abi: stableTokenABI,
  },
  {
    symbol: "CKES",
    address: "0x1E0433C1769271ECcF4CFF9FDdD515eefE6CdF92", // CKES Mainnet
    decimals: 6,
    abi: stableTokenABI,
  },
  {
    symbol: "USDT",
    address: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e", // USDT Mainnet
    decimals: 6,
    abi: stableTokenABI,
  },
  {
    symbol: "CELO",
    address: undefined, // Native
    decimals: 18,
    abi: undefined,
  },
];

const publicClient = createPublicClient({
  chain: celo, // MAINNET
  transport: http(),
});

const CELO_FEE_BUFFER = parseEther("0.01");

export const useWeb3 = () => {
  const [address, setAddress] = useState<`0x${string}` | null>(null);

  const getUserAddress = async (): Promise<`0x${string}`> => {
    if (typeof window !== "undefined" && window.ethereum) {
      // First try to get connected accounts without prompting
      let accounts: `0x${string}`[] = await window.ethereum.request({
        method: "eth_accounts",
      });
      
      // If accounts are connected, return the first one
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        return accounts[0];
      }
      
      // If no connected accounts, request access
      if (window.ethereum.isMiniPay) {
        accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
          params: [],
        });
      } else {
        const walletClient = createWalletClient({
          transport: custom(window.ethereum),
          chain: celo, // MAINNET
        });
        accounts = await walletClient.getAddresses() as `0x${string}`[];
      }
      
      setAddress(accounts[0]);
      return accounts[0];
    }
    throw new Error("No injected wallet found");
  };

  const getTokenBalance = async (
    userAddress: `0x${string}`,
    token: MiniPayToken
    ): Promise<bigint> => {
    if (token.symbol === "CELO") {
      return await publicClient.getBalance({ address: userAddress });
    } else if (token.address && token.abi) {
      return await publicClient.readContract({
        abi: token.abi,
        address: token.address,
        functionName: "balanceOf",
        args: [userAddress],
      });
    }
    throw new Error("Invalid token configuration");
  };

  const findTokenWithBalance = async (
    userAddress: `0x${string}`,
    amount: string,
    to: `0x${string}`
    ): Promise<MiniPayToken> => {
    for (const token of TOKENS) {
      try {
        let amountInWei: bigint;
        if (token.symbol === "CELO") {
          amountInWei = parseEther(amount);
          const balance = await getTokenBalance(userAddress, token);
          
          if (balance >= amountInWei + CELO_FEE_BUFFER) {
            return token;
          }
        } else if (token.address && token.abi) {
          amountInWei = parseUnits(amount, token.decimals);
          const balance = await getTokenBalance(userAddress, token);
          
          if (balance >= amountInWei) {
            return token;
          }
        }
      } catch (error) {
        console.warn(`Balance check failed for ${token.symbol}:`, error);
      }
    }
    throw new Error("Insufficient balance in all supported tokens");
  };

  const sendToken = async (
    to: `0x${string}`,
    amount: string,
    tokenSymbol: string
    ): Promise<`0x${string}`> => {
    if (!window.ethereum) throw new Error("No wallet found");

    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
      chain: celo,
    });

    const [userAddress] = (await walletClient.getAddresses()) as [`0x${string}`];
    
    // Find the selected token
    const token = TOKENS.find(t => t.symbol === tokenSymbol);
    if (!token) throw new Error(`Token ${tokenSymbol} not supported`);

    let amountInWei: bigint;
    if (token.symbol === "CELO") {
      amountInWei = parseEther(amount);
    } else if (token.decimals) {
      amountInWei = parseUnits(amount, token.decimals);
    } else {
      throw new Error("Invalid token decimals");
    }

    const txRequest = {
      account: userAddress,
      feeCurrency: token.symbol === "CELO" ? undefined : token.address!,
      ...(token.symbol === "CELO"
        ? {
          to,
          value: amountInWei,
        }
        : token.address && token.abi
        ? {
          to: token.address,
          data: encodeFunctionData({
            abi: token.abi,
            functionName: "transfer",
            args: [to, amountInWei],
          }),
          value: 0n,
        }
        : {}),
    };

    try {
      const hash = await walletClient.sendTransaction(txRequest);
      return hash;
    } catch (error: any) {
      console.error("Transaction failed:", error);
      throw new Error(
    `Transaction failed: ${error.shortMessage || error.message}`
    );
    }
  };

  const checkBalanceForTx = async (
    userAddress: `0x${string}`,
    amount: string,
    to: `0x${string}`
    ): Promise<void> => {
    try {
      await findTokenWithBalance(userAddress, amount, to);
    } catch (e: any) {
      throw new Error(e.message);
    }
  };

  return {
    address,
    getUserAddress,
    sendToken,
    checkBalanceForTx,
    findTokenWithBalance,
    getTokenBalance
  };
};
