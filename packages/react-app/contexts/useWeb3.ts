import { useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseUnits,
  formatUnits,
  encodeFunctionData,
  hexToBigInt,
} from "viem";
import { celoAlfajores } from "viem/chains";
import { stableTokenABI } from "@celo/abis";

// Supported MiniPay tokens on Alfajores
const TOKENS = [
  {
    symbol: "cUSD",
    address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
    decimals: 18,
    abi: stableTokenABI,
  },
  {
    symbol: "cEUR",
    address: "0x10c5b2a4c1e5c8b2e0d0b2d2c2e0b2c2e0d0b2d2",
    decimals: 18,
    abi: stableTokenABI,
  },
  {
    symbol: "cREAL",
    address: "0xe4D517785D091D3c54818832dB6094bcc2744545",
    decimals: 18,
    abi: stableTokenABI,
  },
  {
    symbol: "USDC",
    address: "0x6cC083Aed9eA5eE3b0b4cB5fC5a5e5e3b0b4cB5f",
    decimals: 6,
    abi: stableTokenABI,
  },
  {
    symbol: "USDT",
    address: "0x1cFb1e0f3e0b2c2e0d0b2d2c2e0b2c2e0d0b2d2c",
    decimals: 6,
    abi: stableTokenABI,
  },
];

const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(),
});

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

  // Get token balance for an address
  const getTokenBalance = async (
    token: typeof TOKENS[number],
    userAddress: `0x${string}`
  ): Promise<string> => {
    const balanceInWei: bigint = await publicClient.readContract({
      abi: token.abi,
      address: token.address,
      functionName: "balanceOf",
      args: [userAddress],
    });
    return formatUnits(balanceInWei, token.decimals);
  };

  // Estimate gas for a transaction (in a given token)
  const estimateGas = async (tx: {
    account: `0x${string}`;
    to: `0x${string}`;
    data: `0x${string}`;
    value: bigint;
    feeCurrency: `0x${string}`;
  }): Promise<bigint> => {
    return await publicClient.estimateGas({
      ...tx,
      feeCurrency: tx.feeCurrency,
    });
  };

  // Estimate gas price for a transaction (in a given token)
  const estimateGasPrice = async (feeCurrency: `0x${string}`): Promise<bigint> => {
    const gasPriceHex = await (publicClient as any).request({
      method: "eth_gasPrice",
      params: [feeCurrency],
    });
    return hexToBigInt(gasPriceHex as `0x${string}`);
  };

  // transaction fees in a given token
  const calculateTxFees = async (tx: {
    account: `0x${string}`;
    to: `0x${string}`;
    data: `0x${string}`;
    value: bigint;
    feeCurrency: `0x${string}`;
  }): Promise<bigint> => {
    const gasLimit = await estimateGas(tx);
    const gasPrice = await estimateGasPrice(tx.feeCurrency);
    return gasLimit * gasPrice;
  };

  // Send tokens to another address, choosing the first token with enough balance
  const sendToken = async (
    to: `0x${string}`,
    amount: string
  ): Promise<{ hash: `0x${string}`; token: string }> => {
    if (!window.ethereum) throw new Error("No wallet found");

    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
      chain: celoAlfajores,
    });

    const [userAddress] = (await walletClient.getAddresses()) as [`0x${string}`];

    // Find the first token with enough balance
    for (const token of TOKENS) {
      const balanceInWei: bigint = await publicClient.readContract({
        abi: token.abi,
        address: token.address,
        functionName: "balanceOf",
        args: [userAddress],
      });
      const amountInWei = parseUnits(amount, token.decimals);

      if (balanceInWei >= amountInWei) {
        const data = encodeFunctionData({
          abi: token.abi,
          functionName: "transfer",
          args: [to, amountInWei],
        });

        const txRequest = {
          account: userAddress,
          to: token.address,
          data,
          value: 0n,
          feeCurrency: token.address as `0x${string}`,
        };

        const gas = await estimateGas(txRequest);
        const gasPrice = await estimateGasPrice(token.address as `0x${string}`);

        const hash = await walletClient.sendTransaction({
          ...txRequest,
          gas,
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: gasPrice,
        });

        return { hash: hash as `0x${string}`, token: token.symbol };
      }
    }

    throw new Error("Insufficient balance in all supported tokens.");
  };

  // Check balances for all tokens
  const getAllBalances = async (userAddress: `0x${string}`) => {
    const balances: Record<string, string> = {};
    for (const token of TOKENS) {
      balances[token.symbol] = await getTokenBalance(token, userAddress);
    }
    return balances;
  };

  return {
    address,
    getUserAddress,
    getTokenBalance,
    getAllBalances,
    estimateGas,
    estimateGasPrice,
    calculateTxFees,
    sendToken,
  };
};
