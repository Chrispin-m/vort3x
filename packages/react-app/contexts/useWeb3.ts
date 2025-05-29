import { useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  formatEther,
  encodeFunctionData,
  hexToBigInt,
} from "viem";
import { celoAlfajores } from "viem/chains";
import { stableTokenABI } from "@celo/abis";

// Supported tokens for MiniPay (Alfajores addresses)
const TOKENS = [
  {
    symbol: "cUSD",
    address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" as `0x${string}`,
    decimals: 18,
    abi: stableTokenABI,
  },
  {
    symbol: "cEUR",
    address: "0x10c5b2b6d674c9e1e8a2a8c2e6b2f7c9e6c2e6c2" as `0x${string}`,
    decimals: 18,
    abi: stableTokenABI,
  },
  {
    symbol: "cREAL",
    address: "0xE4D517785D091D3c54818832dB6094bcc2744545" as `0x${string}`,
    decimals: 18,
    abi: stableTokenABI,
  },
  {
    symbol: "CELO",
    address: undefined, // Native token
    decimals: 18,
    abi: undefined,
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

  // Get cUSD balance for an address (for backward compatibility)
  const getCUSDBalance = async (userAddress: `0x${string}`): Promise<string> => {
    const balanceInWei: bigint = await publicClient.readContract({
      abi: stableTokenABI,
      address: TOKENS[0].address, // cUSD
      functionName: "balanceOf",
      args: [userAddress],
    });
    return formatEther(balanceInWei);
  };

  // Get token balance (internal)
  const getTokenBalance = async (
    userAddress: `0x${string}`,
    token: typeof TOKENS[number]
  ): Promise<bigint> => {
    if (token.symbol === "CELO") {
      return await publicClient.getBalance({ address: userAddress });
    } else {
      return await publicClient.readContract({
        abi: token.abi!,
        address: token.address,
        functionName: "balanceOf",
        args: [userAddress],
      });
    }
  };

  // Estimate gas for a transaction (in a given token)
  const estimateGas = async (
    tx: {
      account: `0x${string}`;
      to: `0x${string}`;
      data: `0x${string}`;
      value: bigint;
      feeCurrency?: `0x${string}`;
    },
    feeCurrency?: `0x${string}`
  ): Promise<bigint> => {
    return await publicClient.estimateGas({
      ...tx,
      feeCurrency: feeCurrency || undefined,
    });
  };

  // Estimate gas price for a transaction (in a given token)
  const estimateGasPrice = async (
    feeCurrency?: `0x${string}`
  ): Promise<bigint> => {
    const gasPriceHex = await (publicClient as any).transport.request({
      method: "eth_gasPrice",
      params: feeCurrency ? [feeCurrency] : [],
    });
    return hexToBigInt(gasPriceHex as `0x${string}`);
  };

  // Calculate transaction fees in a given token
  const calculateTxFees = async (
    tx: {
      account: `0x${string}`;
      to: `0x${string}`;
      data: `0x${string}`;
      value: bigint;
      feeCurrency?: `0x${string}`;
    },
    feeCurrency?: `0x${string}`
  ): Promise<bigint> => {
    const gasLimit = await estimateGas(tx, feeCurrency);
    const gasPrice = await estimateGasPrice(feeCurrency);
    return gasLimit * gasPrice;
  };

  // Find the first token with enough balance for the transfer + fees
  const findTokenWithBalance = async (
    userAddress: `0x${string}`,
    amount: string
  ) => {
    for (const token of TOKENS) {
      const amountInWei = parseEther(amount);
      const balance = await getTokenBalance(userAddress, token);

      let feeCurrency = token.address;
      if (token.symbol === "CELO") feeCurrency = undefined;
      const dummyTx = {
        account: userAddress,
        to: token.symbol === "CELO" ? userAddress : token.address ?? userAddress,
        data: token.symbol === "CELO" ? "0x" : encodeFunctionData({
          abi: token.abi!,
          functionName: "transfer",
          args: [userAddress, amountInWei],
        }),
        value: token.symbol === "CELO" ? amountInWei : 0n,
        feeCurrency,
      };
      const fees = await calculateTxFees(dummyTx, feeCurrency);

      if (balance >= amountInWei + fees) {
        return { token, fees };
      }
    }
    throw new Error("Insufficient balance in all supported tokens.");
  };

  // Send cUSD to another address (now auto-selects token)
  const sendCUSD = async (
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

    // Find which token to use
    const { token } = await findTokenWithBalance(userAddress, amount);
    const amountInWei = parseEther(amount);

    let txRequest: any;
    if (token.symbol === "CELO") {
      txRequest = {
        account: userAddress,
        to,
        value: amountInWei,
        feeCurrency: undefined,
      };
    } else {
      const data = encodeFunctionData({
        abi: token.abi!,
        functionName: "transfer",
        args: [to, amountInWei],
      });
      txRequest = {
        account: userAddress,
        to: token.address,
        data,
        value: 0n,
        feeCurrency: token.address,
      };
    }

    const gas = await estimateGas(txRequest, txRequest.feeCurrency);
    const gasPrice = await estimateGasPrice(txRequest.feeCurrency);

    const hash = await walletClient.sendTransaction({
      ...txRequest,
      gas,
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: gasPrice,
    });

    return hash as `0x${string}`;
  };

  // Check if user has enough balance for a transaction (auto-selects token)
  const checkBalanceForTx = async (
    userAddress: `0x${string}`,
    amount: string
  ) => {
    try {
      await findTokenWithBalance(userAddress, amount);
    } catch (e: any) {
      throw new Error(e.message);
    }
  };

  return {
    address,
    getUserAddress,
    getCUSDBalance,
    estimateGas,
    estimateGasPrice,
    calculateTxFees,
    sendCUSD, // supports all tokens
    checkBalanceForTx,
  };
};
