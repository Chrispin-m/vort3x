import { useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  getContract,
  http,
  parseEther,
  formatEther,
  encodeFunctionData,
  hexToBigInt,
} from "viem";
import type { Address, RpcTransactionRequest } from "viem";
import { celoAlfajores } from "viem/chains";
import { stableTokenABI } from "@celo/abis";

// cUSD on Alfajores
const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" as Address;

const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(),
});

export const useWeb3 = () => {
  const [address, setAddress] = useState<Address | null>(null);

  // — Get connected address (MiniPay or injected) —
  const getUserAddress = async (): Promise<Address> => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No injected wallet found");
    }

    let accounts: Address[];
    if ((window.ethereum as any).isMiniPay) {
      // MiniPay provider
      const result = await (window.ethereum as any).request({
        method: "eth_requestAccounts",
      });
      accounts = result as Address[];
    } else {
      // Generic injected wallet
      const walletClient = createWalletClient({
        transport: custom(window.ethereum),
        chain: celoAlfajores,
      });
      accounts = (await walletClient.getAddresses()) as Address[];
    }

    if (!accounts.length) {
      throw new Error("No accounts returned by wallet");
    }

    setAddress(accounts[0]);
    return accounts[0];
  };

  // — Get cUSD balance (returns decimal string) —
  const getCUSDBalance = async (user: Address): Promise<string> => {
    const balanceWei = await publicClient.readContract({
      abi: stableTokenABI,
      address: cUSDTokenAddress,
      functionName: "balanceOf",
      args: [user],
    }) as bigint;

    return formatEther(balanceWei);
  };

  // — Estimate gas (in gas units) —
  const estimateGas = async (
    tx: Omit<RpcTransactionRequest, "type">
  ): Promise<bigint> => {
    return publicClient.estimateGas({
      ...tx,
      feeCurrency: cUSDTokenAddress,
    });
  };

  // — Get current gas price (in wei) —
  const estimateGasPrice = async (): Promise<bigint> => {
    // Viem exposes getGasPrice()
    return publicClient.getGasPrice();
  };

  // — Calculate total fee (gas * gasPrice) —
  const calculateTxFees = async (
    tx: Omit<RpcTransactionRequest, "type">
  ): Promise<bigint> => {
    const gas = await estimateGas(tx);
    const price = await estimateGasPrice();
    return gas * price;
  };

  // — Send cUSD transfer; returns tx hash —
  const sendCUSD = async (
    to: Address,
    amount: string
  ): Promise<`0x${string}`> => {
    if (!window.ethereum) {
      throw new Error("No wallet found");
    }

    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
      chain: celoAlfajores,
    });

    const [userAddr] = (await walletClient.getAddresses()) as Address[];
    const amountWei = parseEther(amount);

    const data = encodeFunctionData({
      abi: stableTokenABI,
      functionName: "transfer",
      args: [to, amountWei],
    });

    const txRequest: RpcTransactionRequest = {
      account: userAddr,
      to: cUSDTokenAddress,
      data,
      value: 0n,
      feeCurrency: cUSDTokenAddress,
    };

    const gas = await publicClient.estimateGas(txRequest);
    const gasPrice = await estimateGasPrice();

    const hash = await walletClient.sendTransaction({
      ...txRequest,
      gas,
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: gasPrice,
    });

    return hash as `0x${string}`;
  };

  // — Ensure user has enough cUSD for `amount` —
  const checkBalanceForTx = async (
    user: Address,
    amount: string
  ): Promise<void> => {
    const balanceWei = await publicClient.readContract({
      abi: stableTokenABI,
      address: cUSDTokenAddress,
      functionName: "balanceOf",
      args: [user],
    }) as bigint;

    const amountWei = parseEther(amount);

    if (balanceWei < amountWei) {
      const have = formatEther(balanceWei);
      const need = formatEther(amountWei);
      throw new Error(
        `Insufficient balance: Required ${need} cUSD, but only ${have} cUSD available.`
      );
    }
  };

  return {
    address,
    getUserAddress,
    getCUSDBalance,
    estimateGas,
    estimateGasPrice,
    calculateTxFees,
    sendCUSD,
    checkBalanceForTx,
  };
};
