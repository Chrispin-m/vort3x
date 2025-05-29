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
    amount: string,
    to: `0x${string}`  // recipient address
  ): Promise<{ token: MiniPayToken; fees: bigint }> => {
    for (const token of TOKENS) {
      const decimals = token.decimals;
      //  parseEther for exact decimal handling
      const amountInWei = token.symbol === "CELO" 
        ? parseEther(amount)
        : BigInt(Math.floor(Number(amount) * 10 ** decimals));

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
      
      // Fse actual recipient in dummy transaction
      if (token.symbol === "CELO") {
        dummyTx = {
          account: userAddress,
          to: to,  // Actual recipient
          value: amountInWei,
          feeCurrency: undefined,
        };
      } else {
        dummyTx = {
          account: userAddress,
          to: token.address!,
          // actual recipient in transfer call
          data: encodeFunctionData({
            abi: token.abi!,
            functionName: "transfer",
            args: [to, amountInWei],  // Actual recipient
          }),
          value: 0n,
          feeCurrency: token.address!,
        };
      }

      try {
        const fees = await calculateTxFees(dummyTx, feeCurrency);
        
        // FIX don't subtract fees from transfer amount
        if (token.symbol === "CELO") {
          // For CELO: balance must cover amount + fees
          if (balance >= amountInWei + fees) {
            return { token, fees };
          }
        } else {
          // For ERC20: balance must cover amount (fees are separate)
          if (balance >= amountInWei) {
            return { token, fees };
          }
        }
      } catch (error) {
        console.warn(`Gas estimation failed for ${token.symbol}:`, error);
        // Continue to next token if estimation fails
      }
    }
    throw new Error(`Insufficient balance in all supported tokens Balance: ${balance} AIW: ${amountInWei} Fees: ${fees}`);
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

    // Find which token to use (with actual recipient)
    const { token } = await findTokenWithBalance(userAddress, amount, to);
    const decimals = token.decimals;
    
    // FIX 4: Consistent amount parsing
    const amountInWei = token.symbol === "CELO" 
      ? parseEther(amount)
      : BigInt(Math.floor(Number(amount) * 10 ** decimals));

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
    amount: string,
    to: `0x${string}`  // Added recipient
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
    estimateGas,
    estimateGasPrice,
    calculateTxFees,
    sendToken,
    checkBalanceForTx,
  };
};