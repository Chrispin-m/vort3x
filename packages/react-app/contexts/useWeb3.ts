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
  hexToBigInt,
} from "viem";
import { celoAlfajores } from "viem/chains";
import { stableTokenABI } from "@celo/abis";

// Supported tokens for MiniPay (Alfajores addresses)
type MiniPayToken = {
  symbol: "cUSD" | "cEUR" | "cREAL" | "CELO" | "USDC" | "CKES";
  address?: `0x${string}`; // for CELO
  decimals: number;
  abi?: typeof stableTokenABI; 
};
const TOKENS: MiniPayToken[] = [
  {
    symbol: "cUSD",
    address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
    decimals: 18,
    abi: stableTokenABI,
  },
  {
    symbol: "cEUR",
    address: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
    decimals: 18,
    abi: stableTokenABI,
  },
  {
    symbol: "cREAL",
    address: "0xE4D517785D091D3c54818832dB6094bcc2744545",
    decimals: 18,
    abi: stableTokenABI,
  },
  {
    symbol: "USDC",
    address: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
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
    symbol: "CELO",
    address: undefined, // Native
    decimals: 18,
    abi: undefined,
  },
];

const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(),
});

// Fixed buffer for CELO fees (0.01 CELO)
const CELO_FEE_BUFFER = parseEther("0.01");

export const useWeb3 = () => {
  const [address, setAddress] = useState<`0x${string}` | null>(null);

  // Get user address (MiniPay or regular wallet)
  const getUserAddress = async (): Promise<`0x${string}`> => {
    if (typeof window !== "undefined" && window.ethereum) {
      let accounts: `0x${string}`[] = [];
      if ((window.ethereum as any).isMiniPay) {
        accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
          params: [],
        });
      } else {
        const walletClient = createWalletClient({
          transport: custom(window.ethereum),
          chain: celoAlfajores,
        });
        accounts = (await walletClient.getAddresses()) as `0x${string}`[];
      }
      setAddress(accounts[0]);
      return accounts[0];
    }
    throw new Error("No injected wallet found");
  };

  // Get token balance (internal)
  const getTokenBalance = async (
    userAddress: `0x${string}`,
    token: MiniPayToken
  ): Promise<bigint> => {
    if (token.symbol === "CELO") {
      return await publicClient.getBalance({ address: userAddress });
    } else {
      return await publicClient.readContract({
        abi: token.abi!,
        address: token.address!,
        functionName: "balanceOf",
        args: [userAddress],
      });
    }
  };

  // balance check without gas estimation
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
          
          // For CELOamount + fixed fee buffer
          if (balance >= amountInWei + CELO_FEE_BUFFER) {
            return token;
          }
        } else {
          amountInWei = parseUnits(amount, token.decimals);
          const balance = await getTokenBalance(userAddress, token);
          
          // For ERC20 only need amount (fees are separate)
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

  // Send token to another address (auto-selects token)
  const sendToken = async (
    to: `0x${string}`,
    amount: string
  ): Promise<`0x${string}`> => {
    if (!window.ethereum) throw new Error("No wallet found");

    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
      chain: celoAlfajores,
    });

    const [userAddress] = (await walletClient.getAddresses()) as [
      `0x${string}`
    ];

    // Find token with sufficient balance
    const token = await findTokenWithBalance(userAddress, amount, to);
    
    // Convert amount to wei
    let amountInWei: bigint;
    if (token.symbol === "CELO") {
      amountInWei = parseEther(amount);
    } else {
      amountInWei = parseUnits(amount, token.decimals);
    }

    // Build transaction
    const txRequest = {
      account: userAddress,
      feeCurrency: token.symbol === "CELO" ? undefined : token.address!,
      ...(token.symbol === "CELO"
        ? {
            to,
            value: amountInWei,
          }
        : {
            to: token.address!,
            data: encodeFunctionData({
              abi: token.abi!,
              functionName: "transfer",
              args: [to, amountInWei],
            }),
            value: 0n,
          }),
    };

    // Proceed with transaction - wallet will handle gas estimation
    try {
      const hash = await walletClient.sendTransaction({
        ...txRequest,
        // automatically estimate gas if not provided
      });
      return hash;
    } catch (error: any) {
      console.error("Transaction failed:", error);
      throw new Error(`Transaction failed: ${error.shortMessage || error.message}`);
    }
  };

  // Check if user has enough balance for a transaction
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
  };
};