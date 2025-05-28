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
import StableTokenABI from "./cusd-abi.json"; // Local ABI JSON file

const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // Alfajores testnet

const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(),
});

export const useWeb3 = () => {
  const [address, setAddress] = useState<string | null>(null);

  const getUserAddress = async (): Promise<string> => {
    if (typeof window !== "undefined" && window.ethereum) {
      // Support both MiniPay and regular wallets
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

  const getCUSDBalance = async (userAddress: string): Promise<string> => {
    const cUSDContract = getContract({
      abi: StableTokenABI.abi,
      address: cUSDTokenAddress,
      publicClient,
    });
    const balanceBigInt = await cUSDContract.read.balanceOf([userAddress]);
    return formatEther(balanceBigInt);
  };

  const estimateGas = async (tx: any): Promise<bigint> => {
    return await publicClient.estimateGas({
      ...tx,
      feeCurrency: cUSDTokenAddress,
    });
  };

  const estimateGasPrice = async (): Promise<bigint> => {
    const gasPriceHex = await publicClient.request({
      method: "eth_gasPrice",
      params: [cUSDTokenAddress],
    });
    return hexToBigInt(gasPriceHex);
  };

  const calculateTxFees = async (tx: any): Promise<bigint> => {
    const gasLimit = await estimateGas(tx);
    const gasPrice = await estimateGasPrice();
    return gasLimit * gasPrice;
  };

  const sendCUSD = async (to: string, amount: string): Promise<string> => {
    if (!window.ethereum) throw new Error("No wallet found");

    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
      chain: celoAlfajores,
    });

    const [userAddress] = await walletClient.getAddresses();
    const amountInWei = parseEther(amount);

    const data = encodeFunctionData({
      abi: StableTokenABI.abi,
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

  const checkBalanceForTx = async (userAddress: string, amount: string) => {
    const balanceStr = await getCUSDBalance(userAddress);
    const balance = parseFloat(balanceStr);
    const amountNeeded = parseFloat(amount);

    if (balance < amountNeeded) {
      throw new Error(
        `Insufficient balance: Required ${amountNeeded} cUSD, but only ${balance} cUSD available.`
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
