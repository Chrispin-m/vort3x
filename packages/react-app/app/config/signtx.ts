// app/config/signtx.ts
// Rewritten to use Viem (v1) and window.ethereum for browser environment

import { createPublicClient, createWalletClient, http, custom } from 'viem';
import { celoAlfajores, celo } from 'viem/chains';
import { stableTokenABI } from '@celo/abis';
import type { Address } from 'viem';

// cUSD contract address on Mainnet & Alfajores
const CUSD_MAINNET = '0x765DE816845861e75A25fCA122bb6898B8B1282a';
const CUSD_ALFAJORES = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';

// Public client for read operations
const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(),
});

/**
 * Detect injected wallet and return the first user address.
 * Supports MiniPay and general injected wallets.
 */
export async function getConnectedAddress(): Promise<Address> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No injected wallet found');
  }
  const eth = window.ethereum as any;
  if (eth.isMiniPay) {
    const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
    return accounts[0] as Address;
  }
  // generic EIP-1193
  const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
  return accounts[0] as Address;
}

/**
 * Check cUSD balance of an address (returns human-readable string)
 */
export async function getCusdBalance(address: Address): Promise<string> {
  const token = publicClient.getContract({
    abi: stableTokenABI,
    address: CUSD_ALFAJORES,
  });
  const bal = await token.read.balanceOf([address]);
  return publicClient.formatUnits(bal, 18);
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
  return publicClient.estimateGas({ ...tx, feeCurrency: feeCurrency || undefined });
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
 * Sign and send a cUSD ERC20 transfer to VortexAddress
 */
export async function SignTx(
  amount: string,
  receiver: Address,
  privateKey: `0x${string}`
): Promise<{
  hash: `0x${string}`;
  value: string;
}> {
  // setup wallet client using injected window.ethereum provider
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No injected wallet found');
  }
  const walletClient = createWalletClient({
    chain: celoAlfajores,
    transport: custom(window.ethereum),
  });

  // parse transfer args
  const decimals = 18;
  const valueHex = publicClient.toHex(publicClient.parseUnits(amount, decimals));

  // encode ERC20 "transfer" call data
  const data = publicClient.encodeFunctionData({
    abi: stableTokenABI,
    functionName: 'transfer',
    args: [receiver, publicClient.parseUnits(amount, decimals)]
  });

  // build transaction
  const account = await getConnectedAddress();
  const txRequest = {
    account,
    to: CUSD_ALFAJORES,
    data,
    value: '0x0',
  };

  // estimate gas and price
  const gasLimit = await estimateGasLimit(txRequest, CUSD_ALFAJORES);
  const gasPrice = await estimateGasPrice(CUSD_ALFAJORES);

  // send transaction
  const hash = await walletClient.sendTransaction({
    ...txRequest,
    gas: gasLimit,
    maxFeePerGas: gasPrice,
    maxPriorityFeePerGas: gasPrice,
  });

  return { hash, value: amount };
}
