import { Contract, parseEther, Signature } from "ethers";
import type { JsonRpcSigner } from "ethers";
import erc20Abi from "../abi/ERC20.json";
import { cusdContractAddress, VortexAddress } from "./addresses";

export interface SignResult {
  hash: string;         // Transaction hash returned after broadcast
  signature: Signature; // Ethers Signature object (r, s, v)
  value: string;        // The input amount as string
  userAddress: string;  // The signer’s address
}

/**
 * Builds, signs, and broadcasts a CUSD → Vortex transfer of `amount`.
 * Checks for sufficient balance before sending.
 */
export async function SignTx(
  amount: string,
  signer: JsonRpcSigner
): Promise<SignResult> {
  // 1) Prepare the ERC-20 contract instance
  const token = new Contract(cusdContractAddress, erc20Abi, signer);

  // 2) Normalize transfer amount and check balance
  const value: bigint = parseEther(amount);
  const from = await signer.getAddress();
  const balance: bigint = await token.balanceOf(from) as bigint;

  if (balance < value) {
    // Convert bigint to string for display (in CUSD units)
    const humanBalance = (balance / 10n ** 18n).toString();
    throw new Error(
      `Insufficient CUSD balance: trying to send ${amount}, but only have ${humanBalance} available.`
    );
  }

  // 3) Populate transfer transaction data
  const txData = await token.populateTransaction.transfer(
    VortexAddress,
    value
  );

  // 4) Gather on-chain metadata
  const provider = signer.provider!;
  const nonce = await provider.getTransactionCount(from);
  const { chainId } = await provider.getNetwork();

  // Optional: set gasCurrency if using Celo fee currency
  const txOptions: any = {
    ...txData,
    from,
    nonce,
    chainId,
    // Uncomment to specify CUSD as fee currency on Celo:
    // feeCurrency: cusdContractAddress,
  };

  // Estimate gas limit with buffer
  const estimatedGas: bigint = await provider.estimateGas(txOptions) as bigint;
  txOptions.gasLimit = (estimatedGas * 110n) / 100n; // +10%

  // 5) Sign & send transaction
  let txResponse;
  try {
    txResponse = await signer.sendTransaction(txOptions);
  } catch (err: any) {
    // Bubble up revert reason if available
    const reason = err?.error?.message || err?.reason || err?.message;
    throw new Error(`Transfer failed: ${reason}`);
  }

  // Wait for confirmation
  const receipt = await txResponse.wait();
  if (receipt.status !== 1) {
    throw new Error(`Transaction reverted in block ${receipt.blockNumber}`);
  }

  // 6) Extract signature
  const sig: Signature = txResponse.signature as Signature;

  return {
    hash: txResponse.hash,
    signature: sig,
    value: amount,
    userAddress: from
  };
}
