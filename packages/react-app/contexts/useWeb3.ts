import { useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  formatUnits,
  encodeFunctionData,
  hexToBigInt,
} from "viem";
import { celoAlfajores } from "viem/chains";
import { stableTokenABI } from "@celo/abis";

// Supported tokens for MiniPay (Alfajores addresses)
type MiniPayToken = {
  symbol: "cUSD" | "cEUR" | "cREAL" | "CELO" | "USDC" | "USDT";
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
    address: "0x10c5b2b6d674c9e1e8a2a8c2e6b2f7c9e6c2e6c2", // Replace with actual cEUR address if needed
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
    address: "0x6cC083Aed9e7E6E5eB6bA0b7bA8eB5eE5b7eB5eE", // Replace with actual USDC address on Alfajores
    decimals: 6,
    abi: stableTokenABI,
  },
  {
    symbol: "USDT",
    address: "0x617f3112bf5397D0467D315cC709EF968D9ba546", // Replace with actual USDT address on Alfajores
    decimals: 6,
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

  // Estimate gas for a transaction (in a given token)
  const estimateGas = async (
    tx: {
      account: `0x${string}`;
      to: `0x${string}`;
      data?: `0x${string}`;
      value: bigint;
      feeCurrency?: `0x${string}`;
    },
    feeCurrency?: `0x${string}`
  ): Promise<bigint> => {
    return await publicClient.estimateGas({
      ...tx,
      feeCurrency: feeCurrency,
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
      data?: `0x${string}`;
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
  ): Promise<{ token: MiniPayToken; fees: bigint }> => {
    for (const token of TOKENS) {
      const decimals = token.decimals;
      const amountInWei = BigInt(Math.floor(Number(amount) * 10 ** decimals));
      const balance = await getTokenBalance(userAddress, token);

      let feeCurrency: `0x${string}` | undefined = token.address;
      if (token.symbol === "CELO") feeCurrency = undefined;

      let dummyTx: {
        account: `0x${string}`;
        to: `0x${string}`;
        data?: `0x${string}`;
        value: bigint;
        feeCurrency?: `0x${string}`;
      };
      if (token.symbol === "CELO") {
        dummyTx = {
          account: userAddress,
          to: userAddress,
          value: amountInWei,
          feeCurrency: undefined,
        };
      } else {
        dummyTx = {
          account: userAddress,
          to: token.address!,
          data: encodeFunctionData({
            abi: token.abi!,
            functionName: "transfer",
            args: [userAddress, amountInWei],
          }),
          value: 0n,
          feeCurrency: token.address!,
        };
      }
      const fees = await calculateTxFees(dummyTx, feeCurrency);

      if (balance >= amountInWei + fees) {
        return { token, fees };
      }
    }
    throw new Error("Insufficient balance in all supported tokens.");
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

    // Find which token to use
    const { token } = await findTokenWithBalance(userAddress, amount);
    const decimals = token.decimals;
    const amountInWei = BigInt(Math.floor(Number(amount) * 10 ** decimals));

    let txRequest: {
      account: `0x${string}`;
      to: `0x${string}`;
      data?: `0x${string}`;
      value: bigint;
      feeCurrency?: `0x${string}`;
    };
    if (token.symbol === "CELO") {
      txRequest = {
        account: userAddress,
        to,
        value: amountInWei,
        feeCurrency: undefined,
      };
    } else {
      txRequest = {
        account: userAddress,
        to: token.address!,
        data: encodeFunctionData({
          abi: token.abi!,
          functionName: "transfer",
          args: [to, amountInWei],
        }),
        value: 0n,
        feeCurrency: token.address!,
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

    return hash;
  };

  // Check if user has enough balance for a transaction (auto-selects token)
  const checkBalanceForTx = async (
    userAddress: `0x${string}`,
    amount: string
  ): Promise<void> => {
    try {
      await findTokenWithBalance(userAddress, amount);
    } catch (e: any) {
      throw new Error(e.message);
    }
  };

  return {
    address,
    getUserAddress,
    estimateGas,
    estimateGasPrice,
    calculateTxFees,
    sendToken,
    checkBalanceForTx,
  };
};
