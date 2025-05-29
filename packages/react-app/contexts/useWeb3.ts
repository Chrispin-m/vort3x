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
import { celoAlfajores } from "viem/chains";
import { stableTokenABI } from "@celo/abis";

const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // Alfajores testnet

const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(),
});

export const useWeb3 = () => {
  const [address, setAddress] = useState<string | null>(null);

  // Get user address (MiniPay or regular wallet)
  const getUserAddress = async (): Promise<string> => {
    if (typeof window !== "undefined" && window.ethereum) {
      let accounts: string[] = [];
      if (window.ethereum.isMiniPay) {
        accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
          params: [],
      });
    } else {
        const walletClient = createWalletClient({
          transport: custom(window.ethereum),
          chain: celoAlfajores,
      });
        accounts = await walletClient.getAddresses();
    }
    setAddress(accounts[0]);
    return accounts[0];
}
throw new Error("No injected wallet found");
};

  // Get cUSD balance for an address
const getCUSDBalance = async (userAddress:  `0x${string}`): Promise<string> => {
  const balanceInBigNumber = await publicClient.readContract({
    abi: stableTokenABI,
    address: cUSDTokenAddress,
    functionName: "balanceOf",
    args: [userAddress],
});
  const balanceInWei = balanceInBigNumber;
  return formatEther(balanceInWei);
};


  // Estimate gas for a transaction (in cUSD)
const estimateGas = async (tx: any): Promise<bigint> => {
    return await publicClient.estimateGas({
      ...tx,
      feeCurrency: cUSDTokenAddress,
  });
};

  // Estimate gas price for a transaction (in cUSD)
const estimateGasPrice = async (): Promise<bigint> => {
    const gasPriceHex = await publicClient.request({
      method: "eth_gasPrice",
      params: [cUSDTokenAddress as `0x${string}`],
  });
    return hexToBigInt(gasPriceHex);
};

  // Calculate transaction fees in cUSD
const calculateTxFees = async (tx: any): Promise<bigint> => {
    const gasLimit = await estimateGas(tx);
    const gasPrice = await estimateGasPrice();
    return gasLimit * gasPrice;
};

  // Send cUSD to another address
const sendCUSD = async (to: string, amount: string): Promise<string> => {
    if (!window.ethereum) throw new Error("No wallet found");

    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
      chain: celoAlfajores,
  });

    const [userAddress] = await walletClient.getAddresses();
    const amountInWei = parseEther(amount);

    const data = encodeFunctionData({
      abi: stableTokenABI,
      functionName: "transfer",
      args: [to, amountInWei],
  });

    const txRequest = {
      account: userAddress,
      to: cUSDTokenAddress,
      data,
      value: 0n,
      feeCurrency: cUSDTokenAddress,
  };

  const gas = await estimateGas(txRequest);
  const gasPrice = await estimateGasPrice();

  const hash = await walletClient.sendTransaction({
      ...txRequest,
      gas,
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: gasPrice,
  });

  return hash;
};

  // Check if user has enough cUSD for a transaction
const checkBalanceForTx = async (userAddress: string, amount: string) => {
  // fetch raw cUSD balance in wei (bigint)
  const balanceInWei: bigint = await publicClient.readContract({
    abi: stableTokenABI,
    address: cUSDTokenAddress,
    functionName: "balanceOf",
    args: [userAddress as `0x${string}`],
  });

  // parse the requested cUSD amount into wei
  const amountInWei: bigint = parseEther(amount);

  // compare bigints directly
  if (balanceInWei < amountInWei) {
    const balanceReadable = formatEther(balanceInWei);
    const requiredReadable = formatEther(amountInWei);
    throw new Error(
      `Insufficient balance: Required ${requiredReadable} cUSD, but only ${balanceReadable} cUSD available.`
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
