import { useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseUnits,
  parseEther,
  encodeFunctionData,
} from "viem";
import { celo } from "viem/chains";
import { stableTokenABI } from "@celo/abis";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Supported tokens
type VortexToken = {
  symbol: "USD₮" | "CUSD" | "CKES" | "USDC";
  address: `0x${string}`;
  decimals: number;
  abi: typeof stableTokenABI;
};

const TOKENS: VortexToken[] = [
  {
    symbol: "CUSD",
    address: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // cUSD Mainnet
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
    symbol: "USD₮",
    address: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e", // USDT Mainnet (USD₮)
    decimals: 6,
    abi: stableTokenABI,
  },
];

const publicClient = createPublicClient({
  chain: celo,
  transport: http(),
});

export const useWeb3 = () => {
  const [address, setAddress] = useState<`0x${string}` | null>(null);

  const getUserAddress = async (): Promise<`0x${string}`> => {
    if (typeof window !== "undefined" && window.ethereum) {
      let accounts: `0x${string}`[] = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        return accounts[0];
      }
      if (window.ethereum.isMiniPay) {
        accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
          params: [],
        });
      } else {
        const walletClient = createWalletClient({
          transport: custom(window.ethereum),
          chain: celo,
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
    token: VortexToken
  ): Promise<bigint> => {
    return await publicClient.readContract({
      abi: token.abi,
      address: token.address,
      functionName: "balanceOf",
      args: [userAddress],
    });
  };

  const findTokenWithBalance = async (
    userAddress: `0x${string}`,
    amount: string,
    to: `0x${string}`
  ): Promise<VortexToken> => {
    for (const token of TOKENS) {
      try {
        const amountInWei = parseUnits(amount, token.decimals);
        const balance = await getTokenBalance(userAddress, token);
        if (balance >= amountInWei) {
          return token;
        }
      } catch (error) {
        // Ignore and try next token
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
    const token = TOKENS.find(t => t.symbol === tokenSymbol);
    if (!token) throw new Error(`Token ${tokenSymbol} not supported`);
    const amountInWei = parseUnits(amount, token.decimals);
    const txRequest = {
      account: userAddress,
      to: token.address,
      data: encodeFunctionData({
        abi: token.abi,
        functionName: "transfer",
        args: [to, amountInWei],
      }),
      value: 0n,
      feeCurrency: token.address,
    };
    try {
      const hash = await walletClient.sendTransaction(txRequest);
      return hash;
    } catch (error: any) {
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
    getTokenBalance,
  };
};
