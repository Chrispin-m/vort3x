// app/config/signtx.ts
// Rewritten to use Viem (v1) and window.ethereum for browser environment

import { createPublicClient, createWalletClient, http, custom, getContract, encodeFunctionData, parseUnits, toHex, formatUnits } from 'viem';
import { celoAlfajores } from 'viem/chains';
import { stableTokenABI } from '@celo/abis';
import type { Address } from 'viem';

// cUSD contract address on Alfajores
const CUSD_ALFAJORES = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';

// Public client for read operations
const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(),
});

/**
 * Detect injected wallet and return the first user address.
 * Supports MiniPay and generic injected wallets.
 */
export async function getConnectedAddress(): Promise<Address> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No injected wallet found');
  }
  const eth = window.ethereum as any;
  const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
  return accounts[0] as Address;
}

/**
 * Check cUSD balance of an address (returns human-readable string)
 */
export async function getCusdBalance(address: Address): Promise<string> {
  const token = getContract({
    abi: stableTokenABI,
    address: CUSD_ALFAJORES,
    publicClient,
  });
  const bal = await token.read.balanceOf([address]);
  return formatUnits(bal, 18);
}

/**
 * Check if a transaction succeeded
 */
export async function checkTxSucceeded(hash: `0x${string}`): Promise<boolean> {
  const receipt = await publicClient.getTransactionReceipt({ hash });
  return receipt.status === 'success';
}

/**
 * Estimate gas limit for a transaction, optionally specifying feeCurrency
 */
export async function estimateGasLimit(
  tx: Parameters<typeof publicClient.estimateGas>[0],
  feeCurrency?: Address
): Promise<bigint> {
  return publicClient.estimateGas({ ...tx, feeCurrency });
}

/**
 * Estimate gas price for a transaction, optionally specifying feeCurrency
 */
export async function estimateGasPrice(feeCurrency?: Address): Promise<bigint> {
  return publicClient.request({
    method: 'eth_gasPrice',
    params: feeCurrency ? [feeCurrency] : [],
  }) as Promise<bigint>;
}

/**
 * Sign and send a cUSD ERC20 transfer to a receiver
 */
export async function SignTx(
  amount: string,
  receiver: Address
): Promise<{ hash: `0x${string}`; value: string }> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No injected wallet found');
  }
  const walletClient = createWalletClient({
    chain: celoAlfajores,
    transport: custom(window.ethereum),
  });

  const from = await getConnectedAddress();
  const decimals = 18;
  const valueUnits = parseUnits(amount, decimals);

  // encode ERC20 transfer data
  const data = encodeFunctionData({
    abi: stableTokenABI,
    functionName: 'transfer',
    args: [receiver, valueUnits],
  });

  // build transaction
  const txRequest = {
    account: from,
    to: CUSD_ALFAJORES as Address,
    data,
    value: 0n,
  };

  // estimate gas and price
  const gasLimit = await estimateGasLimit(txRequest, CUSD_ALFAJORES as Address);
  const gasPrice = await estimateGasPrice(CUSD_ALFAJORES as Address);

  // send transaction
  const hash = await walletClient.sendTransaction({
    ...txRequest,
    gas: gasLimit,
    maxFeePerGas: gasPrice,
    maxPriorityFeePerGas: gasPrice,
  });

  return { hash, value: amount };
}
