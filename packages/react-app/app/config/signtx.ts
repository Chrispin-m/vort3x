import { 
  createPublicClient,
  createWalletClient,
  custom,
  http,
  formatEther,
  parseUnits,
  hexToBigInt,
} from "viem";
import { celoAlfajores, celo } from "viem/chains";
import { stableTokenABI } from "@celo/abis";
import type { PublicClient, WalletClient } from "viem";

// Addresses
const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a";       // Mainnet cUSD
const CUSD_ALFAJORES = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // Alfajores cUSD

/**
 * Detect injected wallet and return single address (supports MiniPay). 
 */
export async function getConnectedAddress(): Promise<string | null> {
  if (typeof window === "undefined" || !window.ethereum) return null;
  // Request accounts
  const accounts: string[] = await window.ethereum.request({
    method: "eth_requestAccounts",
    params: [],
  });
  return accounts[0] || null;
}

/**
 * Create a public client for Celo network.
 * @param testnet - whether to use Alfajores testnet
 */
function getPublicClient(testnet = false): PublicClient {
  return createPublicClient({
    chain: testnet ? celoAlfajores : celo,
    transport: http(),
  });
}

/**
 * Create a wallet client bound to injected provider.
 */
function getWalletClient(testnet = false): WalletClient {
  return createWalletClient({
    chain: testnet ? celoAlfajores : celo,
    transport: custom(window.ethereum!),
  });
}

/**
 * Check cUSD balance for a given address.
 */
export async function checkCusdBalance(
  address: string,
  testnet = false
): Promise<string> {
  const publicClient = getPublicClient(testnet);
  // Instantiate cUSD contract
  const contract = {
    abi: stableTokenABI,
    address: testnet ? CUSD_ALFAJORES : CUSD_ADDRESS,
  };
  // Read balance
  const balanceWei = await publicClient.readContract({
    ...contract,
    functionName: "balanceOf",
    args: [address],
  });
  return formatEther(balanceWei.toString());
}

/**
 * Estimate gas for an ERC-20 transfer in cUSD or native CELO.
 */
export async function estimateGas(
  from: string,
  to: string,
  valueWei: bigint,
  feeCurrencyAddress = "",
  testnet = false
): Promise<bigint> {
  const publicClient = getPublicClient(testnet);
  return publicClient.estimateGas({
    account: from,
    to,
    value: 0n,
    data: publicClient.encodeFunctionData({
      abi: stableTokenABI,
      functionName: "transfer",
      args: [to, valueWei],
    }),
    feeCurrency: feeCurrencyAddress,
  });
}

/**
 * Send a cUSD transfer to target via injected wallet.
 */
export async function sendCusdTransfer(
  receiver: string,
  amount: string,
  testnet = false
): Promise<{ hash: string; success: boolean }> {
  const address = await getConnectedAddress();
  if (!address) throw new Error("No injected wallet found");

  const walletClient = getWalletClient(testnet);
  const publicClient = getPublicClient(testnet);
  const cusdAddr = testnet ? CUSD_ALFAJORES : CUSD_ADDRESS;

  // Compute wei value
  const decimals = 18;
  const valueWei = parseUnits(amount, decimals);

  // Estimate gas and gasPrice
  const feeCurrency = cusdAddr;
  const gasLimit = await estimateGas(address, receiver, valueWei, feeCurrency, testnet);
  const gasPriceHex = await publicClient.request({
    method: "eth_gasPrice",
    params: feeCurrency ? [feeCurrency] : [],
  });
  const gasPrice = hexToBigInt(gasPriceHex as `0x${string}`);

  // Build transaction
  const data = publicClient.encodeFunctionData({
    abi: stableTokenABI,
    functionName: "transfer",
    args: [receiver, valueWei],
  });

  // Send transaction
  const hash = await walletClient.sendTransaction({
    to: cusdAddr,
    data,
    feeCurrency,
    gas: gasLimit,
    maxFeePerGas: gasPrice,
  });

  // Await receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { hash, success: receipt.status === "success" };
}
