import { useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseUnits,
  encodeFunctionData,
} from "viem";
import { celo } from "viem/chains";
import { stableTokenABI } from "@celo/abis";

import { useAccount, useConnect } from "wagmi";         // ← updated
import type { Connector } from "wagmi";

declare global {
  interface Window {
    ethereum?: any;
  }
}


// Supported tokens
type VortexToken = {
  symbol: "USDT" | "cUSD" | "CKES" | "USDC";
  address: `0x${string}`;
  decimals: number;
  abi: typeof stableTokenABI;
};

const TOKENS: VortexToken[] = [
  {
    symbol: "cUSD",
    address: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    decimals: 18,
    abi: stableTokenABI,
  },
  {
    symbol: "USDC",
    address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    decimals: 6,
    abi: stableTokenABI,
  },
  {
    symbol: "CKES",
    address: "0x1E0433C1769271ECcF4CFF9FDdD515eefE6CdF92",
    decimals: 6,
    abi: stableTokenABI,
  },
  {
    symbol: "USDT",
    address: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
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

  // Wagmi hooks
  const { address: wagmiAddress, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();

  const getUserAddress = async (): Promise<`0x${string}`> => {
    try {
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
          accounts = (await walletClient.getAddresses()) as `0x${string}`[];
        }
        setAddress(accounts[0]);
        return accounts[0];
      }
      if (isConnected && wagmiAddress) {
        setAddress(wagmiAddress as `0x${string}`);
        return wagmiAddress as `0x${string}`;
      }
      if (connectors.length === 0) {
        throw new Error("No Wagmi connectors available");
      }
      const fallback: Connector = connectors[0];
      const data = (await connectAsync({ connector: fallback })) as any;
      const userAcc: string = data.account ?? data.address;
      setAddress(userAcc as `0x${string}`);
      return userAcc as `0x${string}`;
    } catch (err: any) {
      // err clear message
      const message =
        err?.shortMessage ||
        err?.message ||
        "Unknown error while getting user address";
      throw new Error(`getUserAddress failed: ${message}`);
    }
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
    const balance = await getTokenBalance(userAddress, token);
    if (balance < amountInWei) {
      throw new Error(
        `Insufficient balance for selected token.`
      );
    }
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
